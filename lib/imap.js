/** Small IMAP4rev1 client: login, search, fetch, store, and append. */

import { LineSocket } from './socket.js'
import { parseMessage } from './mime.js'

function quote(value) {
  const text = String(value ?? '')
  if (/[\r\n]/.test(text)) throw new Error('Mail credentials may not contain newlines')
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function monthName(month) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]
}

function imapDate(date) {
  return `${date.getUTCDate()}-${monthName(date.getUTCMonth())}-${date.getUTCFullYear()}`
}

/** One authenticated IMAP session. */
export class ImapClient {
  constructor(socket) {
    this.socket = socket
    this.tag = 0
  }

  /**
   * Connect, negotiate STARTTLS when configured, and log in.
   * @param {object} account - host, port, security, username, password.
   * @param {AbortSignal|undefined} signal - cancellation.
   * @returns {Promise<ImapClient>} authenticated session.
   */
  static async connect(account, signal) {
    const secure = account.security === 'tls'
    const socket = await LineSocket.connect({
      host: account.host,
      port: account.port,
      tls: secure,
      servername: account.host,
      signal,
      timeoutMs: 30_000,
    })
    const client = new ImapClient(socket)
    try {
      const greeting = await socket.readLine()
      if (!/^\* (OK|PREAUTH)/i.test(greeting)) throw new Error(`IMAP greeting failed: ${greeting}`)
      if (account.security === 'starttls') {
        const result = await client.command('STARTTLS')
        if (result.status !== 'OK') throw new Error(`STARTTLS failed: ${result.text}`)
        await socket.upgradeToTls(account.host)
      }
      await client.login(account.username, account.password)
      return client
    } catch (error) {
      socket.destroy()
      throw error
    }
  }

  /** Read one logical IMAP response, collecting literal payloads. */
  async readResponse() {
    let text = ''
    const literals = []
    for (;;) {
      const line = await this.socket.readLine()
      const literal = /\{(\d+)\}$/.exec(line)
      if (literal === null) {
        text += line
        return { text, literals }
      }
      const length = Number(literal[1])
      if (!Number.isSafeInteger(length) || length < 0 || length > 50_000_000) {
        throw new Error('IMAP response declared an unacceptable literal size')
      }
      text += `${line.slice(0, literal.index)}\u0000L${literals.length}\u0000`
      literals.push(await this.socket.readBytes(length))
    }
  }

  /**
   * Send one tagged command and collect its untagged responses.
   * @param {string} command - command text without tag.
   * @param {(context: {tag: string}) => Promise<void>|void} [onContinuation] - continuation handler.
   * @returns {Promise<{status:string, text:string, responses:Array}>} tagged result.
   */
  async command(command, onContinuation) {
    const tag = `M${(this.tag += 1)}`
    await this.socket.write(`${tag} ${command}\r\n`)
    const responses = []
    for (;;) {
      const response = await this.readResponse()
      if (response.text.startsWith('+')) {
        if (onContinuation === undefined) throw new Error(`Unexpected IMAP continuation: ${response.text}`)
        await onContinuation({ tag })
        continue
      }
      if (response.text.startsWith(`${tag} `)) {
        const rest = response.text.slice(tag.length + 1)
        const status = rest.split(/\s+/, 1)[0].toUpperCase()
        return { status, text: rest.slice(status.length).trim(), responses }
      }
      responses.push(response)
    }
  }

  /** Try SASL PLAIN, then fall back to LOGIN. */
  async login(username, password) {
    const plain = Buffer.from(`\u0000${username}\u0000${password}`, 'utf8').toString('base64')
    const sasl = await this.command('AUTHENTICATE PLAIN', async () => {
      await this.socket.write(`${plain}\r\n`)
    })
    if (sasl.status === 'OK') return
    const login = await this.command(`LOGIN ${quote(username)} ${quote(password)}`)
    if (login.status !== 'OK') throw new Error(`IMAP login failed: ${login.text}`)
  }

  /** Select one folder and return its message count. */
  async select(folder) {
    const result = await this.command(`SELECT ${quote(folder)}`)
    if (result.status !== 'OK') throw new Error(`Cannot open folder ${folder}: ${result.text}`)
    let exists = 0
    for (const response of result.responses) {
      const match = /^\* (\d+) EXISTS/.exec(response.text)
      if (match !== null) exists = Number(match[1])
    }
    return { exists }
  }

  /** Search UIDs, newest first. */
  async search({ unreadOnly = false, sinceDays = 30 } = {}) {
    const criteria = []
    if (unreadOnly) criteria.push('UNSEEN')
    if (sinceDays > 0) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
      criteria.push(`SINCE ${imapDate(since)}`)
    }
    if (criteria.length === 0) criteria.push('ALL')
    const result = await this.command(`UID SEARCH ${criteria.join(' ')}`)
    if (result.status !== 'OK') throw new Error(`IMAP search failed: ${result.text}`)
    const uids = []
    for (const response of result.responses) {
      const match = /^\* SEARCH(.*)$/.exec(response.text)
      if (match === null) continue
      for (const token of match[1].trim().split(/\s+/)) {
        if (/^\d+$/.test(token)) uids.push(Number(token))
      }
    }
    return uids.sort((left, right) => right - left)
  }

  /**
   * Fetch a page of messages with headers and a bounded body preview.
   * @param {number[]} uids - UIDs to fetch.
   * @param {number} previewBytes - maximum body bytes per message.
   * @returns {Promise<Array>} parsed summaries.
   */
  async fetchSummaries(uids, previewBytes = 131_072) {
    if (uids.length === 0) return []
    const set = uids.join(',')
    const result = await this.command(
      `UID FETCH ${set} (UID FLAGS INTERNALDATE BODY.PEEK[]<0.${previewBytes}>)`,
    )
    if (result.status !== 'OK') throw new Error(`IMAP fetch failed: ${result.text}`)
    const messages = []
    for (const response of result.responses) {
      if (!/^\* \d+ FETCH \(/.test(response.text)) continue
      const uidMatch = /\bUID (\d+)/.exec(response.text)
      if (uidMatch === null) continue
      const literalMatch = /\u0000L(\d+)\u0000/.exec(response.text)
      if (literalMatch === null) continue
      const literal = response.literals[Number(literalMatch[1])]
      if (literal === undefined) continue
      const parsed = parseMessage(literal)
      const flags = /\bFLAGS \(([^)]*)\)/.exec(response.text)?.[1] ?? ''
      const internal = /\bINTERNALDATE "([^"]*)"/.exec(response.text)?.[1] ?? ''
      messages.push({
        uid: Number(uidMatch[1]),
        flags,
        unread: !/\\Seen/i.test(flags),
        internalDate: internal,
        ...parsed,
      })
    }
    const byUid = new Map(messages.map(message => [message.uid, message]))
    return uids.map(uid => byUid.get(uid)).filter(message => message !== undefined)
  }

  /** Read the next UID the server will assign in one folder. */
  async uidNext(folder) {
    const result = await this.command(`STATUS ${quote(folder)} (UIDNEXT MESSAGES)`)
    if (result.status !== 'OK') throw new Error(`IMAP STATUS failed: ${result.text}`)
    for (const response of result.responses) {
      const match = /^\* STATUS .*UIDNEXT (\d+)/i.exec(response.text)
      if (match !== null) return Number(match[1])
    }
    throw new Error(`IMAP STATUS did not report UIDNEXT for ${folder}`)
  }

  /** Fetch one full message by UID. */
  async fetchMessage(uid) {
    const result = await this.command(`UID FETCH ${Number(uid)} (UID FLAGS BODY.PEEK[])`)
    if (result.status !== 'OK') throw new Error(`IMAP fetch failed: ${result.text}`)
    for (const response of result.responses) {
      if (!/^\* \d+ FETCH \(/.test(response.text)) continue
      const literalMatch = /\u0000L(\d+)\u0000/.exec(response.text)
      if (literalMatch === null) continue
      const literal = response.literals[Number(literalMatch[1])]
      if (literal === undefined) continue
      const parsed = parseMessage(literal)
      const flags = /\bFLAGS \(([^)]*)\)/.exec(response.text)?.[1] ?? ''
      return { ...parsed, uid: Number(uid), flags, unread: !/\\Seen/i.test(flags), rawSize: literal.length }
    }
    throw new Error(`Message UID ${uid} was not found in the selected folder`)
  }

  /** Add the Seen flag to one message. */
  async markSeen(uid) {
    const result = await this.command(`UID STORE ${Number(uid)} +FLAGS (\\Seen)`)
    if (result.status !== 'OK') throw new Error(`IMAP store failed: ${result.text}`)
  }

  /** Append a raw message to a folder, best effort for a Sent copy. */
  async append(folder, raw) {
    const bytes = Buffer.from(raw, 'utf8')
    const result = await this.command(
      `APPEND ${quote(folder)} (\\Seen) {${bytes.length}}`,
      async () => {
        await this.socket.write(bytes)
        await this.socket.write('\r\n')
      },
    )
    if (result.status !== 'OK') throw new Error(`IMAP append failed: ${result.text}`)
  }

  /** Close the session politely. */
  async logout() {
    try {
      await this.command('LOGOUT')
    } catch {
      // The server may close the connection before answering LOGOUT.
    } finally {
      this.socket.close()
    }
  }
}

/**
 * Test IMAP connectivity and credentials without fetching mail.
 * @param {object} account - connection and credential fields.
 * @param {AbortSignal|undefined} signal - cancellation.
 * @returns {Promise<{ok:true, messages:number}>} folder count.
 */
export async function testImap(account, signal) {
  const client = await ImapClient.connect(account, signal)
  try {
    const { exists } = await client.select(account.folder ?? 'INBOX')
    return { ok: true, messages: exists }
  } finally {
    await client.logout()
  }
}

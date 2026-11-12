/** Small SMTP submission client for multipart/alternative replies. */

import os from 'node:os'
import { LineSocket } from './socket.js'
import { buildMessage } from './mime.js'
import { isMailAddress } from './util.js'

const CRLF = '\r\n'

function expectCode(reply, accepted) {
  if (!accepted.includes(reply.code)) {
    throw new Error(`SMTP ${reply.code}: ${reply.text}`)
  }
}

/** One SMTP transaction client. */
export class SmtpClient {
  constructor(socket) {
    this.socket = socket
    this.capabilities = []
  }

  /**
   * Connect, optionally STARTTLS, and authenticate.
   * @param {object} account - host, port, security, username, password.
   * @param {AbortSignal|undefined} signal - cancellation.
   * @returns {Promise<SmtpClient>} ready client.
   */
  static async connect(account, signal) {
    const socket = await LineSocket.connect({
      host: account.host,
      port: account.port,
      tls: account.security === 'tls',
      servername: account.host,
      signal,
      timeoutMs: 30_000,
    })
    const client = new SmtpClient(socket)
    try {
      expectCode(await client.readReply(), [220])
      await client.ehlo()
      if (account.security === 'starttls') {
        await socket.write(`STARTTLS${CRLF}`)
        expectCode(await client.readReply(), [220])
        await socket.upgradeToTls(account.host)
        await client.ehlo()
      }
      await client.authenticate(account.username, account.password)
      return client
    } catch (error) {
      socket.destroy()
      throw error
    }
  }

  /** Read one (possibly multiline) SMTP reply. */
  async readReply() {
    const lines = []
    for (;;) {
      const line = await this.socket.readLine()
      lines.push(line)
      if (line.length < 4 || line[3] !== '-') {
        const code = Number(line.slice(0, 3))
        return { code: Number.isFinite(code) ? code : 0, text: lines.join('\n') }
      }
    }
  }

  /** Send EHLO and retain the advertised capabilities. */
  async ehlo() {
    const hostname = os.hostname().replace(/[^A-Za-z0-9.-]/g, '') || 'localhost'
    await this.socket.write(`EHLO ${hostname}${CRLF}`)
    const reply = await this.readReply()
    expectCode(reply, [250])
    this.capabilities = reply.text
      .split('\n')
      .slice(1)
      .map(line => line.slice(4).trim().toUpperCase())
  }

  /** Authenticate with AUTH PLAIN or AUTH LOGIN. */
  async authenticate(username, password) {
    if (username === '' && password === '') return
    const authLine = this.capabilities.find(line => line.startsWith('AUTH'))
    const advertisesPlain = authLine === undefined || authLine.includes('PLAIN')
    if (advertisesPlain) {
      const token = Buffer.from(`\u0000${username}\u0000${password}`, 'utf8').toString('base64')
      await this.socket.write(`AUTH PLAIN ${token}${CRLF}`)
      let reply = await this.readReply()
      if (reply.code === 334) {
        await this.socket.write(`${token}${CRLF}`)
        reply = await this.readReply()
      }
      if (reply.code === 235) return
      if (reply.code !== 504 && reply.code !== 500 && reply.code !== 334) {
        throw new Error(`SMTP authentication failed: ${reply.text}`)
      }
    }
    await this.socket.write(`AUTH LOGIN${CRLF}`)
    expectCode(await this.readReply(), [334])
    await this.socket.write(`${Buffer.from(username, 'utf8').toString('base64')}${CRLF}`)
    expectCode(await this.readReply(), [334])
    await this.socket.write(`${Buffer.from(password, 'utf8').toString('base64')}${CRLF}`)
    const reply = await this.readReply()
    if (reply.code !== 235) throw new Error(`SMTP authentication failed: ${reply.text}`)
  }

  /** Submit one message for the given envelope recipients. */
  async send(envelopeFrom, recipients, raw) {
    await this.socket.write(`MAIL FROM:<${envelopeFrom}>${CRLF}`)
    expectCode(await this.readReply(), [250])
    for (const recipient of recipients) {
      await this.socket.write(`RCPT TO:<${recipient}>${CRLF}`)
      const reply = await this.readReply()
      expectCode(reply, [250, 251])
    }
    await this.socket.write(`DATA${CRLF}`)
    expectCode(await this.readReply(), [354])
    const normalized = raw.replace(/\r?\n/g, CRLF).replace(/\r\n$/, '')
    const stuffed = normalized
      .split(CRLF)
      .map(line => (line.startsWith('.') ? `.${line}` : line))
      .join(CRLF)
    await this.socket.write(`${stuffed}${CRLF}.${CRLF}`)
    expectCode(await this.readReply(), [250])
  }

  /** End the session. */
  async quit() {
    try {
      await this.socket.write(`QUIT${CRLF}`)
      await this.readReply()
    } catch {
      // The server may close first.
    } finally {
      this.socket.close()
    }
  }
}

/**
 * Test SMTP connectivity and credentials without sending mail.
 * @param {object} account - connection and credential fields.
 * @param {AbortSignal|undefined} signal - cancellation.
 * @returns {Promise<{ok:true}>} success marker.
 */
export async function testSmtp(account, signal) {
  const client = await SmtpClient.connect(account, signal)
  await client.quit()
  return { ok: true }
}

/**
 * Build and submit a multipart/alternative message.
 * @param {object} options - account, password, envelope, and content fields.
 * @param {AbortSignal|undefined} signal - cancellation.
 * @returns {Promise<{messageId:string, raw:string, recipients:string[]}>} submitted message.
 */
export async function sendMail(options, signal) {
  const { account } = options
  const to = options.to ?? []
  const cc = options.cc ?? []
  const bcc = options.bcc ?? []
  const recipients = [...to, ...cc, ...bcc].map(entry => entry.address).filter(isMailAddress)
  if (recipients.length === 0) throw new Error('No valid recipient address')
  const message = buildMessage({
    from: { name: account.name, address: account.address },
    to,
    cc,
    bcc,
    subject: options.subject ?? '',
    html: options.html ?? '',
    text: options.text ?? '',
    inReplyTo: options.inReplyTo,
    references: options.references,
  })
  const client = await SmtpClient.connect({
    host: account.smtpHost,
    port: account.smtpPort,
    security: account.smtpSecurity,
    username: account.username,
    password: options.password,
  }, signal)
  try {
    await client.send(account.address, recipients, message.raw)
  } finally {
    await client.quit()
  }
  return { messageId: message.messageId, raw: message.raw, recipients }
}

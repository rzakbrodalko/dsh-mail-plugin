import assert from 'node:assert/strict'
import net from 'node:net'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ImapClient } from '../lib/imap.js'
import { SmtpClient } from '../lib/smtp.js'
import { MailStore } from '../lib/store.js'
import { MailService } from '../lib/service.js'

/** Fail on any undefined member, which the tool output contract rejects. */
function assertNoUndefined(value, path = 'value') {
  if (value === undefined) throw new Error(`${path} is undefined`)
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUndefined(item, `${path}[${index}]`))
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) assertNoUndefined(item, `${path}.${key}`)
  }
}

const SAMPLE = [
  'From: Alice <alice@partner.org>',
  'To: me@example.com',
  'Subject: Quarterly plan',
  'Date: Wed, 12 Nov 2026 09:30:00 +0000',
  'Message-ID: <source@partner.org>',
  'References: <root@partner.org>',
  'MIME-Version: 1.0',
  'Content-Type: multipart/alternative; boundary="b"',
  '',
  '--b',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Could you confirm the plan?',
  '--b',
  'Content-Type: text/html; charset=utf-8',
  '',
  '<p>Could you <strong>confirm</strong> the plan?</p>',
  '--b--',
  '',
].join('\r\n')

/** Minimal IMAP server for the client's command subset. */
function startImap() {
  const server = net.createServer(socket => {
    socket.setEncoding('utf8')
    let buffer = ''
    let awaitingAuth = false
    let append = null
    socket.write('* OK mock IMAP ready\r\n')
    socket.on('data', chunk => {
      buffer += chunk
      for (;;) {
        if (append !== null) {
          if (buffer.length < append.length + 2) return
          buffer = buffer.slice(append.length + 2)
          socket.write(`${append.tag} OK appended\r\n`)
          append = null
          continue
        }
        if (awaitingAuth) {
          const end = buffer.indexOf('\r\n')
          if (end < 0) return
          buffer = buffer.slice(end + 2)
          awaitingAuth = false
          socket.write('M1 OK authenticated\r\n')
          continue
        }
        const end = buffer.indexOf('\r\n')
        if (end < 0) return
        const line = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        const [tag, ...rest] = line.split(' ')
        const command = rest.join(' ').toUpperCase()
        if (command.startsWith('AUTHENTICATE')) {
          socket.write('+ \r\n')
          awaitingAuth = true
        } else if (command.startsWith('SELECT')) {
          socket.write('* 2 EXISTS\r\n')
          socket.write(`${tag} OK [READ-WRITE] selected\r\n`)
        } else if (command.startsWith('STATUS')) {
          socket.write('* STATUS INBOX (MESSAGES 2 UIDNEXT 13)\r\n')
          socket.write(`${tag} OK status done\r\n`)
        } else if (command.startsWith('UID SEARCH')) {
          socket.write('* SEARCH 12 11\r\n')
          socket.write(`${tag} OK search done\r\n`)
        } else if (command.startsWith('UID FETCH 12,11')) {
          for (const uid of [12, 11]) {
            socket.write(`* ${uid} FETCH (UID ${uid} FLAGS () INTERNALDATE "12-Nov-2026 09:30:00 +0000" BODY[]<0> {${Buffer.byteLength(SAMPLE)}}\r\n`)
            socket.write(SAMPLE)
            socket.write(')\r\n')
          }
          socket.write(`${tag} OK fetch done\r\n`)
        } else if (command.startsWith('UID FETCH 12')) {
          socket.write(`* 2 FETCH (UID 12 FLAGS (\\Seen) BODY[] {${Buffer.byteLength(SAMPLE)}}\r\n`)
          socket.write(SAMPLE)
          socket.write(')\r\n')
          socket.write(`${tag} OK fetch done\r\n`)
        } else if (command.startsWith('UID STORE')) {
          socket.write(`${tag} OK stored\r\n`)
        } else if (command.startsWith('APPEND')) {
          const match = /\{(\d+)\}$/.exec(command)
          append = { length: match ? Number(match[1]) : 0, tag }
          socket.write('+ go ahead\r\n')
        } else if (command.startsWith('LOGOUT')) {
          socket.write('* BYE\r\n')
          socket.write(`${tag} OK bye\r\n`)
        } else {
          socket.write(`${tag} BAD unknown\r\n`)
        }
      }
    })
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })))
}

/** Minimal SMTP server that accepts one transaction. */
function startSmtp() {
  const captured = []
  const server = net.createServer(socket => {
    socket.setEncoding('utf8')
    let buffer = ''
    let dataMode = false
    let data = ''
    socket.write('220 mock SMTP\r\n')
    socket.on('data', chunk => {
      buffer += chunk
      for (;;) {
        if (dataMode) {
          const end = buffer.indexOf('\r\n.\r\n')
          if (end < 0) return
          data += buffer.slice(0, end)
          buffer = buffer.slice(end + 5)
          captured.push(data)
          data = ''
          dataMode = false
          socket.write('250 queued\r\n')
          continue
        }
        const end = buffer.indexOf('\r\n')
        if (end < 0) return
        const line = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        const upper = line.toUpperCase()
        if (upper.startsWith('EHLO')) socket.write('250-mock\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n')
        else if (upper.startsWith('AUTH PLAIN')) socket.write('235 authenticated\r\n')
        else if (upper.startsWith('MAIL FROM')) socket.write('250 ok\r\n')
        else if (upper.startsWith('RCPT TO')) socket.write('250 ok\r\n')
        else if (upper === 'DATA') { dataMode = true; socket.write('354 send data\r\n') }
        else if (upper === 'QUIT') { socket.write('221 bye\r\n'); socket.end() }
        else socket.write('250 ok\r\n')
      }
    })
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, captured })))
}

const imap = await startImap()
const smtp = await startSmtp()
try {
  // Direct IMAP client.
  const client = await ImapClient.connect({
    host: '127.0.0.1', port: imap.port, security: 'none',
    username: 'me@example.com', password: 'secret', folder: 'INBOX',
  })
  await client.select('INBOX')
  assert.equal(await client.uidNext('INBOX'), 13)
  assert.deepEqual(await client.search({ sinceDays: 30 }), [12, 11])
  const summaries = await client.fetchSummaries([12, 11])
  assert.equal(summaries.length, 2)
  assert.equal(summaries[0].subject, 'Quarterly plan')
  const full = await client.fetchMessage(12)
  assert.match(full.text, /confirm the plan/)
  assert.match(full.html, /<strong>confirm<\/strong>/)
  assert.match(full.references, /root@partner.org/)
  await client.logout()

  // Direct SMTP client.
  const smtpClient = await SmtpClient.connect({
    host: '127.0.0.1', port: smtp.port, security: 'none',
    username: 'me@example.com', password: 'secret',
  })
  const raw = 'From: me@example.com\r\nTo: alice@partner.org\r\nSubject: Test\r\n\r\n.line one\r\nbody\r\n'
  await smtpClient.send('me@example.com', ['alice@partner.org'], raw)
  await smtpClient.quit()
  assert.equal(smtp.captured.length, 1)
  assert.match(smtp.captured[0], /^\.\.line one/m)

  // Full service: list, read, draft, review decision.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-mail-proto-'))
  const store = new MailStore(directory)
  await store.saveSettings({
    account: {
      address: 'me@example.com', name: 'Me', username: 'me@example.com',
      imapHost: '127.0.0.1', imapPort: imap.port, imapSecurity: 'none',
      smtpHost: '127.0.0.1', smtpPort: smtp.port, smtpSecurity: 'none',
      folder: 'INBOX', sentFolder: 'Sent',
    },
    review: { mode: 'allowlist', trustedDomains: ['example.com'] },
  })
  const fakeCtx = {
    get(name) {
      if (name === 'credentials') {
        return {
          async readRecord() { return { kind: 'grant', payload: { password: 'secret' } } },
          async modifyRecord() {},
          async deleteRecord() {},
        }
      }
      return undefined
    },
  }
  const service = new MailService(fakeCtx, {})
  service.store = store
  const initialPing = await service.handleRpc('status')
  assert.equal(initialPing.configured, true)
  const tested = await service.handleRpc('settings/test', {
    account: { ...store.getSettings().account },
    password: '',
  })
  assert.equal(tested.imap.ok, true)
  assert.equal(tested.smtp.ok, true)
  const saved = await service.handleRpc('settings/save', {
    account: { ...store.getSettings().account },
    review: { mode: 'always', trustedDomains: ['partner.org'] },
    password: '',
  })
  assert.equal(saved.review.mode, 'always')
  assert.deepEqual(saved.review.trustedDomains, ['partner.org'])

  // Watcher: a new unseen UID wakes the recorded root session exactly once.
  const notified = []
  const fakeAgent = {
    session: { id: 'session-1' },
    status: 'idle',
    followup(message) { notified.push(message) },
  }
  const watchCtx = {
    get(name) {
      if (name === 'credentials') return fakeCtx.get('credentials')
      if (name === 'agents') {
        return {
          get: id => (id === 'session-1' ? fakeAgent : undefined),
          list: () => [fakeAgent],
        }
      }
      return undefined
    },
  }
  const watcher = new MailService(watchCtx, {})
  watcher.store = store
  await store.saveWatcher({ enabled: true, lastUid: 11 })
  const pass = await watcher.pollMailbox()
  assert.equal(pass.new, 1)
  assert.deepEqual(pass.uids, [12])
  assert.match(notified[0].content[0].text, /UIDs: 12/)
  assert.equal(store.getWatcher().lastUid, 12)
  assert.equal(store.getWatcher().targetSessionId, 'session-1')
  await store.saveWatcher({ enabled: false })

  const listed = await service.listMessages({ limit: 2 })
  assert.equal(listed.messages.length, 2)
  assert.equal(listed.messages[0].from, 'Alice <alice@partner.org>')
  const read = await service.readMessage({ uid: 12 })
  assert.match(read.text, /confirm the plan/)
  const reply = await service.createReply({
    uid: 12,
    html: '<p>Confirmed, thank you.</p>',
    text: 'Confirmed, thank you.',
  })
  assert.equal(reply.reviewRequired, true)
  assert.equal(reply.status, 'pending_review')
  const pendingList = await service.handleRpc('drafts/list')
  assert.equal(pendingList.pending.length, 1)
  assert.ok(Array.isArray(pendingList.approved))
  assert.ok(Array.isArray(pendingList.rejected))
  const edited = await service.handleRpc('draft/update', {
    id: reply.draftId,
    html: '<p>Confirmed and updated.</p>',
    subject: 'Re: Quarterly plan (updated)',
  })
  assert.equal(edited.subject, 'Re: Quarterly plan (updated)')
  assert.match(edited.html, /updated/)
  assert.equal(service.store.getDraft(reply.draftId).sourceSubject, 'Quarterly plan')
  await assert.rejects(() => service.sendDraftById(reply.draftId), /needs the user’s review/)
  const approved = await service.approveDraft(reply.draftId)
  assertNoUndefined(approved)
  assert.equal(smtp.captured.length, 2)
  assert.match(smtp.captured[1], /multipart\/alternative/)
  assert.match(smtp.captured[1], /In-Reply-To: <source@partner.org>/)
  const sent = service.store.getDraft(reply.draftId)
  assert.equal(sent.status, 'sent')
  assertNoUndefined(await service.status())
  assertNoUndefined(service.draftSummaries())

  fs.rmSync(directory, { recursive: true, force: true })
  console.log('IMAP/SMTP integration tests passed')
} finally {
  imap.server.close()
  smtp.server.close()
}

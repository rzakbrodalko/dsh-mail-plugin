import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildMessage, parseMessage } from '../lib/mime.js'
import { MailStore, normalizeSettings } from '../lib/store.js'
import { MailService } from '../lib/service.js'
import { htmlToText, parseAddressList } from '../lib/util.js'

// 1. Build and reparse a multipart/alternative message.
const built = buildMessage({
  from: { name: 'Zoë Sender', address: 'zoe@example.com' },
  to: [{ name: 'Jan', address: 'jan@partner.org' }],
  cc: [{ name: '', address: 'ops@example.com' }],
  subject: 'Re: Ünicode ✓',
  html: '<h1>Hello</h1><p>This is <strong>bold</strong> &amp; bright.</p>',
  text: '',
  inReplyTo: '<old@example.com>',
  references: '<root@example.com> <old@example.com>',
})
assert.ok(built.raw.includes('multipart/alternative'))
assert.ok(built.raw.includes('\r\n'))
assert.ok(built.raw.includes('In-Reply-To: <old@example.com>'))
const parsedBack = parseMessage(Buffer.from(built.raw, 'utf8'))
assert.equal(parsedBack.subject, 'Re: Ünicode ✓')
assert.equal(parsedBack.from[0].address, 'zoe@example.com')
assert.equal(parsedBack.to[0].address, 'jan@partner.org')
assert.equal(parsedBack.cc[0].address, 'ops@example.com')
assert.match(parsedBack.html, /<strong>bold<\/strong>/)
assert.match(parsedBack.text, /Hello/)
assert.equal(parsedBack.messageId, built.messageId)

// 2. Parse a server-style multipart with quoted-printable and base64 parts.
const raw = [
  'From: =?UTF-8?B?Wm/Dqw==?= <zoe@example.com>',
  'To: jan@partner.org',
  'Subject: =?UTF-8?Q?Caf=C3=A9?=',
  'Date: Wed, 12 Nov 2026 10:00:00 +0000',
  'Message-ID: <server@example.com>',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="outer"',
  '',
  '--outer',
  'Content-Type: multipart/alternative; boundary="inner"',
  '',
  '--inner',
  'Content-Type: text/plain; charset=utf-8',
  'Content-Transfer-Encoding: quoted-printable',
  '',
  'Caf=C3=A9 time',
  '--inner',
  'Content-Type: text/html; charset=utf-8',
  'Content-Transfer-Encoding: base64',
  '',
  Buffer.from('<p>Café time</p>', 'utf8').toString('base64'),
  '--inner--',
  '--outer',
  'Content-Type: application/octet-stream',
  'Content-Disposition: attachment; filename="note.bin"',
  'Content-Transfer-Encoding: base64',
  '',
  Buffer.from('binary').toString('base64'),
  '--outer--',
  '',
].join('\r\n')
const parsed = parseMessage(Buffer.from(raw, 'latin1'))
assert.equal(parsed.subject, 'Café')
assert.equal(parsed.from[0].name, 'Zoë')
assert.equal(parsed.text, 'Café time')
assert.match(parsed.html, /Café time/)
assert.equal(parsed.attachments.length, 1)
assert.equal(parsed.attachments[0].filename, 'note.bin')

// 3. Text conversion and address parsing.
assert.match(htmlToText('<p>Hi<br>there &amp; you</p>'), /Hi\nthere & you/)
assert.equal(parseAddressList('"A, B" <a@b.com>, c@d.com').length, 2)

// 4. Settings normalization and a durable draft.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-mail-test-'))
const normalized = normalizeSettings({
  account: { address: 'a@b.com', imapHost: 'imap.b.com', smtpHost: 'smtp.b.com', imapPort: '993' },
  review: { mode: 'allowlist', trustedDomains: ['Example.com', 'example.com', 'test@Example.com', ''] },
})
assert.equal(normalized.review.trustedDomains.length, 2)
assert.ok(normalized.review.trustedDomains.includes('test@example.com'))
assert.equal(normalized.account.username, 'a@b.com')

const store = new MailStore(directory)
await store.mutate(drafts => [{ id: 'd1', status: 'pending_review', subject: 'S', to: [], cc: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
const reloaded = new MailStore(directory)
assert.equal(reloaded.getDraft('d1').subject, 'S')

// 5. Review policy through the service (no credentials needed).
const service = new MailService({ get: () => undefined }, {})
service.store = store
await store.saveSettings(normalized)
assert.equal(service.reviewDecision([{ address: 'x@example.com' }]).required, false)
assert.equal(service.reviewDecision([{ address: 'x@sub.example.com' }]).required, false)
assert.equal(service.reviewDecision([{ address: 'test@example.com' }]).required, false)
assert.equal(service.reviewDecision([{ address: 'x@other.org' }]).required, true)
store.getSettings().review.trustedDomains = ['boss@other.org']
assert.equal(service.reviewDecision([{ address: 'BOSS@other.org' }]).required, false)
assert.equal(service.reviewDecision([{ address: 'other@other.org' }]).required, true)
store.getSettings().review.mode = 'always'
assert.equal(service.reviewDecision([{ address: 'x@example.com' }]).required, true)
store.getSettings().review.mode = 'never'
assert.equal(service.reviewDecision([{ address: 'x@other.org' }]).required, false)

fs.rmSync(directory, { recursive: true, force: true })
console.log('All mail plugin smoke tests passed')

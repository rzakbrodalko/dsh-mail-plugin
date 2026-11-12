/** Minimal but robust MIME parser and multipart/alternative message builder. */

import {
  addressDomain,
  base64Lines,
  decodeBytes,
  decodeWords,
  formatAddress,
  headerSafe,
  htmlToText,
  isMailAddress,
  parseAddressList,
} from './util.js'

/** Parse `; key=value` parameters from a structured header value. */
function parseParameters(value) {
  const parts = []
  let current = ''
  let quoted = false
  for (const ch of String(value ?? '')) {
    if (ch === '"') quoted = !quoted
    if (ch === ';' && !quoted) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current !== '') parts.push(current)
  const [head, ...tail] = parts
  const params = {}
  for (const entry of tail) {
    const eq = entry.indexOf('=')
    if (eq < 0) continue
    const key = entry.slice(0, eq).trim().toLowerCase()
    let raw = entry.slice(eq + 1).trim()
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1).replace(/\\(.)/g, '$1')
    params[key] = raw
  }
  return { value: String(head ?? '').trim().toLowerCase(), params }
}

/** Decode a quoted-printable body into bytes. */
function decodeQuotedPrintable(text) {
  const bytes = []
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch !== '=') {
      bytes.push(text.charCodeAt(i) & 0xff)
      continue
    }
    const next = text[i + 1]
    if (next === '\n') {
      i += 1
      continue
    }
    if (next === '\r' && text[i + 2] === '\n') {
      i += 2
      continue
    }
    if (/^[0-9a-fA-F]{2}$/.test(text.slice(i + 1, i + 3))) {
      bytes.push(Number.parseInt(text.slice(i + 1, i + 3), 16))
      i += 2
      continue
    }
    bytes.push(0x3d)
  }
  return Buffer.from(bytes)
}

/** Decode a transfer encoding into its raw bytes. */
function decodeTransfer(body, encoding) {
  const label = String(encoding ?? '').trim().toLowerCase()
  if (label === 'base64') {
    return Buffer.from(body.replace(/[^A-Za-z0-9+/=]/g, ''), 'base64')
  }
  if (label === 'quoted-printable') {
    return decodeQuotedPrintable(body)
  }
  return Buffer.from(body, 'latin1')
}

/** Find the header/body separator and return both latin1 strings. */
function splitHeaderBody(raw) {
  const text = Buffer.from(raw).toString('latin1')
  const crlf = text.indexOf('\r\n\r\n')
  if (crlf >= 0) return { header: text.slice(0, crlf), body: text.slice(crlf + 4) }
  const lf = text.indexOf('\n\n')
  if (lf >= 0) return { header: text.slice(0, lf), body: text.slice(lf + 2) }
  return { header: text, body: '' }
}

/** Fold continuation lines and decode each header value. */
function parseHeaders(headerText) {
  const headers = {}
  const unfolded = headerText.replace(/\r?\n[ \t]+/g, ' ')
  for (const line of unfolded.split(/\r?\n/)) {
    const colon = line.indexOf(':')
    if (colon <= 0) continue
    const name = line.slice(0, colon).trim().toLowerCase()
    if (!/^[!-9;-~]+$/.test(name)) continue
    const rawValue = line.slice(colon + 1).trim()
    const value = decodeWords(Buffer.from(rawValue, 'latin1').toString('utf8'))
    headers[name] = value
  }
  return headers
}

/** Split a multipart body into its part buffers on one boundary. */
function splitMultipart(body, boundary) {
  const text = Buffer.from(body).toString('latin1')
  const marker = `--${boundary}`
  const chunks = text.split(marker)
  const parts = []
  for (let i = 1; i < chunks.length; i += 1) {
    let chunk = chunks[i]
    if (chunk.startsWith('--')) break
    if (chunk.startsWith('\r\n')) chunk = chunk.slice(2)
    else if (chunk.startsWith('\n')) chunk = chunk.slice(1)
    chunk = chunk.replace(/\r?\n$/, '')
    if (chunk.trim() !== '') parts.push(Buffer.from(chunk, 'latin1'))
  }
  return parts
}

/** Decode an RFC 5987 `filename*=UTF-8''...` value when present. */
function decodeFilenameStar(value) {
  const match = /^([^']*)'[^']*'(.*)$/.exec(String(value ?? ''))
  if (match === null) return undefined
  try {
    return decodeURIComponent(match[2])
  } catch {
    return undefined
  }
}

/** Parse one entity recursively and merge its text, HTML, and attachments. */
function parseEntity(raw, depth, collected) {
  if (depth > 8) return
  const { header, body } = splitHeaderBody(raw)
  const headers = parseHeaders(header)
  const contentType = parseParameters(headers['content-type'] ?? 'text/plain; charset=utf-8')
  const [type, subtype = ''] = contentType.value.split('/')
  const disposition = parseParameters(headers['content-disposition'] ?? '')

  if (type === 'multipart') {
    const boundary = contentType.params.boundary
    if (boundary === undefined || boundary === '') return
    for (const part of splitMultipart(Buffer.from(body, 'latin1'), boundary)) {
      parseEntity(part, depth + 1, collected)
    }
    return
  }

  const charset = contentType.params.charset ?? 'utf-8'
  const transfer = headers['content-transfer-encoding']
  const filename = decodeFilenameStar(disposition.params['filename*'])
    ?? disposition.params.filename
    ?? contentType.params.name
  const isAttachment = disposition.value === 'attachment' || (filename !== undefined && type !== 'text')

  if (isAttachment) {
    const bytes = decodeTransfer(body, transfer)
    collected.attachments.push({
      filename: filename ?? '',
      contentType: contentType.value || 'application/octet-stream',
      size: bytes.length,
    })
    return
  }

  if (type === 'text' && subtype === 'plain' && collected.text === undefined) {
    collected.text = decodeBytes(decodeTransfer(body, transfer), charset)
  } else if (type === 'text' && subtype === 'html' && collected.html === undefined) {
    collected.html = decodeBytes(decodeTransfer(body, transfer), charset)
  } else if (type === 'message' && subtype === 'rfc822') {
    parseEntity(Buffer.from(body, 'latin1'), depth + 1, collected)
  }
}

/**
 * Parse one RFC 822 message into decoded headers, bodies, and attachment metadata.
 * @param {Buffer|string} raw - full message bytes.
 * @returns parsed message.
 */
export function parseMessage(raw) {
  const collected = { text: undefined, html: undefined, attachments: [] }
  parseEntity(Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), 'latin1'), 0, collected)
  const { header } = splitHeaderBody(raw)
  const headers = parseHeaders(header)
  const html = collected.html
  const text = collected.text ?? (html === undefined ? '' : htmlToText(html))
  return {
    headers,
    subject: headers.subject ?? '',
    from: parseAddressList(headers.from),
    to: parseAddressList(headers.to),
    cc: parseAddressList(headers.cc),
    replyTo: parseAddressList(headers['reply-to']),
    date: headers.date ?? '',
    messageId: (headers['message-id'] ?? '').trim(),
    inReplyTo: (headers['in-reply-to'] ?? '').trim(),
    references: (headers.references ?? '').trim(),
    text: text ?? '',
    html: html ?? '',
    attachments: collected.attachments,
  }
}

/** Convert plain text into a conservative HTML body. */
export function textToHtml(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map(paragraph => `<p>${paragraph.split('\n').map(line => escapeInline(line)).join('<br>')}</p>`)
    .join('\n')
}

function escapeInline(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build a multipart/alternative RFC 822 message.
 * @param {object} input - from, to, cc, bcc, subject, html, text, threading headers.
 * @returns {{ raw: string, messageId: string }} CRLF-terminated message and its id.
 */
export function buildMessage(input) {
  const from = input.from
  if (from === undefined || !isMailAddress(from.address)) {
    throw new Error('A valid From address is required')
  }
  const to = (input.to ?? []).filter(entry => isMailAddress(entry.address))
  if (to.length === 0) throw new Error('At least one valid recipient is required')
  const cc = input.cc ?? []
  const bcc = input.bcc ?? []
  const domain = addressDomain(from.address) || 'localhost'
  const messageId = input.messageId ?? `<${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 10)}@${domain}>`
  const subject = headerSafe(input.subject ?? '')
  const html = String(input.html ?? '').trim() === ''
    ? textToHtml(input.text ?? '')
    : String(input.html)
  const text = String(input.text ?? '').trim() === '' ? htmlToText(html) : String(input.text)
  const boundary = `dsh-mail-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  const date = input.date ?? new Date().toUTCString().replace(/GMT$/, '+0000')

  const lines = []
  lines.push(`From: ${formatAddress(from)}`)
  lines.push(`To: ${to.map(formatAddress).join(', ')}`)
  if (cc.length > 0) lines.push(`Cc: ${cc.map(formatAddress).join(', ')}`)
  lines.push(`Subject: ${encodeSubject(subject)}`)
  lines.push(`Date: ${date}`)
  lines.push(`Message-ID: ${messageId}`)
  if (input.inReplyTo !== undefined && input.inReplyTo !== '') {
    lines.push(`In-Reply-To: ${headerSafe(input.inReplyTo)}`)
  }
  if (input.references !== undefined && input.references !== '') {
    lines.push(`References: ${headerSafe(input.references)}`)
  }
  lines.push('MIME-Version: 1.0')
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
  lines.push('')
  lines.push(`--${boundary}`)
  lines.push('Content-Type: text/plain; charset=utf-8')
  lines.push('Content-Transfer-Encoding: base64')
  lines.push('')
  lines.push(base64Lines(Buffer.from(text, 'utf8')))
  lines.push(`--${boundary}`)
  lines.push('Content-Type: text/html; charset=utf-8')
  lines.push('Content-Transfer-Encoding: base64')
  lines.push('')
  lines.push(base64Lines(Buffer.from(html, 'utf8')))
  lines.push(`--${boundary}--`)
  lines.push('')
  return { raw: lines.join('\r\n'), messageId }
}

function encodeSubject(subject) {
  if (/^[\x20-\x7e]*$/.test(subject)) return subject
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`
}

/** Extract a short readable preview from a parsed message. */
export function messageSnippet(message, limit = 240) {
  const source = String(message.text ?? '').replace(/\s+/g, ' ').trim()
  return source.length > limit ? `${source.slice(0, limit)}\u2026` : source
}

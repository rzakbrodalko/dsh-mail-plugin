/** Small text, address, and header helpers shared by the mail protocol code. */

const HTML_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201d',
  ldquo: '\u201c',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
}

/** Remove CR/LF so a value can never inject a header or protocol line. */
export function headerSafe(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim()
}

/** Decode one RFC 2047 encoded word body. */
function decodeEncodedWord(charset, encoding, text) {
  try {
    if (encoding.toUpperCase() === 'B') {
      const bytes = Buffer.from(text.replace(/\s+/g, ''), 'base64')
      return decodeBytes(bytes, charset)
    }
    const bytes = []
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i]
      if (ch === '_') {
        bytes.push(0x20)
      } else if (ch === '=' && /^[0-9a-fA-F]{2}$/.test(text.slice(i + 1, i + 3))) {
        bytes.push(Number.parseInt(text.slice(i + 1, i + 3), 16))
        i += 2
      } else {
        bytes.push(ch.charCodeAt(0) & 0xff)
      }
    }
    return decodeBytes(Buffer.from(bytes), charset)
  } catch {
    return text
  }
}

/** Decode RFC 2047 encoded words in a header value. */
export function decodeWords(value) {
  if (typeof value !== 'string' || !value.includes('=?')) return value ?? ''
  return value.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_match, charset, encoding, text) =>
    decodeEncodedWord(charset, encoding, text))
}

/** Decode bytes using a declared charset, falling back to UTF-8. */
export function decodeBytes(buffer, charset) {
  const label = String(charset ?? 'utf-8').trim().replace(/^["']|["']$/g, '').toLowerCase()
  try {
    return new TextDecoder(label, { fatal: false }).decode(buffer)
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  }
}

/** Encode a header value as one base64 RFC 2047 word when it is not ASCII. */
export function encodeHeaderWord(value) {
  const text = headerSafe(value)
  if (/^[\x20-\x7e]*$/.test(text)) return text
  return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`
}

/** Wrap base64 text at 76 columns with CRLF line endings. */
export function base64Lines(buffer) {
  const encoded = Buffer.from(buffer).toString('base64')
  return encoded.replace(/(.{76})/g, '$1\r\n')
}

/** Split an address header into `{ name, address }` entries. */
export function parseAddressList(value) {
  const text = String(value ?? '')
  const parts = []
  let current = ''
  let quoted = false
  let angle = 0
  for (const ch of text) {
    if (ch === '"') quoted = !quoted
    if (!quoted && ch === '<') angle += 1
    if (!quoted && ch === '>') angle = Math.max(0, angle - 1)
    if (ch === ',' && !quoted && angle === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim() !== '') parts.push(current)
  const result = []
  for (const part of parts) {
    const raw = decodeWords(part.trim())
    if (raw === '') continue
    const match = /^(.*?)\s*<([^<>]+)>$/.exec(raw)
    let name = ''
    let address = ''
    if (match !== null) {
      name = match[1].trim().replace(/^"|"$/g, '').trim()
      address = match[2].trim()
    } else {
      address = raw.trim()
    }
    address = address.replace(/^mailto:/i, '').trim()
    if (address === '') continue
    result.push({ name, address })
  }
  return result
}

/** Return the lowercase domain of one email address, or an empty string. */
export function addressDomain(address) {
  const at = String(address ?? '').lastIndexOf('@')
  if (at < 0) return ''
  return String(address).slice(at + 1).trim().toLowerCase().replace(/[>),;]+$/, '')
}

/** Whether an address is a syntactically plausible mailbox. */
export function isMailAddress(address) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(address ?? '').trim())
}

/** Render one address header entry, encoding a non-ASCII display name. */
export function formatAddress(entry) {
  const address = headerSafe(entry.address)
  const name = headerSafe(entry.name)
  if (name === '') return address
  const encoded = encodeHeaderWord(name)
  return `${encoded} <${address}>`
}

/** Decode the common HTML entities present in mail bodies. */
export function decodeHtmlEntities(text) {
  return String(text ?? '').replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x'
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    const named = HTML_ENTITIES[body.toLowerCase()]
    return named === undefined ? match : named
  })
}

/** Convert an HTML mail body into a readable plain-text alternative. */
export function htmlToText(html) {
  let text = String(html ?? '')
  text = text.replace(/<head[\s\S]*?<\/head>/gi, '')
  text = text.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<li\b[^>]*>/gi, '\n- ')
  text = text.replace(/<\/(p|div|tr|li|h[1-6]|table|blockquote|section|article)\s*>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = decodeHtmlEntities(text)
  text = text.replace(/\r/g, '')
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/[ \t]{2,}/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

/** Escape text for safe inclusion in HTML. */
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Normalize a raw mail buffer to LF line endings without decoding bytes. */
export function normalizeNewlines(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

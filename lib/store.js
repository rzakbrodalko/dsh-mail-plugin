/** Durable JSON storage for mailbox settings and reply drafts. */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const SECURITY = new Set(['tls', 'starttls', 'none'])
const REVIEW_MODES = new Set(['always', 'allowlist', 'never'])

/** Default settings used before the user configures a mailbox. */
export function defaultSettings() {
  return {
    version: 1,
    account: {
      address: '',
      name: '',
      username: '',
      imapHost: '',
      imapPort: 993,
      imapSecurity: 'tls',
      smtpHost: '',
      smtpPort: 465,
      smtpSecurity: 'tls',
      folder: 'INBOX',
      sentFolder: 'Sent',
    },
    review: {
      mode: 'allowlist',
      trustedDomains: [],
    },
    updatedAt: null,
  }
}

function cleanText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

/** Normalize one trusted entry: a domain or an exact mailbox address. */
export function normalizeTrustEntry(value) {
  let text = cleanText(value).toLowerCase()
  if (text.startsWith('mailto:')) text = text.slice('mailto:'.length)
  if (text.startsWith('@')) text = text.slice(1)
  return text
}

function cleanPort(value, fallback) {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 && port < 65_536 ? port : fallback
}

function cleanSecurity(value, fallback) {
  return SECURITY.has(value) ? value : fallback
}

/** Validate and normalize a settings document. */
export function normalizeSettings(input) {
  const base = defaultSettings()
  const account = input?.account ?? {}
  const review = input?.review ?? {}
  const address = cleanText(account.address)
  const username = cleanText(account.username) || address
  const domains = Array.isArray(review.trustedDomains)
    ? review.trustedDomains.map(domain => normalizeTrustEntry(domain)).filter(Boolean)
    : []
  return {
    version: 1,
    account: {
      address,
      name: cleanText(account.name),
      username,
      imapHost: cleanText(account.imapHost),
      imapPort: cleanPort(account.imapPort, base.account.imapPort),
      imapSecurity: cleanSecurity(account.imapSecurity, base.account.imapSecurity),
      smtpHost: cleanText(account.smtpHost),
      smtpPort: cleanPort(account.smtpPort, base.account.smtpPort),
      smtpSecurity: cleanSecurity(account.smtpSecurity, base.account.smtpSecurity),
      folder: cleanText(account.folder) || base.account.folder,
      sentFolder: cleanText(account.sentFolder) || base.account.sentFolder,
    },
    review: {
      mode: REVIEW_MODES.has(review.mode) ? review.mode : base.review.mode,
      trustedDomains: [...new Set(domains)],
    },
    updatedAt: typeof input?.updatedAt === 'string' ? input.updatedAt : null,
  }
}

/** Default background-watcher state. */
export function defaultWatcher() {
  return {
    enabled: false,
    intervalSeconds: 60,
    lastUid: null,
    lastCheckAt: null,
    lastError: null,
    targetSessionId: null,
  }
}

/** Validate and normalize watcher state. */
export function normalizeWatcher(input) {
  const base = defaultWatcher()
  const interval = Number(input?.intervalSeconds)
  return {
    enabled: input?.enabled === true,
    intervalSeconds: Number.isInteger(interval) && interval >= 30 && interval <= 3_600
      ? interval
      : base.intervalSeconds,
    lastUid: Number.isInteger(input?.lastUid) && input.lastUid >= 0 ? input.lastUid : null,
    lastCheckAt: typeof input?.lastCheckAt === 'string' ? input.lastCheckAt : null,
    lastError: typeof input?.lastError === 'string' ? input.lastError : null,
    targetSessionId: typeof input?.targetSessionId === 'string' ? input.targetSessionId : null,
  }
}

/** Resolve the plugin data directory under the DSH home. */
export function dataDirectory() {
  const home = process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh')
  return path.join(home, 'mail-plugin')
}

async function atomicWrite(file, value) {
  await fs.promises.mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`
  await fs.promises.writeFile(temporary, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 })
  await fs.promises.rename(temporary, file)
  try {
    await fs.promises.chmod(file, 0o600)
  } catch {
    // Windows may ignore POSIX modes.
  }
}

/** One store instance shared by tools and the review UI. */
export class MailStore {
  constructor(directory = dataDirectory()) {
    this.directory = directory
    this.settingsFile = path.join(directory, 'settings.json')
    this.draftsFile = path.join(directory, 'drafts.json')
    this.watcherFile = path.join(directory, 'watcher.json')
    this.settings = this.readSettings()
    this.drafts = this.readDrafts()
    this.watcher = this.readWatcher()
    this.writeChain = Promise.resolve()
  }

  readSettings() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'))
      return normalizeSettings(parsed)
    } catch {
      return defaultSettings()
    }
  }

  readDrafts() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.draftsFile, 'utf8'))
      const list = Array.isArray(parsed?.drafts) ? parsed.drafts : []
      return list.filter(draft => typeof draft?.id === 'string')
    } catch {
      return []
    }
  }

  readWatcher() {
    try {
      return normalizeWatcher(JSON.parse(fs.readFileSync(this.watcherFile, 'utf8')))
    } catch {
      return defaultWatcher()
    }
  }

  /** Current watcher configuration and last-run facts. */
  getWatcher() {
    return this.watcher
  }

  /** Persist a watcher-state patch. */
  async saveWatcher(patch) {
    const next = normalizeWatcher({ ...this.watcher, ...patch })
    await atomicWrite(this.watcherFile, next)
    this.watcher = next
    return next
  }

  /** Current settings snapshot. */
  getSettings() {
    return this.settings
  }

  /** Replace settings and persist them. */
  async saveSettings(input) {
    const next = normalizeSettings({ ...input, updatedAt: new Date().toISOString() })
    await atomicWrite(this.settingsFile, next)
    this.settings = next
    return next
  }

  /** All drafts, newest first. */
  listDrafts() {
    return [...this.drafts].sort((left, right) =>
      String(right.updatedAt ?? right.createdAt ?? '').localeCompare(String(left.updatedAt ?? left.createdAt ?? '')))
  }

  /** Resolve one draft. */
  getDraft(id) {
    return this.drafts.find(draft => draft.id === id)
  }

  /**
   * Serialize one draft mutation and persist the result.
   * @param {(drafts:Array) => Array} mutate - pure transformation.
   * @returns {Promise<void>} resolution after durability.
   */
  mutate(mutate) {
    const operation = this.writeChain.then(async () => {
      const next = mutate([...this.drafts])
      const trimmed = this.trim(next)
      await atomicWrite(this.draftsFile, { version: 1, drafts: trimmed })
      this.drafts = trimmed
    })
    this.writeChain = operation.catch(() => {})
    return operation
  }

  /** Keep the newest 200 drafts and bound the file. */
  trim(drafts) {
    const sorted = drafts.sort((left, right) =>
      String(right.updatedAt ?? right.createdAt ?? '').localeCompare(String(left.updatedAt ?? left.createdAt ?? '')))
    return sorted.slice(0, 200)
  }
}

/** Create a time-ordered draft id. */
export function newDraftId() {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

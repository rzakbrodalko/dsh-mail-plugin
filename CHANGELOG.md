# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.4.0] - 2026-11-17

### Added

- **Conversational draft revisions** in the review panel: describe a change, and the model revises the current draft.
- Quick revision actions: more specific, add an example, shorter, more formal, warmer.
- `mail_draft_get` and `mail_draft_update` tools for model-driven revisions.
- Revision requests are queued to the session that owns the draft and never send the draft.
- Revision status, last request, and errors are visible in the panel.
- Revision requests use step steering so a busy session handles them instead of leaving them queued for a later turn; stale requests time out after two minutes and can be retried.
- A revision request only applies the panel’s editor snapshot when it matches the draft’s current `updatedAt`; a newer server revision is never overwritten by a stale panel state.

### Changed

- Unsaved visual/source edits are included in the revision request, so the model rewrites the current content rather than a stale saved draft.

## [1.3.0] - 2026-11-17

### Added

- A **visual editor** in the review panel with bold, italic, underline, headings, lists, quotes, links, clear formatting, undo, and redo.
- Paste sanitizing that strips scripts, event handlers, unsafe URLs, and unsupported markup.
- The HTML source editor is now optional and collapsed under **Advanced: HTML source**.
- The separate Preview mode was removed; the visual editor is the single review surface.
- Browser spellcheck underlines are disabled in the visual editor to avoid marking non-English replies.
- H2, H3, and Quote act as toggles back to a normal paragraph; Clear formatting resets inline styles, links, lists, and block formatting.
- Quote wraps a paragraph or an entire list once and removes nested quote wrappers in one click.
- Quoting and Clear formatting preserve the caret by mapping it through the document text offsets.

## [1.2.0] - 2026-11-14

### Added

- **Contact profiles** for addresses and domains: name, relationship, preferred language, tone, and free-form notes.
- A **Contacts** tab in the Mail panel with search, create, edit, and delete.
- Distinct contact-type badges: green dot for exact addresses, blue dot for domains.
- Contact matching with exact-address precedence and longest-domain fallback; domains cover subdomains.
- `mail_contacts` lookup tool.
- Contact enrichment in `mail_list`, `mail_read`, and `mail_reply` so the agent can adapt language and tone.
- **Incoming attachment saving**: `mail_read` with `saveAttachments: true` writes decoded files under `$DSH_HOME/mail-plugin/attachments` with sanitized names, owner-only permissions, a 10 MiB per-file limit, and a 25 MiB per-message limit.
- Contacts are stored locally in `$DSH_HOME/mail-plugin/contacts.json`; they never affect trust or review authorization.

## [1.1.0] - 2026-11-13

### Added

- Simplified Chinese panel localization following the DSH active locale, with English fallback.
- Chinese README, security summary, plugin detail page, and plugin-manager metadata (`locale/zh.json`).
- Gitee mirroring guide (`GITEE.md`) and a Chinese bug-report issue template.
- Chinese npm keywords for discovery.

### Changed

- The review preview, settings, notices, empty states, and action labels now come from one locale dictionary; unsupported locales fall back to English.

## [1.0.1] - 2026-11-13

### Fixed

- The browser bundle registered itself under the old development package id (`@local/dsh-mail`), so DSH never materialized it under the published name and the Mail sidebar entry was missing. The module id now matches `dsh-mail-plugin`.

## [1.0.0] - 2026-11-12

### Added

- `Mail` sidebar panel with Review and Settings tabs.
- IMAP reading: `mail_list`, `mail_read`, folder selection, unread search, Seen marking.
- Multipart/alternative HTML reply drafts: `mail_reply`, with generated plain-text alternative and threading headers.
- SMTP submission: `mail_send`, with best-effort Sent-folder append.
- Draft review gate with user-only approval; the agent cannot approve.
- Trusted-recipient policy supporting exact addresses and domains (including subdomains).
- Background watcher with configurable polling, baseline UID, deduplication, and loop guards.
- Password storage in the DSH credential store; settings and drafts under `$DSH_HOME/mail-plugin`.
- Sandboxed HTML preview with restrictive CSP.
- English display metadata, icon, detail document, and packaging metadata.
- Tests for MIME, settings, review policy, mock IMAP/SMTP, drafts, sending, and the watcher.

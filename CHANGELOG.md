# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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

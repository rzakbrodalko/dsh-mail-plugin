# dsh-mail-plugin

English | [中文](README.zh.md)

Email for **DeepSeek Harness (DSH)**: read a mailbox over IMAP, watch it for new messages, and send reviewed multipart HTML replies from an agent session.

A community plugin for DSH. It is not an official DeepSeek project.

- **Sidebar panel** — `Mail` in the left sidebar, with Review, Contacts, and Settings tabs.
- **Agent tools** — list/read mail, draft HTML replies, send approved drafts.
- **Review gate** — replies to untrusted recipients wait for your approval.
- **Visual review editor** — format replies directly; raw HTML remains available as an advanced option.
- **Conversational revisions** — ask the model to make a draft more specific, shorter, warmer, or add an example, then review the result.
- **Sent history and reuse** — click a recent sent message to inspect it, then create a fresh review draft with **Make a draft again**.
- **Draft retention** — cap sent and rejected history in Settings; active drafts are never removed automatically.
- **Trusted recipients** — whitelist exact addresses (`test@example.com`) or domains (`example.com`, including subdomains).
- **Incoming attachments** — save decoded attachments to a bounded local folder with safe names, then inspect them with normal DSH tools.
- **Outgoing attachments** — attach local files to a review draft; files are copied into plugin storage and sent as `multipart/mixed`.
- **Background watcher** — polls for new mail and wakes the session that last used a Mail tool; trusted replies can be sent automatically.
- **No runtime dependencies** — small IMAP/SMTP/MIME implementation on Node built-ins.

Works with any standard IMAP4rev1 + SMTP submission server that supports LOGIN or SASL PLAIN over TLS/STARTTLS. Provider-specific OAuth flows are not implemented; use an app password where required.

## Requirements

- DeepSeek Harness `>=0.2.2-rc.2 <0.3.0` with the Web UI (the sidebar panel and review route need the Web carrier).
- An IMAP account and an SMTP submission account, usually the same mailbox.
- A provider that allows IMAP/SMTP access. Gmail requires an app password; Microsoft accounts that require OAuth are not supported.

## Installation

### From npm (after release)

Install the package through **Plugins → Add plugin** and use the package spec:

```text
dsh-mail-plugin@1.7.0
```

The equivalent agent operation is `plugin_manager` with `action: "install_bundle"` and that spec as `target`. Installation is profile-wide and survives restart.

### From GitHub

Before the first npm release, or to track a fork, install a commit-pinned Git spec:

```text
git+https://github.com/rzakbrodalko/dsh-mail-plugin.git#<full-40-character-commit>
```

Use a full commit, not a branch or tag, so DSH can update the bundle later. The repository root is the package.

### Local development

Install the checkout as a local bundle through **Plugins → Add plugin**, or with `plugin_manager` using the absolute package directory as `target`. A linked install reads the files in place; restart or re-enable the row after changing Host code.

## Setup

1. Open **Mail** in the left sidebar.
2. Go to **Settings** and fill in:
   - email address and optional display name
   - IMAP host, port, and security (`TLS` on 993, `STARTTLS` on 143, or `None`)
   - SMTP host, port, and security (`TLS` on 465, `STARTTLS` on 587, or `None`)
   - username if it differs from the address
   - mailbox password
   - inbox and Sent folder names
3. Click **Test connection** and check both IMAP and SMTP.
4. Click **Save settings**.
5. Review **Review policy**:
   - **Review all, except trusted recipients** — default.
   - **Always review** — every draft waits.
   - **Never review** — every draft is auto-approved. Use with care.
   - **Attachments** — a draft with any outgoing attachment always waits for review, regardless of this setting.
6. Optionally enable **Automatic replies** and choose a polling interval.

The password is written to the DSH credential store as `mail-plugin/default`. Settings, drafts, and watcher state are stored under `$DSH_HOME/mail-plugin/` (normally `~/.dsh/mail-plugin/`).

## Using it

Ask the agent in ordinary language:

```text
Read my latest five emails and summarize them.
```

```text
Reply to the message from Alice in HTML: confirm the meeting and ask for the agenda.
```

The agent calls:

| Tool | Purpose |
|---|---|
| `mail_list` | List recent messages with UID, sender, subject, date, unread state, and a preview |
| `mail_read` | Read one message; optionally save attachments and mark it seen |
| `mail_reply` | Create a multipart/alternative HTML reply draft; optionally attach local files |
| `mail_send` | Send an approved or auto-approved draft, including its attachments |
| `mail_drafts` | Inspect draft review/send state |
| `mail_draft_get` | Read an existing draft for a user-requested revision |
| `mail_draft_update` | Replace a draft’s HTML/subject without sending it |
| `mail_contacts` | Look up or list saved contact profiles |
| `mail_status` | Report account, review policy, contacts, watcher state, and pending reviews |

A reply is delivered only by `mail_send`. If `mail_reply` reports `reviewRequired: true`, the draft waits in **Mail → Review**; the agent cannot approve it.

### Review editor

The review panel opens on the **only** editing surface: a visual editor with basic email formatting: bold, italic, underline, headings, bulleted and numbered lists, quotes, links, clear formatting, undo, and redo. The message is not duplicated by a separate preview; raw HTML remains available under **Advanced: HTML source** for tables, images, and precise markup.

- Pasted content is sanitized: scripts, iframes, event handlers, and unsafe URLs are removed.
- **Advanced: HTML source** is collapsed by default for precise markup, tables, or images.
- Visual editing is intentionally simplified; use the HTML source when exact email markup matters.
- Approved drafts can still be edited and sent; sent and rejected drafts are read-only.

### Sent history and reuse

The Review panel keeps a **Recently sent** list of up to 20 drafts. Click a row to open a read-only view of what was sent, including its sent time and attachments.

- **Make a draft again** creates a new draft with the same subject, body, recipients, and copied attachments.
- The new draft is always `pending_review`, clears the old threading headers, and never sends automatically.
- Rejected drafts are also clickable for read-only inspection.

### Draft history retention

Settings → **Draft history** controls how many sent and rejected drafts are kept. `0` means keep all.

- Pending, approved, and failed drafts are never removed automatically.
- Only sent and rejected history is capped.
- Removing a draft also removes its `outgoing/<draft-id>` attachment copy.
- Retention is applied when settings are saved and whenever drafts change.

### Conversational revisions

Below the editor, enter what should change — for example “be more specific” or “add an example” — and choose **Revise**. Quick chips cover the common requests.

- The request is sent to the chat session that owns the draft.
- The model reads the current draft, including unsaved editor changes, with `mail_draft_get`.
- It replaces the content with `mail_draft_update`.
- The draft stays in **Mail → Review**; the model cannot approve or send it.
- The panel shows “Revising…”, then the updated draft. Errors, including no active session, are shown in the panel.

Revision requests need an active session that can call Mail tools. If the owner session is closed, reopen it or revise manually.

### Trusted recipients

Each line in **Trusted recipients** is one of:

| Entry | Covers |
|---|---|
| `test@example.com` | That exact mailbox only |
| `example.com` | Every address at `example.com` and its subdomains |
| `*.example.com` | Treated as the domain `example.com` |

Entries are trimmed and lowercased. Exact addresses are safer than whole domains.

### Contact profiles

**Mail → Contacts** stores who an address or domain is, so the agent can adapt language and tone:

| Field | Example |
|---|---|
| Match | `anna@client.com` or `client.com` |
| Name | Anna Kowalska / Client Corp |
| Relationship | client, supplier, colleague, family, prospect |
| Language | `pl`, `en` |
| Tone | formal, concise, no emoji |
| Notes | CFO; confirm deadlines; copy the account manager |

Matching rules:

1. An exact address wins over any domain entry.
2. Otherwise, the longest matching domain wins.
3. Domain entries cover their subdomains.
4. Matching is case-insensitive.

The list uses a **green badge with a dot** for exact addresses and a **blue badge with a dot** for domains, so the scope is clear at a glance.

Contacts also show their current trust status from **Settings → Review**:

- **Trusted** — the contact profile is an exact address that is itself trusted.
- **Trusted domain** — the profile is covered by a trusted domain rule.
- No badge — the profile is not covered by the trusted list.

An exact trusted address does **not** make a domain-wide contact trusted; the domain badge requires a domain rule. Trust badges are informational and never change the trusted list or the review policy.


Contact profiles **never** change the trusted-recipient list or the review policy. They only give the model context. Profiles are stored in `$DSH_HOME/mail-plugin/contacts.json` and are visible to the model, so do not put passwords or sensitive secrets in notes.

`mail_list` includes a compact contact summary, `mail_read` includes the full sender profile, and `mail_reply` includes recipient profiles. The `mail_contacts` tool looks up one address or lists saved profiles.

### Incoming attachments

Call `mail_read` with `saveAttachments: true` to decode attachments into:

```text
$DSH_HOME/mail-plugin/attachments/<uid>-<timestamp>/
```

Each result carries a sanitized filename, MIME type, size, `attachmentId`, and absolute local path. A `manifest.json` records what was saved.

Limits and safety:

- 10 MiB per attachment, 25 MiB total per message.
- Path separators and reserved names are stripped; files are written with owner-only permissions.
- Files are never opened or executed by the plugin. Inspect them with normal DSH tools.
- Attachments above the limits are reported as `skipped` with a reason.
- Outgoing attachments are **not** supported in this release.

Downloaded attachments can contain malware. Do not execute them, and treat their contents as untrusted data.

### Outgoing attachments

Pass absolute local paths in the `attachments` array of `mail_reply`:

```text
mail_reply({ uid: 18, html: "<p>Attached is the proposal.</p>", attachments: ["C:\\designs\\proposal.pdf"] })
```

At draft creation the plugin:

1. Opens each file and enforces 10 MiB per file and 25 MiB total, with at most 10 files.
2. Copies it into the plugin data directory under `outgoing/<draft-id>/` with a sanitized name and owner-only permissions.
3. Records the SHA-256 hash, size, and MIME type.

Attachments always force **review**, even for a trusted recipient or `never` review mode. The review panel lists the filenames and sizes. When the draft is approved, the server re-reads the copied files, verifies their hashes, and sends a `multipart/mixed` message with base64-encoded attachments.

The stored copies are retained for audit after sending; clean `$DSH_HOME/mail-plugin/outgoing/` periodically if disk use matters.


### Background watcher

When enabled, the watcher polls the inbox (30–300 seconds, default 60) while DSH is running:

1. New unseen messages above the saved UID position are detected.
2. The session that last used a Mail tool is woken with a prompt listing those UIDs.
3. The agent reads them, drafts replies, and sends only when the review policy allows it.
4. Messages from the mailbox itself and messages declaring `Auto-Submitted` are skipped to reduce reply loops.
5. The position advances after queueing, so one message is not processed twice.

Enabling the watcher records the current mailbox position, so existing messages are not processed. **Check now** runs one pass immediately. The watcher is polling, not IMAP IDLE, and needs a live DSH session to wake.

## Security

**Read this before enabling automatic replies.**

For the full threat model, reporting process, and hardening checklist, see [SECURITY.md](SECURITY.md).

### What the plugin can do

- Read the configured mailbox over IMAP.
- Send messages over SMTP as the configured account.
- Store mailbox settings and draft bodies on disk.
- Run as an in-process DSH Host plugin, with the same process privileges as DSH. This is not a sandboxed worker.

### Credentials

- The password is kept in the DSH credential store, not in the plugin configuration, session log, or repository.
- The password is sent only to the configured IMAP/SMTP servers. Use TLS; selecting `None` sends credentials in plaintext.
- Use a dedicated app password where the provider supports one. Revoke it if the machine or profile is compromised.
- Removing the plugin does not delete the stored credential, settings, or drafts. Clean `$DSH_HOME/mail-plugin/` and the `mail-plugin/default` credential record if needed.

### Automatic sending

- Auto-send is enabled only for recipients covered by the trusted list. Everything else waits for review.
- A domain entry trusts **every** address at that domain. Prefer exact addresses for private accounts.
- A compromised trusted mailbox can trigger unreviewed replies. The plugin cannot distinguish the real sender from someone using that account.
- The watcher skips messages from your own address and `Auto-Submitted` autoresponders, but no loop guard is perfect. Monitor the mailbox after enabling automation.

### Prompt injection and model behaviour

- Email content is untrusted input. The watcher prompt tells the agent to treat it as data, but the model can still be influenced by persuasive content.
- The model may make mistakes, misread a request, or produce an incorrect answer. Review mode is the main defence for high-value recipients.
- The Mail plugin does not grant filesystem access. Any file or shell access the agent uses comes from the rest of the DSH session and remains subject to DSH's sandbox and approval policy.
- Outgoing attachments are always reviewed. Verify every filename and size in the review panel; the plugin copies files but does not scan them for malware. Do not approve an attachment you did not expect.
- Incoming attachments can be saved and inspected, but they may contain malware and are never executed by the plugin.

### Data at rest

- `$DSH_HOME/mail-plugin/settings.json` contains addresses, server names, folder names, and the trusted list.
- `$DSH_HOME/mail-plugin/drafts.json` contains full draft bodies and message metadata, including source message headers.
- `$DSH_HOME/mail-plugin/watcher.json` contains the last UID and watcher state.
- `$DSH_HOME/mail-plugin/contacts.json` contains the contact profiles and notes you entered.
- `$DSH_HOME/mail-plugin/attachments/` contains saved incoming files and their manifest; it grows until you clean it up.
- `$DSH_HOME/mail-plugin/outgoing/` contains copies of outgoing attachment files, grouped by draft id; it also grows until cleaned up.
- Files are written with owner-only permissions where the platform supports it. Protect the DSH home directory and backups accordingly.

### Network and privacy

The plugin talks only to the IMAP and SMTP servers you configure. It contains no telemetry or analytics, and its backend makes no third-party HTTP calls. The visual editor sanitizes draft markup before displaying it: scripts, iframes, event handlers, unsafe URLs, and non-HTTPS image sources are removed. HTTPS images are loaded from their draft URL for preview with `referrerpolicy="no-referrer"`, but the image host can still see your IP and the time of the preview. Use **Advanced: HTML source** for precise image markup; loaded images are not downloaded or stored by the plugin.

### Hardening checklist

- Use TLS for IMAP and SMTP; avoid `None` outside a trusted local test.
- Use an app password, not your primary account password.
- Prefer exact-address trust entries over domains.
- Keep review enabled for anything sensitive.
- Enable the watcher only while you can monitor the mailbox.
- Run DSH with the narrowest permissions and tool set you need.
- Inspect the source before installing a community plugin.

## Limitations

- One mailbox per installation; no multi-account selector.
- No OAuth sign-in; no Gmail API/Microsoft Graph. App passwords only.
- Incoming attachments can be saved and inspected; outgoing attachments are supported for review drafts, with a 10 MiB per-file and 25 MiB total limit.
- No IMAP IDLE; the watcher polls.
- No draft folder synchronization; drafts live in the plugin store, not on the server.
- Plain-text extraction is heuristic; complex HTML may lose formatting.
- Sent-folder append is best effort; a failure produces a warning but does not undo a successful send.
- No self-signed TLS option.
- A watcher pass advances past a UID once it queues the session; a later model failure is not retried automatically. The unread message remains for manual handling.

## Troubleshooting

| Symptom | Check |
|---|---|
| IMAP login fails | IMAP enabled on the provider, app password, correct host/port/security, username |
| SMTP login fails | SMTP submission enabled, port 465 TLS or 587 STARTTLS, app password |
| Certificate error | The server certificate must validate against the system trust store; self-signed certificates are rejected |
| Sent copy warning | The configured Sent folder may not exist or may be read-only |
| Watcher does nothing | Watcher enabled, interval saved, DSH running, a live session has used a Mail tool, status shows no error |
| No reply to an untrusted sender | The draft is waiting in Mail → Review; the agent cannot approve it |
| “No active watcher session” | Open a chat and use a Mail tool once, then check the status line |

## Development

No dependencies and no build step.

```bash
node test/smoke.mjs      # MIME, settings, review policy
node test/protocol.mjs   # mock IMAP/SMTP, watcher, drafts, sending
```

Source layout:

- `index.js` — Host entry: tools, review HTTP route, watcher lifecycle.
- `client.js` — Web client: sidebar icon, review/settings panel, polling.
- `lib/mime.js` — MIME parse/build, multipart/alternative.
- `lib/imap.js` — IMAP client and watcher primitives.
- `lib/smtp.js` — SMTP submission.
- `lib/socket.js` — buffered line/TLS socket.
- `lib/store.js` — settings, drafts, watcher state.
- `lib/service.js` — account access, review policy, tools, RPC.

## Chinese users

A full Chinese README is available at [README.zh.md](README.zh.md). Gitee is supported as a read-only mirror; see [GITEE.md](GITEE.md). GitHub remains the canonical repository for issues, releases, and security advisories.

## Publishing

The step-by-step release checklist is in [PUBLISHING.md](PUBLISHING.md).

## License

MIT. See [LICENSE](LICENSE).

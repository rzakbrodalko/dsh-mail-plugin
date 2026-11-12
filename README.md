# dsh-mail-plugin

Email for **DeepSeek Harness (DSH)**: read a mailbox over IMAP, watch it for new messages, and send reviewed multipart HTML replies from an agent session.

A community plugin for DSH. It is not an official DeepSeek project.

- **Sidebar panel** — `Mail` in the left sidebar, with Review and Settings tabs.
- **Agent tools** — list/read mail, draft HTML replies, send approved drafts.
- **Review gate** — replies to untrusted recipients wait for your approval.
- **Trusted recipients** — whitelist exact addresses (`test@example.com`) or domains (`example.com`, including subdomains).
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
dsh-mail-plugin@1.0.1
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
| `mail_read` | Read one message; optionally mark it seen |
| `mail_reply` | Create a multipart/alternative HTML reply draft with threading headers |
| `mail_send` | Send an approved or auto-approved draft |
| `mail_drafts` | Inspect draft review/send state |
| `mail_status` | Report account, review policy, watcher state, and pending reviews |

A reply is delivered only by `mail_send`. If `mail_reply` reports `reviewRequired: true`, the draft waits in **Mail → Review**; the agent cannot approve it.

### Trusted recipients

Each line in **Trusted recipients** is one of:

| Entry | Covers |
|---|---|
| `test@example.com` | That exact mailbox only |
| `example.com` | Every address at `example.com` and its subdomains |
| `*.example.com` | Treated as the domain `example.com` |

Entries are trimmed and lowercased. Exact addresses are safer than whole domains.

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
- The plugin cannot attach files to outgoing mail; replies are HTML text only.

### Data at rest

- `$DSH_HOME/mail-plugin/settings.json` contains addresses, server names, folder names, and the trusted list.
- `$DSH_HOME/mail-plugin/drafts.json` contains full draft bodies and message metadata, including source message headers.
- `$DSH_HOME/mail-plugin/watcher.json` contains the last UID and watcher state.
- Files are written with owner-only permissions where the platform supports it. Protect the DSH home directory and backups accordingly.

### Network and privacy

The plugin talks only to the IMAP and SMTP servers you configure. It contains no telemetry, analytics, or third-party HTTP calls. The review preview is sandboxed and blocks remote images and scripts, so tracking pixels do not load while you review.

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
- No attachments in either direction (listed on read, never downloaded or sent).
- No IMAP IDLE; the watcher polls.
- No draft folder synchronization; drafts live in the plugin store, not on the server.
- Plain-text extraction is heuristic; complex HTML may lose formatting.
- Sent-folder append is best effort; a failure produces a warning but does not undo a successful send.
- English-only panel copy.
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

## Publishing

The step-by-step release checklist is in [PUBLISHING.md](PUBLISHING.md).

## License

MIT. See [LICENSE](LICENSE).

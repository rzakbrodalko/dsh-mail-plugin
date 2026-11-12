# Mail

Read a mailbox over IMAP and send reviewed, multipart HTML replies from a DeepSeek Harness session. The plugin adds a **Mail** entry to the left sidebar and six tools the model can call.

## What it does

- **Read mail** — `mail_list` lists recent messages from a folder with sender, subject, date, unread state, a short preview, and UIDs. `mail_read` returns the decoded plain-text body, headers, attachment names, and optionally the HTML body. Messages stay untouched unless `markSeen` is set.
- **Draft replies** — `mail_reply` fetches the source message, addresses the reply to its sender (or `Reply-To`), sets `In-Reply-To`/`References` for threading, and stores an HTML body plus a generated plain-text alternative. The draft is multipart/alternative when sent.
- **Review before sending** — a draft to an untrusted recipient waits in the **Mail → Review** panel. The user can inspect the rendered HTML, compare it with the original message, edit the source and subject, and choose **Approve & send**, **Save changes**, or **Reject**. Only user approval releases it. The sidebar icon shows a warning dot while a draft awaits review.
- **Approved drafts** — a draft whose policy needs no review appears as **Ready** under Review, so the user can still send it if the model did not.
- **Background watcher** — when enabled, the plugin polls the inbox every 30–300 seconds while DSH is running. New unseen messages wake the session that last used a Mail tool; the model reads them, drafts replies, and sends only when the review policy allows it. Other drafts wait in **Review**. Messages from the mailbox itself and messages marked `Auto-Submitted` are ignored to prevent reply loops.
- **Trusted recipients** — in **Mail → Settings → Review policy**, choose:
  - *Review all, except trusted recipients* (default) — drafts whose recipients are all covered by the list are approved automatically; every other draft waits for review. Each list entry is either a **domain** (`example.com`, which also covers its subdomains) or an **exact address** (`test@example.com`, which covers only that mailbox).
  - *Always review* — every draft waits.
  - *Never review* — drafts are approved automatically.
- **Send** — `mail_send` delivers an approved draft over SMTP and appends a copy to the configured Sent folder when the server permits it. It refuses drafts that are still awaiting review or were rejected.

## Configure the mailbox

Open **Mail → Settings** in the left sidebar and fill in:

- Email address and optional display name.
- IMAP host, port, and security (`TLS` on 993, `STARTTLS` on 143, or `None`).
- SMTP host, port, and security (`TLS` on 465, `STARTTLS` on 587, or `None`).
- Username when it differs from the address.
- Mailbox password. It is stored as a credential record in the DSH credential store, never in plugin configuration or a session event.
- Inbox and Sent folder names.

**Test connection** checks both servers without sending mail. Settings can be saved before the test passes.

To enable automatic replies, open **Mail → Settings → Automatic replies**, tick **Check the inbox in the background**, choose an interval, and save. Enabling records the current mailbox position; only newer mail is processed. **Check now** runs one pass immediately. The watcher wakes the session that last used a Mail tool; if there is no live session, the status line reports it and the next pass retries.

## Review workflow

1. Ask the model to read the inbox, for example: *“Read my latest three emails and summarize them.”*
2. Ask for a reply: *“Reply to the second one in HTML, thank them and confirm the meeting.”*
3. The model calls `mail_reply`. The result states whether review is required.
4. For a draft that requires review, open **Mail → Review**, inspect the rendered message, edit if needed, then **Approve & send**. The model can then confirm the send, or the panel sends directly during approval.
5. For a trusted recipient, the draft is approved automatically; the model sends it with `mail_send`.

The model can check status with `mail_drafts` and `mail_status`. It cannot approve a draft: approval is a user action in the panel.

## Limitations

- One mailbox per installation; multi-account selection is not implemented.
- Attachments are listed but not downloaded or attached to outgoing mail.
- Plain-text extraction is heuristic; complex HTML mail may lose formatting in the text alternative.
- The IMAP client implements the common IMAP4rev1 subset (LOGIN/SASL PLAIN, SELECT, UID SEARCH, UID FETCH, UID STORE, APPEND). Unusual server extensions or OAuth-only providers are not supported; use an app password where the provider requires one.
- The Sent-folder copy is best effort. A missing Sent mailbox produces a warning but does not undo a successful send.
- Drafts and settings live under `$DSH_HOME/mail-plugin`; the password lives in the credential store. Removing the plugin leaves both behind.
- The review preview is sandboxed and blocks remote images and scripts, so tracking pixels do not load while you review; some legitimate remote images may also be hidden.
- The background watcher is near-real-time polling, not IMAP IDLE, and runs only while DSH is open with a live session to wake.
- A watcher pass advances past every new UID once it has queued that session, so a model failure after queueing is not retried automatically; the unread message stays in the mailbox for a manual retry.
- The panel's visible copy is English-only.

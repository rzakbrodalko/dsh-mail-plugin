# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 1.x | yes |
| pre-1.0 / local builds | best effort |

## Reporting a vulnerability

Please open a **private GitHub security advisory** on the repository rather than a public issue:

<https://github.com/rzakbrodalko/dsh-mail-plugin/security/advisories/new>

Include the plugin version, DSH version, operating system, a minimal reproduction, and the impact. Do not include real mailbox passwords, message contents, or other personal data. If you must demonstrate a credential problem, rotate the credential afterwards and redact it.

You can expect an initial acknowledgement within a few days. This is a volunteer community project; no bounty is offered.

## Threat model

The plugin is a DSH Host plugin. It executes in-process with the DSH process's privileges. It is not a sandbox, a mail gateway, or an email security product.

Assets:

- IMAP/SMTP credentials.
- Mailbox contents and message metadata.
- Draft bodies and recipient addresses on local disk.
- The ability to send messages as the configured account.

Trust boundaries:

1. **Provider** — IMAP/SMTP servers are contacted over TLS by default. Selecting `None` sends credentials and mail in plaintext.
2. **Model** — email content is untrusted input. The watcher prompt tells the model to treat it as data, but prompt injection remains possible.
3. **Sender identity** — a trusted address or domain only says what the envelope claims. It does not prove the human sender is who they claim to be.
4. **Local filesystem** — settings and drafts live under `$DSH_HOME/mail-plugin`; the password lives in the DSH credential store. Anyone who can read the DSH home can read the drafts.
5. **Other DSH tools** — the Mail plugin does not grant filesystem or shell access. Any such access comes from the rest of the session and is governed by DSH's sandbox and approval policy.

## Known risks and mitigations

- **Automatic sending** — only recipients covered by the trusted list skip review. Prefer exact addresses over domains. A compromised trusted mailbox can trigger unreviewed replies.
- **Reply loops** — the watcher skips messages from the mailbox itself and messages declaring `Auto-Submitted`. This is best effort, not a guarantee.
- **Prompt injection** — the watcher prompt marks message content as data, but the model can still be manipulated. Do not combine automatic mail with broad filesystem or shell permissions unless you accept that risk.
- **Credential storage** — use an app password, not the primary account password. TLS is mandatory for real use. Rotate the password if the profile or machine is compromised.
- **Data retention** — removing the plugin does not remove its credential, settings, drafts, or watcher state. Clean them explicitly if needed.
- **Preview isolation** — the review iframe uses a sandbox and a restrictive CSP so scripts and remote images do not run while reviewing.

## Out of scope

- Vulnerabilities in DSH, Node.js, or the mail provider.
- Compromise of a trusted sender's mailbox or account.
- A model producing a wrong or harmful answer that the user approved or that policy allowed automatically.
- Loss of data caused by deleting files under `$DSH_HOME`.
- Mail server misconfiguration, quota, or provider-side filtering.

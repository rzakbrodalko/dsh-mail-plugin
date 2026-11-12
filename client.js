window.__ModuleLoader__.load({
  id: '@local/dsh-mail',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useRef, useState } = React

    function formatDate(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    }

    function statusTone(status) {
      if (status === 'pending_review') return 'warn'
      if (status === 'sent') return 'ok'
      if (status === 'failed' || status === 'rejected') return 'error'
      return 'neutral'
    }

    function MailIcon({ size, call }) {
      const edge = typeof size === 'number' ? size : 20
      const [pending, setPending] = useState(0)
      useEffect(() => {
        if (typeof call !== 'function') return undefined
        let cancelled = false
        const load = async () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
          try {
            const data = await call('drafts/list')
            if (!cancelled) setPending(data?.pending?.length ?? 0)
          } catch {
            // The panel reports host failures; the ambient badge stays quiet.
          }
        }
        void load()
        const timer = setInterval(load, 20_000)
        return () => {
          cancelled = true
          clearInterval(timer)
        }
      }, [call])
      return h('svg', {
        width: edge,
        height: edge,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      },
        h('rect', { x: 3, y: 5, width: 18, height: 14, rx: 2.5 }),
        h('path', { d: 'm4 7 8 6 8-6' }),
        pending > 0
          ? h('circle', {
            cx: 20.5,
            cy: 4.5,
            r: 3.4,
            fill: 'var(--dsw-alias-state-warn-primary)',
            stroke: 'var(--dsw-alias-bg-base)',
            strokeWidth: 1.4,
          })
          : null,
      )
    }

    function MailPanel({ call }) {
      const [status, setStatus] = useState(null)
      const [lists, setLists] = useState({ pending: [], approved: [], failed: [], recent: [], rejected: [] })
      const [tab, setTab] = useState('review')
      const [selectedId, setSelectedId] = useState(null)
      const [detail, setDetail] = useState(null)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const selectedRef = useRef(null)
      selectedRef.current = selectedId

      // Success notices are transient; keep errors until the next action.
      useEffect(() => {
        if (notice === '') return undefined
        const timer = setTimeout(() => setNotice(''), 5_000)
        return () => clearTimeout(timer)
      }, [notice])

      async function refresh() {
        try {
          const [nextStatus, nextLists] = await Promise.all([
            call('status'),
            call('drafts/list'),
          ])
          setStatus(nextStatus)
          setLists(nextLists)
          const ids = [
            ...nextLists.pending,
            ...(nextLists.approved ?? []),
            ...nextLists.failed,
          ].map(draft => draft.id)
          const current = selectedRef.current
          const nextId = current !== null && ids.includes(current) ? current : (ids[0] ?? null)
          setSelectedId(nextId)
          return nextId
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure))
          return selectedRef.current
        }
      }

      useEffect(() => {
        let cancelled = false
        const load = () => {
          if (cancelled || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return
          void refresh()
        }
        load()
        const timer = setInterval(load, 8000)
        return () => {
          cancelled = true
          clearInterval(timer)
        }
      }, [])

      useEffect(() => {
        if (selectedId === null) {
          setDetail(null)
          return undefined
        }
        setDetail(null)
        let cancelled = false
        call('draft/get', { id: selectedId })
          .then(next => {
            if (!cancelled) setDetail(next)
          })
          .catch(failure => {
            if (!cancelled) setError(failure instanceof Error ? failure.message : String(failure))
          })
        return () => {
          cancelled = true
        }
      }, [selectedId])

      async function run(operation, success) {
        setBusy(true)
        setError('')
        setNotice('')
        let accepted = false
        try {
          const value = await operation()
          accepted = true
          if (success) setNotice(success(value))
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure))
        } finally {
          const nextId = await refresh()
          if (nextId !== null) {
            try {
              setDetail(await call('draft/get', { id: nextId }))
            } catch {
              setDetail(null)
            }
          }
          setBusy(false)
        }
        return accepted
      }

      const pending = [...lists.pending, ...(lists.approved ?? []), ...lists.failed]
      const loading = status === null
      const configured = status?.configured === true
      const accountLabel = loading
        ? 'Loading…'
        : configured
          ? (status.account.name ? `${status.account.name} <${status.account.address}>` : status.account.address)
          : 'Not configured'

      return h('div', { className: 'dsh-mail-page' },
        h('style', null, CSS),
        h('header', { className: 'dsh-mail-head' },
          h('div', { className: 'dsh-mail-titlewrap' },
            h('h1', { className: 'dsh-mail-title' }, 'Mail'),
            h('span', { className: configured || loading ? 'dsh-mail-account' : 'dsh-mail-account is-off' }, accountLabel),
          ),
          h('div', { className: 'dsh-mail-head-actions' },
            lists.pending.length > 0
              ? h('span', { className: 'dsh-mail-badge is-warn' }, `${lists.pending.length} awaiting review`)
              : null,
            h('button', {
              type: 'button',
              className: 'dsh-mail-button is-quiet',
              onClick: () => { setError(''); setNotice(''); void refresh() },
              disabled: busy,
            }, 'Refresh'),
          ),
        ),
        h('nav', { className: 'dsh-mail-tabs', role: 'tablist' },
          h('button', {
            type: 'button', role: 'tab', 'aria-selected': tab === 'review',
            className: tab === 'review' ? 'dsh-mail-tab is-active' : 'dsh-mail-tab',
            onClick: () => setTab('review'),
          }, 'Review'),
          h('button', {
            type: 'button', role: 'tab', 'aria-selected': tab === 'settings',
            className: tab === 'settings' ? 'dsh-mail-tab is-active' : 'dsh-mail-tab',
            onClick: () => setTab('settings'),
          }, 'Settings'),
        ),
        error !== '' ? h('div', { className: 'dsh-mail-alert is-error', role: 'alert' }, error) : null,
        notice !== '' ? h('div', { className: 'dsh-mail-alert is-ok', role: 'status' }, notice) : null,
        h('div', { className: tab === 'review' ? 'dsh-mail-body' : 'dsh-mail-body is-hidden' },
          h('aside', { className: 'dsh-mail-list' },
            h('div', { className: 'dsh-mail-list-head' }, 'Reply drafts'),
            pending.length === 0
              ? h('p', { className: 'dsh-mail-empty' },
                loading
                  ? 'Loading mailbox…'
                  : configured
                    ? 'No drafts yet. Ask the model to read a message and draft a reply.'
                    : 'Configure the mailbox in Settings first.')
              : pending.map(draft => h('button', {
                key: draft.id,
                type: 'button',
                className: draft.id === selectedId ? 'dsh-mail-item is-active' : 'dsh-mail-item',
                onClick: () => {
                  setDetail(null)
                  setSelectedId(draft.id)
                },
              },
              h('span', { className: 'dsh-mail-item-top' },
                h('span', { className: 'dsh-mail-item-subject' }, draft.subject || '(no subject)'),
                h('span', { className: `dsh-mail-pill is-${statusTone(draft.status)}` },
                  draft.status === 'pending_review' ? 'Review'
                    : draft.status === 'failed' ? 'Retry'
                      : draft.status === 'approved' ? 'Ready' : draft.status),
              ),
              h('span', { className: 'dsh-mail-item-to' }, `To ${draft.to.join(', ') || '(no recipient)'}`),
              h('span', { className: 'dsh-mail-item-time' }, formatDate(draft.updatedAt)),
              )),
            lists.recent.length > 0
              ? h('div', { className: 'dsh-mail-recent' },
                h('div', { className: 'dsh-mail-list-head' }, 'Recently sent'),
                lists.recent.map(draft => h('div', { key: draft.id, className: 'dsh-mail-recent-row' },
                  h('span', { className: 'dsh-mail-recent-subject' }, draft.subject || '(no subject)'),
                  h('span', { className: 'dsh-mail-recent-time' }, formatDate(draft.sentAt)),
                )),
              )
              : null,
            (lists.rejected ?? []).length > 0
              ? h('div', { className: 'dsh-mail-recent' },
                h('div', { className: 'dsh-mail-list-head' }, 'Recently rejected'),
                lists.rejected.map(draft => h('div', { key: draft.id, className: 'dsh-mail-recent-row' },
                  h('span', { className: 'dsh-mail-recent-subject' }, draft.subject || '(no subject)'),
                  h('span', { className: 'dsh-mail-recent-time' }, formatDate(draft.updatedAt)),
                )),
              )
              : null,
          ),
          h('section', { className: 'dsh-mail-detail' },
            loading
              ? h('p', { className: 'dsh-mail-empty' }, 'Loading mailbox…')
              : !configured
                ? h(EmptyState, { onOpenSettings: () => setTab('settings') })
                : detail === null
                  ? h('p', { className: 'dsh-mail-empty' }, selectedId === null ? 'Select a draft to review it.' : 'Loading draft…')
                  : h(DraftView, {
                    key: `${detail.id}:${detail.updatedAt}`,
                    draft: detail,
                    busy,
                    onSave: payload => run(
                      () => call('draft/update', { id: detail.id, html: payload.html, text: payload.text, subject: payload.subject }),
                      () => 'Draft saved.',
                    ),
                    onApprove: () => run(
                      () => call('draft/approve', { id: detail.id }),
                      value => `Sent to ${(value.recipients ?? []).join(', ')}${value.warning ? ` — ${value.warning}` : ''}`,
                    ),
                    onRetry: () => run(
                      () => call('draft/retry', { id: detail.id }),
                      value => `Sent to ${(value.recipients ?? []).join(', ')}${value.warning ? ` — ${value.warning}` : ''}`,
                    ),
                    onReject: () => run(
                      () => call('draft/reject', { id: detail.id }),
                      () => 'Draft rejected.',
                    ),
                    onDone: () => setSelectedId(null),
                  }),
          ),
        ),
        h('div', { className: tab === 'settings' ? 'dsh-mail-scroll' : 'dsh-mail-scroll is-hidden' },
          status === null
            ? h('p', { className: 'dsh-mail-empty' }, 'Loading settings…')
            : h(SettingsForm, {
              key: status.updatedAt ?? 'new',
              status,
              call,
              busy,
              onBusy: setBusy,
              onSaved: value => {
                setStatus(value)
                setNotice('Mailbox settings saved.')
                setError('')
              },
              onError: setError,
            }),
        ),
      )
    }

    function EmptyState({ onOpenSettings }) {
      return h('div', { className: 'dsh-mail-emptystate' },
        h('h2', null, 'Connect a mailbox'),
        h('p', null, 'Add the mailbox address, IMAP and SMTP servers, and password. The password is kept in the DSH credential store, never in the plugin configuration.'),
        h('button', { type: 'button', className: 'dsh-mail-button is-primary', onClick: onOpenSettings }, 'Open settings'),
      )
    }

    function DraftView({ draft, busy, onSave, onApprove, onRetry, onReject, onDone }) {
      const [html, setHtml] = useState(draft.html)
      const [subject, setSubject] = useState(draft.subject)
      const [confirm, setConfirm] = useState('')
      const dirty = html !== draft.html || subject !== draft.subject
      const editable = draft.status !== 'sent' && draft.status !== 'rejected'
      const sourceFrom = (draft.sourceFrom ?? [])
        .map(entry => (entry.name ? `${entry.name} <${entry.address}>` : entry.address))
        .join(', ')
      async function sendCurrent(action) {
        if (dirty) {
          const saved = await onSave({ html, subject })
          if (!saved) return
        }
        await action()
      }
      const preview = html.trim() === ''
        ? h('p', { className: 'dsh-mail-empty' }, 'Nothing to preview yet.')
        : h('iframe', {
          className: 'dsh-mail-preview',
          sandbox: '',
          srcDoc: `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:"><style>body{font:14px/1.55 -apple-system,Segoe UI,sans-serif;color:#1f2328;background:#fff;margin:16px}img{max-width:100%}</style></head><body>${html}</body></html>`,
          title: 'Reply preview',
        })
      return h(React.Fragment, null,
        h('div', { className: 'dsh-mail-detail-head' },
          h('div', null,
            h('h2', { className: 'dsh-mail-detail-title' }, draft.subject || '(no subject)'),
            h('div', { className: 'dsh-mail-meta' },
              h('span', null, `To: ${draft.to.map(entry => entry.address).join(', ') || '(none)'}`),
              draft.cc?.length > 0 ? h('span', null, `Cc: ${draft.cc.map(entry => entry.address).join(', ')}`) : null,
              draft.sourceSubject ? h('span', null, `In reply to: ${draft.sourceSubject}`) : null,
              sourceFrom !== '' ? h('span', null, `From: ${sourceFrom}`) : null,
              h('span', null, draft.sourceUid ? `UID ${draft.sourceUid}` : 'Composed reply'),
            ),
          ),
          h('span', { className: `dsh-mail-pill is-${statusTone(draft.status)}` },
            draft.status === 'pending_review' ? 'Awaiting review'
              : draft.status === 'sent' ? 'Sent'
                : draft.status === 'failed' ? 'Send failed'
                  : draft.status === 'approved' ? 'Approved' : draft.status),
        ),
        draft.reviewReason && draft.status === 'pending_review'
          ? h('p', { className: 'dsh-mail-reason' }, draft.reviewReason)
          : null,
        draft.sourcePreview
          ? h('p', { className: 'dsh-mail-source' }, `Original: ${draft.sourcePreview}`)
          : null,
        draft.error ? h('div', { className: 'dsh-mail-alert is-error' }, draft.error) : null,
        h('label', { className: 'dsh-mail-field' },
          h('span', { className: 'dsh-mail-label' }, 'Subject'),
          h('input', {
            className: 'dsh-mail-input',
            value: subject,
            disabled: !editable,
            onChange: event => { setConfirm(''); setSubject(event.target.value) },
          }),
        ),
        h('div', { className: 'dsh-mail-panes' },
          h('div', { className: 'dsh-mail-pane' },
            h('div', { className: 'dsh-mail-pane-title' }, 'Rendered HTML'),
            preview,
          ),
          h('div', { className: 'dsh-mail-pane' },
            h('div', { className: 'dsh-mail-pane-title' }, 'HTML source'),
            h('textarea', {
              className: 'dsh-mail-textarea',
              value: html,
              disabled: !editable,
              spellCheck: false,
              onChange: event => { setConfirm(''); setHtml(event.target.value) },
            }),
          ),
        ),
        h('div', { className: 'dsh-mail-actions' },
          draft.status === 'pending_review'
            ? h('button', {
              type: 'button', className: 'dsh-mail-button is-primary', disabled: busy,
              onClick: () => { void sendCurrent(onApprove) },
            }, busy ? 'Sending…' : 'Approve & send')
            : null,
          (draft.status === 'approved' || draft.status === 'failed')
            ? h('button', {
              type: 'button', className: 'dsh-mail-button is-primary', disabled: busy,
              onClick: () => { void sendCurrent(onRetry) },
            }, busy ? 'Sending…' : 'Send now')
            : null,
          editable
            ? h('button', {
              type: 'button', className: 'dsh-mail-button', disabled: busy || !dirty,
              onClick: () => { setConfirm(''); void onSave({ html, subject }) },
            }, 'Save changes')
            : null,
          editable
            ? h('button', {
              type: 'button', className: 'dsh-mail-button is-danger', disabled: busy,
              onClick: () => {
                if (confirm === 'reject') {
                  setConfirm('')
                  void onReject()
                } else {
                  setConfirm('reject')
                }
              },
            }, confirm === 'reject' ? 'Confirm reject' : 'Reject')
            : null,
          h('button', {
            type: 'button',
            className: 'dsh-mail-button is-quiet',
            onClick: () => {
              if (!dirty || confirm === 'close') onDone()
              else setConfirm('close')
            },
          }, confirm === 'close' ? 'Discard & close' : 'Close'),
          h('span', { className: 'dsh-mail-spacer' }),
          dirty ? h('span', { className: 'dsh-mail-unsaved' }, 'Unsaved changes') : null,
          confirm === 'close' ? h('span', { className: 'dsh-mail-unsaved' }, 'Click again to discard.') : null,
        ),
        h('p', { className: 'dsh-mail-hint' },
          'The plain-text alternative is regenerated from this HTML when the draft is saved or sent. Sending uses the configured SMTP server and appends a copy to the Sent folder when the server allows it.',
        ),
      )
    }

    function SettingsForm({ status, call, busy, onBusy, onSaved, onError }) {
      const account = status.account
      const [form, setForm] = useState({
        address: account.address,
        name: account.name,
        username: account.username,
        imapHost: account.imapHost,
        imapPort: account.imapPort,
        imapSecurity: account.imapSecurity,
        smtpHost: account.smtpHost,
        smtpPort: account.smtpPort,
        smtpSecurity: account.smtpSecurity,
        folder: account.folder,
        sentFolder: account.sentFolder,
        mode: status.review.mode,
        domains: status.review.trustedDomains.join('\n'),
        password: '',
        watcherEnabled: status.watcher?.enabled === true,
        watcherInterval: status.watcher?.intervalSeconds ?? 60,
      })
      const [testResult, setTestResult] = useState(null)
      const [checkResult, setCheckResult] = useState('')
      const [localBusy, setLocalBusy] = useState(false)
      const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
      const locked = busy || localBusy

      function payload() {
        return {
          account: {
            address: form.address.trim(),
            name: form.name.trim(),
            username: form.username.trim(),
            imapHost: form.imapHost.trim(),
            imapPort: Number(form.imapPort),
            imapSecurity: form.imapSecurity,
            smtpHost: form.smtpHost.trim(),
            smtpPort: Number(form.smtpPort),
            smtpSecurity: form.smtpSecurity,
            folder: form.folder.trim() || 'INBOX',
            sentFolder: form.sentFolder.trim() || 'Sent',
          },
          review: {
            mode: form.mode,
            trustedDomains: form.domains.split(/[\s,;]+/).map(value => value.trim()).filter(Boolean),
          },
          watcher: {
            enabled: form.watcherEnabled,
            intervalSeconds: Number(form.watcherInterval),
          },
          password: form.password,
        }
      }

      async function save(event) {
        event.preventDefault()
        onBusy(true)
        onError('')
        try {
          const value = await call('settings/save', payload())
          onSaved(value)
          setForm(current => ({ ...current, password: '' }))
        } catch (failure) {
          onError(failure instanceof Error ? failure.message : String(failure))
        } finally {
          onBusy(false)
        }
      }

      async function test() {
        onBusy(true)
        setLocalBusy(true)
        onError('')
        setTestResult(null)
        try {
          setTestResult(await call('settings/test', payload()))
        } catch (failure) {
          onError(failure instanceof Error ? failure.message : String(failure))
        } finally {
          setLocalBusy(false)
          onBusy(false)
        }
      }

      async function checkNow() {
        onBusy(true)
        setLocalBusy(true)
        onError('')
        setCheckResult('')
        try {
          const result = await call('watcher/check')
          if (result?.baseline === true) {
            setCheckResult(`Baseline recorded at UID ${result.lastUid}. New mail from now on will be processed.`)
          } else if (result?.enabled === false) {
            setCheckResult('Enable the watcher first.')
          } else if (typeof result?.error === 'string') {
            setCheckResult(`Check failed: ${result.error}`)
          } else if (result?.busy === true) {
            setCheckResult('A check is already running.')
          } else if ((result?.new ?? 0) > 0) {
            setCheckResult(`Queued ${result.new} new message(s) for the watcher session.`)
          } else {
            setCheckResult('No new mail.')
          }
        } catch (failure) {
          onError(failure instanceof Error ? failure.message : String(failure))
        } finally {
          setLocalBusy(false)
          onBusy(false)
        }
      }

      return h('form', { className: 'dsh-mail-form', onSubmit: save },
        h('section', { className: 'dsh-mail-section' },
          h('h2', null, 'Mailbox'),
          h('div', { className: 'dsh-mail-grid' },
            h(Field, { label: 'Email address', value: form.address, onChange: value => set('address', value), placeholder: 'you@example.com', required: true }),
            h(Field, { label: 'Display name', value: form.name, onChange: value => set('name', value), placeholder: 'Your name' }),
            h(Field, { label: 'IMAP host', value: form.imapHost, onChange: value => set('imapHost', value), placeholder: 'imap.example.com', required: true }),
            h(Field, { label: 'IMAP port', value: form.imapPort, onChange: value => set('imapPort', value), type: 'number' }),
            h(Select, {
              label: 'IMAP security', value: form.imapSecurity, onChange: value => set('imapSecurity', value),
              options: [['tls', 'TLS (993)'], ['starttls', 'STARTTLS (143)'], ['none', 'None']],
            }),
            h(Field, { label: 'Username', value: form.username, onChange: value => set('username', value), placeholder: 'Defaults to the email address' }),
            h(Field, { label: 'SMTP host', value: form.smtpHost, onChange: value => set('smtpHost', value), placeholder: 'smtp.example.com', required: true }),
            h(Field, { label: 'SMTP port', value: form.smtpPort, onChange: value => set('smtpPort', value), type: 'number' }),
            h(Select, {
              label: 'SMTP security', value: form.smtpSecurity, onChange: value => set('smtpSecurity', value),
              options: [['tls', 'TLS (465)'], ['starttls', 'STARTTLS (587)'], ['none', 'None']],
            }),
            h(Field, { label: 'Inbox folder', value: form.folder, onChange: value => set('folder', value), placeholder: 'INBOX' }),
            h(Field, { label: 'Sent folder', value: form.sentFolder, onChange: value => set('sentFolder', value), placeholder: 'Sent' }),
            h(Field, {
              label: `Password${status.passwordConfigured ? ' (stored)' : ''}`,
              value: form.password, onChange: value => set('password', value), type: 'password',
              placeholder: status.passwordConfigured ? 'Leave blank to keep the stored password' : 'Mailbox password',
            }),
          ),
        ),
        h('section', { className: 'dsh-mail-section' },
          h('h2', null, 'Review policy'),
          h('div', { className: 'dsh-mail-grid' },
            h(Select, {
              label: 'Before sending', value: form.mode, onChange: value => set('mode', value),
              options: [
                ['allowlist', 'Review all, except trusted recipients'],
                ['always', 'Always review'],
                ['never', 'Never review — auto-approve drafts'],
              ],
            }),
          ),
          h('label', { className: 'dsh-mail-field is-wide' },
            h('span', { className: 'dsh-mail-label' }, 'Trusted recipients'),
            h('textarea', {
              className: 'dsh-mail-textarea is-short',
              value: form.domains,
              spellCheck: false,
              onChange: event => set('domains', event.target.value),
              placeholder: 'example.com\ntest@example.com',
            }),
            h('span', { className: 'dsh-mail-help' },
              'One entry per line. A domain trusts every address at that domain and its subdomains. An exact address such as test@example.com trusts only that mailbox. Anything not listed waits for your approval in Review. With “Never review”, every draft is approved automatically and can be sent by the model without confirmation.'),
          ),
        ),
        h('section', { className: 'dsh-mail-section' },
          h('h2', null, 'Automatic replies'),
          h('label', { className: 'dsh-mail-check' },
            h('input', {
              type: 'checkbox',
              checked: form.watcherEnabled,
              onChange: event => set('watcherEnabled', event.target.checked),
            }),
            h('span', null, 'Check the inbox in the background'),
          ),
          h('div', { className: 'dsh-mail-grid' },
            h(Select, {
              label: 'Check interval', value: String(form.watcherInterval),
              onChange: value => set('watcherInterval', Number(value)),
              options: [['30', 'Every 30 seconds'], ['60', 'Every minute'], ['120', 'Every 2 minutes'], ['300', 'Every 5 minutes']],
            }),
          ),
          h('p', { className: 'dsh-mail-help' },
            'While DSH is running, new unseen mail wakes the session that last used the Mail tools. Replies to trusted domains are sent automatically; drafts to other recipients wait in Review. Enabling the watcher records the current mailbox position, so only later mail is processed.'),
          h('div', { className: 'dsh-mail-watchstate' },
            h('span', null, status.watcher?.lastCheckAt
              ? `Last check: ${formatDate(status.watcher.lastCheckAt)}`
              : 'No check has run yet.'),
            h('span', null, status.watcher?.targetActive
              ? 'Watcher session is active.'
              : 'No active watcher session yet; use any Mail tool in a chat once.'),
            status.watcher?.lastError
              ? h('span', { className: 'is-error' }, `Last error: ${status.watcher.lastError}`)
              : null,
          ),
          h('div', { className: 'dsh-mail-actions' },
            h('button', {
              type: 'button', className: 'dsh-mail-button', disabled: locked, onClick: checkNow,
            }, localBusy ? 'Checking…' : 'Check now'),
            checkResult !== '' ? h('span', { className: 'dsh-mail-help' }, checkResult) : null,
          ),
        ),
        h('div', { className: 'dsh-mail-actions' },
          h('button', { type: 'submit', className: 'dsh-mail-button is-primary', disabled: locked }, busy ? 'Saving…' : 'Save settings'),
          h('button', { type: 'button', className: 'dsh-mail-button', disabled: locked, onClick: test }, localBusy ? 'Testing…' : 'Test connection'),
        ),
        testResult
          ? h('div', { className: 'dsh-mail-test' },
            h(TestLine, { label: 'IMAP', result: testResult.imap }),
            h(TestLine, { label: 'SMTP', result: testResult.smtp }),
          )
          : null,
      )
    }

    function TestLine({ label, result }) {
      return h('div', { className: result?.ok ? 'dsh-mail-test-row is-ok' : 'dsh-mail-test-row is-error' },
        h('strong', null, label),
        h('span', null, result?.ok
          ? (result.value?.messages !== undefined ? `Connected; ${result.value.messages} message(s) in the inbox.` : 'Connected and authenticated.')
          : (result?.error ?? 'Unknown failure')),
      )
    }

    function Field({ label, value, onChange, placeholder, type = 'text', required = false }) {
      return h('label', { className: 'dsh-mail-field' },
        h('span', { className: 'dsh-mail-label' }, label),
        h('input', {
          className: 'dsh-mail-input',
          type,
          value,
          required,
          placeholder,
          onChange: event => onChange(event.target.value),
        }),
      )
    }

    function Select({ label, value, onChange, options }) {
      return h('label', { className: 'dsh-mail-field' },
        h('span', { className: 'dsh-mail-label' }, label),
        h('select', {
          className: 'dsh-mail-input',
          value,
          onChange: event => onChange(event.target.value),
        }, options.map(([optionValue, text]) => h('option', { key: optionValue, value: optionValue }, text))),
      )
    }

    const CSS = `
.dsh-mail-page{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.55}
.dsh-mail-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:clamp(18px,3vw,28px) clamp(20px,4vw,44px) 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-mail-titlewrap{display:flex;align-items:baseline;gap:12px;min-width:0;flex-wrap:wrap}
.dsh-mail-title{margin:0;font-size:20px;line-height:28px;font-weight:500}
.dsh-mail-account{color:var(--dsw-alias-label-secondary);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:52vw}
.dsh-mail-account.is-off{color:var(--dsw-alias-state-warn-primary)}
.dsh-mail-head-actions{display:flex;align-items:center;gap:10px;flex:none}
.dsh-mail-badge{font-size:12px;padding:3px 9px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dsh-mail-badge.is-warn{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent)}
.dsh-mail-tabs{display:flex;gap:2px;padding:8px clamp(20px,4vw,44px) 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-mail-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;padding:7px 12px;border-radius:8px 8px 0 0;cursor:pointer;position:relative;bottom:-1px}
.dsh-mail-tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.dsh-mail-tab.is-active{color:var(--dsw-alias-label-primary);font-weight:500;box-shadow:inset 0 -2px 0 var(--dsw-alias-brand-primary)}
.dsh-mail-alert{margin:12px clamp(20px,4vw,44px) 0;padding:9px 12px;border-radius:8px;font-size:13px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.dsh-mail-alert.is-error{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}
.dsh-mail-alert.is-ok{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 30%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 8%,transparent)}
.dsh-mail-body{display:flex;flex:1;min-height:0;overflow:hidden}
.dsh-mail-list{width:clamp(220px,26vw,320px);flex:none;border-right:1px solid var(--dsw-alias-border-l1);overflow:auto;padding:14px 10px 24px}
.dsh-mail-list-head{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-secondary);padding:4px 8px 8px}
.dsh-mail-item{display:flex;flex-direction:column;gap:4px;width:100%;text-align:left;border:1px solid transparent;background:transparent;border-radius:10px;padding:10px;margin-bottom:4px;color:inherit;font:inherit;cursor:pointer}
.dsh-mail-item:hover{background:var(--dsw-alias-bg-layer-2)}
.dsh-mail-item.is-active{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}
.dsh-mail-item-top{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%}
.dsh-mail-item-subject{font-weight:500;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
.dsh-mail-item-to,.dsh-mail-item-time{font-size:12px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mail-pill{font-size:11px;line-height:18px;padding:0 8px;border-radius:999px;white-space:nowrap;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.dsh-mail-pill.is-warn{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 14%,transparent)}
.dsh-mail-pill.is-ok{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}
.dsh-mail-pill.is-error{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent)}
.dsh-mail-recent{margin-top:20px;border-top:1px solid var(--dsw-alias-border-l1);padding-top:10px}
.dsh-mail-recent-row{display:flex;justify-content:space-between;gap:8px;padding:4px 8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-recent-subject{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mail-recent-time{flex:none}
.dsh-mail-detail{flex:1;min-width:0;overflow:auto;padding:18px clamp(18px,3vw,40px) 32px}
.dsh-mail-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px}
.dsh-mail-detail-title{margin:0 0 4px;font-size:17px;line-height:24px;font-weight:500;overflow-wrap:anywhere}
.dsh-mail-meta{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-reason{font-size:12px;color:var(--dsw-alias-state-warn-primary);margin:6px 0 0}
.dsh-mail-source{margin:6px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-mail-body.is-hidden,.dsh-mail-scroll.is-hidden{display:none}
.dsh-mail-panes{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;min-width:0}
@media (max-width:1000px){.dsh-mail-panes{grid-template-columns:1fr}}
.dsh-mail-pane{display:flex;flex-direction:column;min-width:0;gap:6px}
.dsh-mail-pane-title{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-secondary)}
.dsh-mail-preview{width:100%;height:300px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:#fff}
.dsh-mail-textarea{width:100%;min-height:300px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:12.5px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;padding:10px 12px;box-sizing:border-box}
.dsh-mail-textarea.is-short{min-height:84px;font-family:inherit;font-size:13px}
.dsh-mail-textarea:focus,.dsh-mail-input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dsh-mail-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:16px}
.dsh-mail-spacer{flex:1}
.dsh-mail-unsaved{font-size:12px;color:var(--dsw-alias-state-warn-primary)}
.dsh-mail-button{appearance:none;height:32px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background-color .12s ease,border-color .12s ease,color .12s ease}
.dsh-mail-button:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.dsh-mail-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dsh-mail-button:disabled{opacity:.5;cursor:default}
.dsh-mail-button.is-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}
.dsh-mail-button.is-primary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary) 86%,#000);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 86%,#000);color:#fff}
.dsh-mail-button.is-primary:active:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary) 76%,#000);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 76%,#000);color:#fff}
.dsh-mail-button.is-danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent)}
.dsh-mail-button.is-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 55%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsh-mail-button.is-quiet{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.dsh-mail-button.is-quiet:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:transparent;color:var(--dsw-alias-label-primary)}
.dsh-mail-empty{margin:18px 8px;color:var(--dsw-alias-label-secondary);font-size:13px}
.dsh-mail-emptystate{max-width:520px;margin:24px 0;padding:22px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}
.dsh-mail-emptystate h2{margin:0 0 8px;font-size:16px;font-weight:500}
.dsh-mail-emptystate p{margin:0 0 16px;color:var(--dsw-alias-label-secondary);font-size:13px}
.dsh-mail-scroll{flex:1;min-height:0;overflow:auto;padding:18px clamp(20px,4vw,44px) 40px}
.dsh-mail-form{max-width:900px;display:flex;flex-direction:column;gap:22px}
.dsh-mail-section h2{margin:0 0 10px;font-size:15px;font-weight:500}
.dsh-mail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px}
@media (max-width:760px){.dsh-mail-grid{grid-template-columns:1fr}}
.dsh-mail-field{display:flex;flex-direction:column;gap:5px;min-width:0}
.dsh-mail-field.is-wide{grid-column:1/-1;margin-top:2px}
.dsh-mail-label{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-input{height:32px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:0 10px;box-sizing:border-box;width:100%}
.dsh-mail-help{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-check{display:flex;align-items:center;gap:8px;font-size:13px;margin:2px 0 12px;cursor:pointer}
.dsh-mail-check input{width:15px;height:15px;accent-color:var(--dsw-alias-brand-primary)}
.dsh-mail-watchstate{display:flex;flex-direction:column;gap:3px;margin-top:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-watchstate .is-error{color:var(--dsw-alias-state-error-primary)}
.dsh-mail-hint{margin:16px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-test{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);font-size:13px}
.dsh-mail-test-row{display:flex;gap:10px;align-items:baseline}
.dsh-mail-test-row.is-ok strong{color:var(--dsw-alias-state-success-primary)}
.dsh-mail-test-row.is-error strong{color:var(--dsw-alias-state-error-primary)}
.dsh-mail-test-row span{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
`

    /** Client plugin body. */
    return {
      inject: ['slots'],
      apply(ctx) {
        const call = async (endpoint, payload) => {
          const response = await fetch(`mail-rpc/${endpoint}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ payload: payload ?? null }),
          })
          if (!response.ok) throw new Error(`Mail request failed (${response.status})`)
          const result = await response.json()
          if (result?.ok !== true) {
            throw new Error(result?.error?.message ?? 'Mail request failed')
          }
          return result.value
        }

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'mail',
          inject: () => ({ call }),
        }, MailPanel))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'mail',
          order: 20,
          label: () => 'Mail',
          inject: () => ({ call }),
        }, MailIcon))
      },
    }
  },
})

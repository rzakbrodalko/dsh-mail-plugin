window.__ModuleLoader__.load({
  id: 'dsh-mail-plugin',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useRef, useState } = React

    const LOCALE_NS = 'dsh-mail'
    const ZH = {
      'Mail': '邮件',
      'Loading…': '加载中…',
      'Not configured': '未配置',
      'Refresh': '刷新',
      'Review': '审核',
      'Settings': '设置',
      '{count} awaiting review': '{count} 封待审核',
      'Reply drafts': '回复草稿',
      'Loading mailbox…': '正在加载邮箱…',
      'No drafts yet. Ask the model to read a message and draft a reply.': '暂无草稿。请让模型读取邮件并起草回复。',
      'Configure the mailbox in Settings first.': '请先在设置中配置邮箱。',
      '(no subject)': '（无主题）',
      'Ready': '待发送',
      'Retry': '重试',
      'To {to}': '收件人 {to}',
      '(no recipient)': '（无收件人）',
      'Recently sent': '最近发送',
      'Recently rejected': '最近拒绝',
      'Select a draft to review it.': '选择一封草稿进行审核。',
      'Loading draft…': '正在加载草稿…',
      'Draft saved.': '草稿已保存。',
      'Sent to {to}': '已发送至 {to}',
      'Draft rejected.': '草稿已拒绝。',
      'Loading settings…': '正在加载设置…',
      'Mailbox settings saved.': '邮箱设置已保存。',
      'Connect a mailbox': '连接邮箱',
      'Add the mailbox address, IMAP and SMTP servers, and password. The password is kept in the DSH credential store, never in the plugin configuration.': '填写邮箱地址、IMAP 和 SMTP 服务器以及密码。密码保存在 DSH 凭据存储中，不会写入插件配置。',
      'Open settings': '打开设置',
      'To: {to}': '收件人：{to}',
      'Cc: {cc}': '抄送：{cc}',
      'In reply to: {subject}': '回复：{subject}',
      'From: {from}': '发件人：{from}',
      'UID {uid}': 'UID {uid}',
      'Composed reply': '新撰写的回复',
      'Awaiting review': '待审核',
      'Sent': '已发送',
      'Send failed': '发送失败',
      'Approved': '已批准',
      'Original: {text}': '原文：{text}',
      'Subject': '主题',
      'HTML source': 'HTML 源码',
      'Visual editor': '可视化编辑器',
      'Basic formatting': '基础格式',
      'Bold': '粗体',
      'Italic': '斜体',
      'Underline': '下划线',
      'Heading 2': '标题 2',
      'Heading 3': '标题 3',
      'Bulleted list': '项目符号列表',
      'Numbered list': '编号列表',
      'Quote': '引用',
      'Link': '链接',
      'Clear formatting': '清除格式',
      'Undo': '撤销',
      'Redo': '重做',
      'Link URL': '链接地址',
      'Advanced: HTML source': '高级：HTML 源码',
      'Write the reply…': '撰写回复…',
      'Visual editing is simplified; use Advanced HTML for tables or images.': '可视化编辑会简化格式；表格或图片请使用高级 HTML。',
      'Ask the model for changes': '让模型修改',
      'Describe the change you want…': '描述你想要的修改…',
      'Revise': '修改',
      'Revising…': '修改中…',
      'The model is revising this draft…': '模型正在修改这封草稿…',
      'Draft revised.': '草稿已修改。',
      'Revision failed.': '修改失败。',
      'More specific': '更具体',
      'Add an example': '添加示例',
      'Shorter': '更简短',
      'More formal': '更正式',
      'Warmer': '更亲切',
      'Last request: {instruction}': '上次请求：{instruction}',
      'The draft was revised at the user’s request': '草稿已按你的请求修改，请审核。',
      'Sending…': '发送中…',
      'Approve & send': '批准并发送',
      'Send now': '立即发送',
      'Save changes': '保存更改',
      'Confirm reject': '确认拒绝',
      'Reject': '拒绝',
      'Discard & close': '放弃并关闭',
      'Close': '关闭',
      'Unsaved changes': '未保存的更改',
      'Click again to discard.': '再次点击以放弃。',
      'The plain-text alternative is regenerated from this HTML when the draft is saved or sent. Sending uses the configured SMTP server and appends a copy to the Sent folder when the server allows it.': '保存或发送草稿时，会根据此 HTML 重新生成纯文本替代内容。发送使用已配置的 SMTP 服务器，并在服务器允许时向“已发送”文件夹追加副本。',
      'Enable the watcher first.': '请先启用监听。',
      'A check is already running.': '正在检查中。',
      'No new mail.': '没有新邮件。',
      'Baseline recorded at UID {uid}. New mail from now on will be processed.': '已记录基线 UID {uid}。从现在起会处理新邮件。',
      'Check failed: {error}': '检查失败：{error}',
      'Queued {count} new message(s) for the watcher session.': '已将 {count} 封新邮件加入监听会话的待处理队列。',
      'Mailbox': '邮箱',
      'Email address': '邮箱地址',
      'Display name': '显示名称',
      'Your name': '你的名字',
      'Defaults to the email address': '默认使用邮箱地址',
      'Last check: {time}': '最近检查：{time}',
      'IMAP host': 'IMAP 主机',
      'IMAP port': 'IMAP 端口',
      'IMAP security': 'IMAP 安全',
      'Username': '用户名',
      'SMTP host': 'SMTP 主机',
      'SMTP port': 'SMTP 端口',
      'SMTP security': 'SMTP 安全',
      'Inbox folder': '收件箱文件夹',
      'Sent folder': '已发送文件夹',
      'Password': '密码',
      'Password (stored)': '密码（已保存）',
      'Leave blank to keep the stored password': '留空以保留已保存的密码',
      'Mailbox password': '邮箱密码',
      'Review policy': '审核策略',
      'Before sending': '发送前',
      'Review all, except trusted recipients': '除受信任收件人外均需审核',
      'Always review': '始终审核',
      'Never review — auto-approve drafts': '从不审核 — 自动批准草稿',
      'Trusted recipients': '受信任收件人',
      'One entry per line. A domain trusts every address at that domain and its subdomains. An exact address such as test@example.com trusts only that mailbox. Anything not listed waits for your approval in Review. With “Never review”, every draft is approved automatically and can be sent by the model without confirmation.': '每行一个条目。域名会信任该域名及其子域下的所有地址；test@example.com 这样的完整地址只信任该邮箱。未列出的收件人需要在“审核”中等待你的批准。选择“从不审核”时，所有草稿都会自动批准，模型无需确认即可发送。',
      'Automatic replies': '自动回复',
      'Check the inbox in the background': '在后台检查收件箱',
      'Check interval': '检查间隔',
      'Every 30 seconds': '每 30 秒',
      'Every minute': '每分钟',
      'Every 2 minutes': '每 2 分钟',
      'Every 5 minutes': '每 5 分钟',
      'While DSH is running, new unseen mail wakes the session that last used the Mail tools. Replies to trusted domains are sent automatically; drafts to other recipients wait in Review. Enabling the watcher records the current mailbox position, so only later mail is processed.': 'DSH 运行期间，新的未读邮件会唤醒最近使用过邮件工具的会话。发给受信任收件人的回复会自动发送；其他收件人的草稿会留在“审核”中。启用监听时会记录当前邮箱位置，因此只处理之后到达的邮件。',
      'No check has run yet.': '尚未执行检查。',
      'Watcher session is active.': '监听会话已激活。',
      'No active watcher session yet; use any Mail tool in a chat once.': '还没有活动的监听会话；请先在聊天中使用一次邮件工具。',
      'Last error: {error}': '最近错误：{error}',
      'Checking…': '检查中…',
      'Check now': '立即检查',
      'Saving…': '保存中…',
      'Save settings': '保存设置',
      'Testing…': '测试中…',
      'Test connection': '测试连接',
      'Connected; {count} message(s) in the inbox.': '已连接；收件箱中有 {count} 封邮件。',
      'Connected and authenticated.': '已连接并完成认证。',
      'Unknown failure': '未知错误',
      'Mail request failed': '邮件请求失败',
      'None': '无',
      'Every recipient is trusted': '所有收件人均受信任',
      'This mailbox reviews every outgoing message': '此邮箱要求审核所有外发邮件',
      'Review is disabled for this mailbox': '此邮箱已关闭审核',
      'No recipient could be verified': '无法验证收件人',
      'Review is required for {recipients}': '需要审核：{recipients}',
      'Contacts': '联系人',
      'Contact profiles': '联系人档案',
      'New contact': '新建联系人',
      'Search contacts': '搜索联系人',
      'No contacts yet. Add who people and domains are, so replies use the right language and tone.': '暂无联系人。添加人物或域名说明，让回复使用合适的语言和语气。',
      'Contact profile': '联系人档案',
      'Match (address or domain)': '匹配（地址或域名）',
      'Name': '名称',
      'Relationship': '关系',
      'Language': '语言',
      'Tone': '语气',
      'Notes': '备注',
      'Save contact': '保存联系人',
      'Delete contact': '删除联系人',
      'Confirm delete': '确认删除',
      'Contact saved.': '联系人已保存。',
      'Contact deleted.': '联系人已删除。',
      'exact address': '精确地址',
      'domain': '域名',
      'Select a contact or create a new one.': '选择一个联系人或新建一个。',
      'An exact address wins over a domain. Domain entries also cover subdomains. Profiles only guide language and tone; they never change the trusted-recipient or review policy.': '精确地址优先于域名。域名条目也覆盖子域名。联系人档案只影响语言和语气，不会改变受信任收件人或审核策略。',
      'Stored locally under $DSH_HOME/mail-plugin. Do not put passwords or sensitive secrets in notes; they are visible to the model.': '保存在 $DSH_HOME/mail-plugin 本地。请勿在备注中填写密码或敏感机密，模型可以看到这些内容。',
    }
    const EN = Object.fromEntries(Object.keys(ZH).map(key => [key, key]))

    function fill(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (match, key) =>
        values[key] === undefined ? match : String(values[key]))
    }

    function reviewReasonText(reason, t) {
      if (reason === undefined || reason === null || reason === '') return ''
      if (Object.hasOwn(ZH, reason)) return t(reason)
      const required = /^Review is required for (.+)$/.exec(reason)
      if (required !== null) return fill(t('Review is required for {recipients}'), { recipients: required[1] })
      return reason
    }

    const PASTE_TAGS = new Set([
      'a', 'b', 'blockquote', 'br', 'caption', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'hr', 'i', 'img', 'li', 'ol', 'p', 's', 'span', 'strong', 'table', 'tbody', 'td', 'tfoot',
      'th', 'thead', 'tr', 'u', 'ul',
    ])
    const PASTE_ATTRS = new Set([
      'href', 'src', 'alt', 'title', 'width', 'height', 'colspan', 'rowspan', 'style', 'align', 'valign',
    ])

    /** Strip markup and attributes that should never enter the visual editor. */
    function sanitizeEditorHtml(input) {
      const doc = new DOMParser().parseFromString(String(input ?? ''), 'text/html')
      const unsafe = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta', 'base', 'title'])
      function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) return
        if (node.nodeType !== Node.ELEMENT_NODE) {
          node.remove()
          return
        }
        const tag = node.tagName.toLowerCase()
        if (unsafe.has(tag)) {
          node.remove()
          return
        }
        for (const child of [...node.childNodes]) walk(child)
        if (!PASTE_TAGS.has(tag)) {
          const parent = node.parentNode
          while (node.firstChild) parent.insertBefore(node.firstChild, node)
          node.remove()
          return
        }
        for (const attribute of [...node.attributes]) {
          const name = attribute.name.toLowerCase()
          if (!PASTE_ATTRS.has(name) || name.startsWith('on')) {
            node.removeAttribute(attribute.name)
            continue
          }
          const value = attribute.value.trim()
          if (name === 'href' && !/^(https?:|mailto:|#)/i.test(value)) node.removeAttribute(attribute.name)
          if (name === 'src' && !/^data:image\//i.test(value)) node.removeAttribute(attribute.name)
          if (name === 'style' && /(expression|behavior\s*:|url\s*\(\s*['"]?\s*javascript:)/i.test(value)) {
            node.removeAttribute(attribute.name)
          }
        }
      }
      for (const child of [...doc.body.childNodes]) walk(child)
      return doc.body.innerHTML
    }

    function plainTextToHtml(text) {
      return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br>')
    }

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

    function MailPanel({ call, t }) {
      const [status, setStatus] = useState(null)
      const [lists, setLists] = useState({ pending: [], approved: [], failed: [], recent: [], rejected: [] })
      const [tab, setTab] = useState('review')
      const [selectedId, setSelectedId] = useState(null)
      const [detail, setDetail] = useState(null)
      const [detailError, setDetailError] = useState('')
      const [detailNonce, setDetailNonce] = useState(0)
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
          setDetailError('')
          return undefined
        }
        setDetail(null)
        setDetailError('')
        let cancelled = false
        call('draft/get', { id: selectedId })
          .then(next => {
            if (!cancelled) setDetail(next)
          })
          .catch(failure => {
            if (!cancelled) setDetailError(failure instanceof Error ? failure.message : String(failure))
          })
        return () => {
          cancelled = true
        }
      }, [selectedId, detailNonce])

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
        ? t('Loading…')
        : configured
          ? (status.account.name ? `${status.account.name} <${status.account.address}>` : status.account.address)
          : t('Not configured')

      return h('div', { className: 'dsh-mail-page' },
        h('style', null, CSS),
        h('header', { className: 'dsh-mail-head' },
          h('div', { className: 'dsh-mail-titlewrap' },
            h('h1', { className: 'dsh-mail-title' }, t('Mail')),
            h('span', { className: configured || loading ? 'dsh-mail-account' : 'dsh-mail-account is-off' }, accountLabel),
          ),
          h('div', { className: 'dsh-mail-head-actions' },
            lists.pending.length > 0
              ? h('span', { className: 'dsh-mail-badge is-warn' }, fill(t('{count} awaiting review'), { count: lists.pending.length }))
              : null,
            h('button', {
              type: 'button',
              className: 'dsh-mail-button is-quiet',
              onClick: () => { setError(''); setNotice(''); void refresh() },
              disabled: busy,
            }, t('Refresh')),
          ),
        ),
        h('nav', { className: 'dsh-mail-tabs', role: 'tablist' },
          h('button', {
            type: 'button', role: 'tab', 'aria-selected': tab === 'review',
            className: tab === 'review' ? 'dsh-mail-tab is-active' : 'dsh-mail-tab',
            onClick: () => setTab('review'),
          }, t('Review')),
          h('button', {
            type: 'button', role: 'tab', 'aria-selected': tab === 'contacts',
            className: tab === 'contacts' ? 'dsh-mail-tab is-active' : 'dsh-mail-tab',
            onClick: () => setTab('contacts'),
          }, t('Contacts')),
          h('button', {
            type: 'button', role: 'tab', 'aria-selected': tab === 'settings',
            className: tab === 'settings' ? 'dsh-mail-tab is-active' : 'dsh-mail-tab',
            onClick: () => setTab('settings'),
          }, t('Settings')),
        ),
        error !== '' ? h('div', { className: 'dsh-mail-alert is-error', role: 'alert' }, error) : null,
        notice !== '' ? h('div', { className: 'dsh-mail-alert is-ok', role: 'status' }, notice) : null,
        h('div', { className: tab === 'review' ? 'dsh-mail-body' : 'dsh-mail-body is-hidden' },
          h('aside', { className: 'dsh-mail-list' },
            h('div', { className: 'dsh-mail-list-head' }, t('Reply drafts')),
            pending.length === 0
              ? h('p', { className: 'dsh-mail-empty' },
                loading
                  ? t('Loading mailbox…')
                  : configured
                    ? t('No drafts yet. Ask the model to read a message and draft a reply.')
                    : t('Configure the mailbox in Settings first.'))
              : pending.map(draft => h('button', {
                key: draft.id,
                type: 'button',
                className: draft.id === selectedId ? 'dsh-mail-item is-active' : 'dsh-mail-item',
                onClick: () => {
                  if (draft.id === selectedId) {
                    if (detail === null) setDetailNonce(value => value + 1)
                    return
                  }
                  setDetail(null)
                  setSelectedId(draft.id)
                },
              },
              h('span', { className: 'dsh-mail-item-top' },
                h('span', { className: 'dsh-mail-item-subject' }, draft.subject || t('(no subject)')),
                h('span', { className: `dsh-mail-pill is-${statusTone(draft.status)}` },
                  draft.status === 'pending_review' ? t('Review')
                    : draft.status === 'failed' ? t('Retry')
                      : draft.status === 'approved' ? t('Ready') : draft.status),
              ),
              h('span', { className: 'dsh-mail-item-to' }, fill(t('To {to}'), { to: draft.to.join(', ') || t('(no recipient)') })),
              h('span', { className: 'dsh-mail-item-time' }, formatDate(draft.updatedAt)),
              )),
            lists.recent.length > 0
              ? h('div', { className: 'dsh-mail-recent' },
                h('div', { className: 'dsh-mail-list-head' }, t('Recently sent')),
                lists.recent.map(draft => h('div', { key: draft.id, className: 'dsh-mail-recent-row' },
                  h('span', { className: 'dsh-mail-recent-subject' }, draft.subject || t('(no subject)')),
                  h('span', { className: 'dsh-mail-recent-time' }, formatDate(draft.sentAt)),
                )),
              )
              : null,
            (lists.rejected ?? []).length > 0
              ? h('div', { className: 'dsh-mail-recent' },
                h('div', { className: 'dsh-mail-list-head' }, t('Recently rejected')),
                lists.rejected.map(draft => h('div', { key: draft.id, className: 'dsh-mail-recent-row' },
                  h('span', { className: 'dsh-mail-recent-subject' }, draft.subject || t('(no subject)')),
                  h('span', { className: 'dsh-mail-recent-time' }, formatDate(draft.updatedAt)),
                )),
              )
              : null,
          ),
          h('section', { className: 'dsh-mail-detail' },
            loading
              ? h('p', { className: 'dsh-mail-empty' }, t('Loading mailbox…'))
              : !configured
                ? h(EmptyState, { onOpenSettings: () => setTab('settings'), t })
                : detail === null
                  ? detailError !== ''
                    ? h('div', { className: 'dsh-mail-detail-error' },
                      h('p', { className: 'dsh-mail-empty' }, detailError),
                      h('button', {
                        type: 'button',
                        className: 'dsh-mail-button',
                        onClick: () => setDetailNonce(value => value + 1),
                      }, t('Retry')),
                    )
                    : h('p', { className: 'dsh-mail-empty' }, selectedId === null ? t('Select a draft to review it.') : t('Loading draft…'))
                  : h(DraftView, {
                    key: `${detail.id}:${detail.updatedAt}`,
                    draft: detail,
                    busy,
                    call,
                    t,
                    onRevised: next => {
                      setDetail(next)
                      setNotice(t('Draft revised.'))
                    },
                    onSave: payload => run(
                      () => call('draft/update', { id: detail.id, html: payload.html, text: payload.text, subject: payload.subject }),
                      () => t('Draft saved.'),
                    ),
                    onApprove: () => run(
                      () => call('draft/approve', { id: detail.id }),
                      value => `${fill(t('Sent to {to}'), { to: (value.recipients ?? []).join(', ') })}${value.warning ? ` — ${value.warning}` : ''}`,
                    ),
                    onRetry: () => run(
                      () => call('draft/retry', { id: detail.id }),
                      value => `${fill(t('Sent to {to}'), { to: (value.recipients ?? []).join(', ') })}${value.warning ? ` — ${value.warning}` : ''}`,
                    ),
                    onReject: () => run(
                      () => call('draft/reject', { id: detail.id }),
                      () => t('Draft rejected.'),
                    ),
                    onDone: () => setSelectedId(null),
                  }),
          ),
        ),
        h('div', { className: tab === 'contacts' ? 'dsh-mail-scroll' : 'dsh-mail-scroll is-hidden' },
          h(ContactsPanel, { call, t }),
        ),
        h('div', { className: tab === 'settings' ? 'dsh-mail-scroll' : 'dsh-mail-scroll is-hidden' },
          status === null
            ? h('p', { className: 'dsh-mail-empty' }, t('Loading settings…'))
            : h(SettingsForm, {
              key: status.updatedAt ?? 'new',
              status,
              call,
              busy,
              t,
              onBusy: setBusy,
              onSaved: value => {
                setStatus(value)
                setNotice(t('Mailbox settings saved.'))
                setError('')
              },
              onError: setError,
            }),
        ),
      )
    }

    function EmptyState({ onOpenSettings, t }) {
      return h('div', { className: 'dsh-mail-emptystate' },
        h('h2', null, t('Connect a mailbox')),
        h('p', null, t('Add the mailbox address, IMAP and SMTP servers, and password. The password is kept in the DSH credential store, never in the plugin configuration.')),
        h('button', { type: 'button', className: 'dsh-mail-button is-primary', onClick: onOpenSettings }, t('Open settings')),
      )
    }

    function DraftView({ draft, busy, call, onSave, onApprove, onRetry, onReject, onDone, onRevised, t }) {
      const [html, setHtml] = useState(draft.html)
      const [subject, setSubject] = useState(draft.subject)
      const [confirm, setConfirm] = useState('')
      const [instruction, setInstruction] = useState('')
      const [revisionError, setRevisionError] = useState(draft.revision?.error ?? '')
      const [revising, setRevising] = useState(draft.revision?.status === 'requested')
      const editorRef = useRef(null)
      const skipHydrateRef = useRef(false)
      const dirty = html !== draft.html || subject !== draft.subject
      const editable = draft.status !== 'sent' && draft.status !== 'rejected'
      const editorEditable = editable && !revising
      const sourceFrom = (draft.sourceFrom ?? [])
        .map(entry => (entry.name ? `${entry.name} <${entry.address}>` : entry.address))
        .join(', ')

      useEffect(() => {
        if (!revising) return undefined
        let cancelled = false
        async function poll() {
          try {
            const next = await call('draft/get', { id: draft.id })
            if (cancelled) return
            if (next.revision?.status === 'ready') {
              setRevising(false)
              setInstruction('')
              setRevisionError('')
              if (onRevised !== undefined) onRevised(next)
            } else if (next.revision?.status === 'error') {
              setRevising(false)
              setRevisionError(next.revision.error || t('Revision failed.'))
            }
          } catch (failure) {
            if (!cancelled) {
              setRevising(false)
              setRevisionError(failure instanceof Error ? failure.message : String(failure))
            }
          }
        }
        void poll()
        const timer = setInterval(() => { void poll() }, 1_500)
        return () => {
          cancelled = true
          clearInterval(timer)
        }
      }, [revising, draft.id])

      async function submitRevision(value) {
        const text = String(value ?? instruction).trim()
        if (!editable || revising || text === '') return
        setRevisionError('')
        try {
          setRevising(true)
          await call('draft/revise', { id: draft.id, instruction: text, html, subject })
          setInstruction('')
        } catch (failure) {
          setRevising(false)
          setRevisionError(failure instanceof Error ? failure.message : String(failure))
        }
      }

      useEffect(() => {
        const editor = editorRef.current
        if (editor === null) return
        if (skipHydrateRef.current) {
          skipHydrateRef.current = false
          return
        }
        if (document.activeElement !== editor && editor.innerHTML !== html) {
          editor.innerHTML = sanitizeEditorHtml(html)
        }
      }, [html, editable])

      function syncEditor() {
        if (editorRef.current !== null) {
          skipHydrateRef.current = true
          setHtml(editorRef.current.innerHTML)
        }
      }

      function applyCommand(command, value) {
        if (!editable || revising) return
        const editor = editorRef.current
        if (editor === null) return
        editor.focus()
        try {
          document.execCommand(command, false, value)
        } catch {
          // Some embedded browsers disable execCommand; typing still works.
        }
        syncEditor()
      }

      function currentBlockTag() {
        const selection = window.getSelection()
        if (selection === null || selection.rangeCount === 0) return 'p'
        let node = selection.anchorNode
        if (node !== null && node.nodeType === 3) node = node.parentElement
        const block = node?.closest?.('h1,h2,h3,h4,blockquote,p,li')
        return block?.tagName.toLowerCase() ?? 'p'
      }

      function selectedElement() {
        const selection = window.getSelection()
        if (selection === null || selection.rangeCount === 0) return null
        let node = selection.anchorNode
        if (node !== null && node.nodeType === 3) node = node.parentElement
        return node instanceof Element ? node : null
      }

      function unwrapElement(element) {
        const parent = element.parentNode
        if (parent === null) return
        while (element.firstChild) parent.insertBefore(element.firstChild, element)
        element.remove()
      }

      function selectionOffsets(editor) {
        const selection = window.getSelection()
        if (selection === null || selection.rangeCount === 0) return null
        const range = selection.getRangeAt(0)
        if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null
        const before = range.cloneRange()
        before.selectNodeContents(editor)
        before.setEnd(range.startContainer, range.startOffset)
        const start = before.toString().length
        return { start, end: start + range.toString().length }
      }

      function pointAtTextOffset(editor, target) {
        let remaining = Math.max(0, target)
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
        let node = walker.nextNode()
        let last = null
        while (node !== null) {
          last = node
          const length = node.nodeValue?.length ?? 0
          if (remaining <= length) return { node, offset: remaining }
          remaining -= length
          node = walker.nextNode()
        }
        if (last !== null) return { node: last, offset: last.nodeValue?.length ?? 0 }
        return { node: editor, offset: editor.childNodes.length }
      }

      function restoreOffsets(editor, offsets) {
        if (offsets === null) return
        editor.focus()
        const start = pointAtTextOffset(editor, offsets.start)
        const end = pointAtTextOffset(editor, offsets.end)
        const range = document.createRange()
        range.setStart(start.node, start.offset)
        range.setEnd(end.node, end.offset)
        const selection = window.getSelection()
        if (selection === null) return
        selection.removeAllRanges()
        selection.addRange(range)
      }

      function restoreAfterRender(editor, offsets) {
        restoreOffsets(editor, offsets)
        requestAnimationFrame(() => restoreOffsets(editor, offsets))
      }

      function toggleQuote() {
        if (!editable) return
        const editor = editorRef.current
        if (editor === null) return
        const offsets = selectionOffsets(editor)
        editor.focus()
        const node = selectedElement()
        if (node === null || !editor.contains(node)) return
        const quote = node.closest('blockquote')
        if (quote !== null && editor.contains(quote)) {
          let current = quote
          while (current !== null && editor.contains(current)) {
            unwrapElement(current)
            current = node.closest('blockquote')
          }
          syncEditor()
          restoreAfterRender(editor, offsets)
          return
        }
        const block = node.closest('p,h1,h2,h3,h4,li,ul,ol')
        if (block === null || !editor.contains(block)) return
        const target = block.tagName === 'LI' ? block.closest('ul,ol') : block
        if (target === null || target.parentNode === null) return
        const wrapper = document.createElement('blockquote')
        target.parentNode.insertBefore(wrapper, target)
        wrapper.appendChild(target)
        syncEditor()
        restoreAfterRender(editor, offsets)
      }

      function toggleBlock(tag) {
        const target = currentBlockTag() === tag ? 'p' : tag
        applyCommand('formatBlock', `<${target}>`)
      }

      function clearFormatting() {
        if (!editable || revising) return
        const editor = editorRef.current
        if (editor === null) return
        const offsets = selectionOffsets(editor)
        editor.focus()
        try {
          const node = selectedElement()
          let quote = node?.closest('blockquote')
          while (quote !== null && quote !== undefined && editor.contains(quote)) {
            unwrapElement(quote)
            quote = node.closest('blockquote')
          }
          restoreOffsets(editor, offsets)
          document.execCommand('removeFormat')
          document.execCommand('unlink')
          document.execCommand('formatBlock', false, '<p>')
          if (document.queryCommandState('insertUnorderedList')) document.execCommand('insertUnorderedList')
          if (document.queryCommandState('insertOrderedList')) document.execCommand('insertOrderedList')
        } catch {
          // Keep typing available if the embedded browser rejects a command.
        }
        syncEditor()
        requestAnimationFrame(() => restoreOffsets(editor, offsets))
      }

      function addLink() {
        if (!editable || revising) return
        const editor = editorRef.current
        if (editor === null) return
        const selection = window.getSelection()
        const savedRange = selection !== null && selection.rangeCount > 0
          ? selection.getRangeAt(0).cloneRange()
          : null
        const url = window.prompt(t('Link URL'), 'https://')
        if (url === null || !/^(https?:|mailto:)/i.test(url.trim())) return
        editor.focus()
        if (savedRange !== null) {
          selection.removeAllRanges()
          selection.addRange(savedRange)
        }
        if (savedRange === null || savedRange.collapsed) {
          const safeUrl = url.trim()
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          document.execCommand('insertHTML', false, `<a href="${safeUrl}">${safeUrl}</a>`)
        } else {
          document.execCommand('createLink', false, url.trim())
        }
        syncEditor()
      }

      function pasteEditor(event) {
        if (!editable || revising) return
        event.preventDefault()
        const clipboard = event.clipboardData
        if (clipboard === null) return
        const rich = clipboard.getData('text/html')
        const plain = clipboard.getData('text/plain')
        const safe = rich.trim() === '' ? plainTextToHtml(plain) : sanitizeEditorHtml(rich)
        editorRef.current?.focus()
        document.execCommand('insertHTML', false, safe)
        syncEditor()
      }

      function tool(label, command, title, value) {
        return h('button', {
          type: 'button',
          className: 'dsh-mail-tool',
          disabled: !editorEditable || busy,
          title: t(title),
          'aria-label': t(title),
          onMouseDown: event => event.preventDefault(),
          onClick: () => applyCommand(command, value),
        }, label)
      }

      function blockTool(label, tag, title) {
        return h('button', {
          type: 'button',
          className: 'dsh-mail-tool',
          disabled: !editorEditable || busy,
          title: t(title),
          'aria-label': t(title),
          onMouseDown: event => event.preventDefault(),
          onClick: () => toggleBlock(tag),
        }, label)
      }

      async function sendCurrent(action) {
        if (dirty) {
          const saved = await onSave({ html, subject })
          if (!saved) return
        }
        await action()
      }
      return h(React.Fragment, null,
        h('div', { className: 'dsh-mail-detail-head' },
          h('div', null,
            h('h2', { className: 'dsh-mail-detail-title' }, draft.subject || t('(no subject)')),
            h('div', { className: 'dsh-mail-meta' },
              h('span', null, fill(t('To: {to}'), { to: draft.to.map(entry => entry.address).join(', ') || t('None') })),
              draft.cc?.length > 0 ? h('span', null, fill(t('Cc: {cc}'), { cc: draft.cc.map(entry => entry.address).join(', ') })) : null,
              draft.sourceSubject ? h('span', null, fill(t('In reply to: {subject}'), { subject: draft.sourceSubject })) : null,
              sourceFrom !== '' ? h('span', null, fill(t('From: {from}'), { from: sourceFrom })) : null,
              h('span', null, draft.sourceUid ? fill(t('UID {uid}'), { uid: draft.sourceUid }) : t('Composed reply')),
            ),
          ),
          h('span', { className: `dsh-mail-pill is-${statusTone(draft.status)}` },
            draft.status === 'pending_review' ? t('Awaiting review')
              : draft.status === 'sent' ? t('Sent')
                : draft.status === 'failed' ? t('Send failed')
                  : draft.status === 'approved' ? t('Approved') : draft.status),
        ),
        draft.reviewReason && draft.status === 'pending_review'
          ? h('p', { className: 'dsh-mail-reason' }, reviewReasonText(draft.reviewReason, t))
          : null,
        draft.sourcePreview
          ? h('p', { className: 'dsh-mail-source' }, fill(t('Original: {text}'), { text: draft.sourcePreview }))
          : null,
        draft.error ? h('div', { className: 'dsh-mail-alert is-error' }, draft.error) : null,
        h('label', { className: 'dsh-mail-field' },
          h('span', { className: 'dsh-mail-label' }, t('Subject')),
          h('input', {
            className: 'dsh-mail-input',
            value: subject,
            disabled: !editable,
            onChange: event => { setConfirm(''); setSubject(event.target.value) },
          }),
        ),
        h('div', { className: 'dsh-mail-pane dsh-mail-review' },
          h('div', { className: 'dsh-mail-pane-head' },
            h('div', { className: 'dsh-mail-pane-title' }, t('Visual editor')),
            h('span', { className: 'dsh-mail-editor-hint' }, t('Basic formatting')),
          ),
          h('div', { className: 'dsh-mail-toolbar' },
            tool('B', 'bold', 'Bold'),
            tool('I', 'italic', 'Italic'),
            tool('U', 'underline', 'Underline'),
            blockTool('H2', 'h2', 'Heading 2'),
            blockTool('H3', 'h3', 'Heading 3'),
            tool('•', 'insertUnorderedList', 'Bulleted list'),
            tool('1.', 'insertOrderedList', 'Numbered list'),
            h('button', {
              type: 'button',
              className: 'dsh-mail-tool',
              disabled: !editable || busy,
              title: t('Quote'),
              'aria-label': t('Quote'),
              onMouseDown: event => event.preventDefault(),
              onClick: toggleQuote,
            }, '❝'),
            h('button', {
              type: 'button',
              className: 'dsh-mail-tool',
              disabled: !editorEditable || busy,
              title: t('Link'),
              'aria-label': t('Link'),
              onMouseDown: event => event.preventDefault(),
              onClick: addLink,
            }, '🔗'),
            h('button', {
              type: 'button',
              className: 'dsh-mail-tool',
              disabled: !editorEditable || busy,
              title: t('Clear formatting'),
              'aria-label': t('Clear formatting'),
              onMouseDown: event => event.preventDefault(),
              onClick: clearFormatting,
            }, '⌫'),
            tool('↶', 'undo', 'Undo'),
            tool('↷', 'redo', 'Redo'),
          ),
          h('div', {
            className: 'dsh-mail-editor',
            ref: editorRef,
            contentEditable: editorEditable,
            suppressContentEditableWarning: true,
            spellCheck: false,
            role: 'textbox',
            'aria-multiline': 'true',
            'aria-label': t('Visual editor'),
            'data-placeholder': t('Write the reply…'),
            onInput: event => { setConfirm(''); setHtml(event.currentTarget.innerHTML) },
            onPaste: pasteEditor,
          }),
          h('p', { className: 'dsh-mail-editor-help' },
            t('Visual editing is simplified; use Advanced HTML for tables or images.')),
          h('details', { className: 'dsh-mail-advanced' },
            h('summary', null, t('Advanced: HTML source')),
            h('textarea', {
              className: 'dsh-mail-textarea',
              value: html,
              disabled: !editorEditable,
              spellCheck: false,
              onChange: event => { setConfirm(''); setHtml(event.target.value) },
            }),
          ),
        ),
        editable
          ? h('div', { className: 'dsh-mail-revision' },
            h('label', { className: 'dsh-mail-label' }, t('Ask the model for changes')),
            h('div', { className: 'dsh-mail-revision-row' },
              h('input', {
                className: 'dsh-mail-input',
                value: instruction,
                disabled: busy || revising,
                placeholder: t('Describe the change you want…'),
                onChange: event => setInstruction(event.target.value),
                onKeyDown: event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void submitRevision()
                  }
                },
              }),
              h('button', {
                type: 'button',
                className: 'dsh-mail-button',
                disabled: busy || revising || instruction.trim() === '',
                onClick: () => { void submitRevision() },
              }, revising ? t('Revising…') : t('Revise')),
            ),
            h('div', { className: 'dsh-mail-revision-quick' },
              ['More specific', 'Add an example', 'Shorter', 'More formal', 'Warmer'].map(label =>
                h('button', {
                  key: label,
                  type: 'button',
                  className: 'dsh-mail-chip',
                  disabled: busy || revising,
                  onClick: () => { void submitRevision(t(label)) },
                }, t(label))),
            ),
            revising ? h('p', { className: 'dsh-mail-editor-help' }, t('The model is revising this draft…')) : null,
            revisionError !== '' ? h('p', { className: 'dsh-mail-revision-error' }, revisionError) : null,
            !revising && draft.revision?.instruction
              ? h('p', { className: 'dsh-mail-editor-help' }, fill(t('Last request: {instruction}'), { instruction: draft.revision.instruction }))
              : null,
          )
          : null,
        h('div', { className: 'dsh-mail-actions' },
          draft.status === 'pending_review'
            ? h('button', {
              type: 'button', className: 'dsh-mail-button is-primary', disabled: busy || revising,
              onClick: () => { void sendCurrent(onApprove) },
            }, busy ? t('Sending…') : t('Approve & send'))
            : null,
          (draft.status === 'approved' || draft.status === 'failed')
            ? h('button', {
              type: 'button', className: 'dsh-mail-button is-primary', disabled: busy || revising,
              onClick: () => { void sendCurrent(onRetry) },
            }, busy ? t('Sending…') : t('Send now'))
            : null,
          editable
            ? h('button', {
              type: 'button', className: 'dsh-mail-button', disabled: busy || revising || !dirty,
              onClick: () => { setConfirm(''); void onSave({ html, subject }) },
            }, t('Save changes'))
            : null,
          editable
            ? h('button', {
              type: 'button', className: 'dsh-mail-button is-danger', disabled: busy || revising,
              onClick: () => {
                if (confirm === 'reject') {
                  setConfirm('')
                  void onReject()
                } else {
                  setConfirm('reject')
                }
              },
            }, confirm === 'reject' ? t('Confirm reject') : t('Reject'))
            : null,
          h('button', {
            type: 'button',
            className: 'dsh-mail-button is-quiet',
            onClick: () => {
              if (!dirty || confirm === 'close') onDone()
              else setConfirm('close')
            },
          }, confirm === 'close' ? t('Discard & close') : t('Close')),
          h('span', { className: 'dsh-mail-spacer' }),
          dirty ? h('span', { className: 'dsh-mail-unsaved' }, t('Unsaved changes')) : null,
          confirm === 'close' ? h('span', { className: 'dsh-mail-unsaved' }, t('Click again to discard.')) : null,
        ),
        h('p', { className: 'dsh-mail-hint' },
          t('The plain-text alternative is regenerated from this HTML when the draft is saved or sent. Sending uses the configured SMTP server and appends a copy to the Sent folder when the server allows it.'),
        ),
      )
    }

    function ContactsPanel({ call, t }) {
      const [contacts, setContacts] = useState([])
      const [selectedId, setSelectedId] = useState(null)
      const [draft, setDraft] = useState(null)
      const [query, setQuery] = useState('')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const [confirmDelete, setConfirmDelete] = useState(false)

      function blank() {
        return { id: '', match: '', name: '', relationship: '', language: '', tone: '', notes: '' }
      }

      async function load(preferredId) {
        try {
          const result = await call('contacts/list', { limit: 500 })
          const list = result.contacts ?? []
          setContacts(list)
          const wanted = preferredId ?? selectedId
          const selected = list.find(entry => entry.id === wanted) ?? list[0] ?? null
          if (selected !== null) {
            setSelectedId(selected.id)
            setDraft({ ...selected })
            setConfirmDelete(false)
          } else {
            setSelectedId(null)
            setDraft(null)
          }
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure))
        }
      }

      useEffect(() => {
        void load()
      }, [])

      useEffect(() => {
        if (notice === '') return undefined
        const timer = setTimeout(() => setNotice(''), 5_000)
        return () => clearTimeout(timer)
      }, [notice])

      const filtered = contacts.filter(entry => {
        const needle = query.trim().toLowerCase()
        if (needle === '') return true
        return [entry.match, entry.name, entry.relationship, entry.tone, entry.notes]
          .some(value => String(value ?? '').toLowerCase().includes(needle))
      })

      function select(entry) {
        setSelectedId(entry.id)
        setDraft({ ...entry })
        setConfirmDelete(false)
        setError('')
      }

      function create() {
        setSelectedId(null)
        setDraft(blank())
        setConfirmDelete(false)
        setError('')
      }

      function field(key, value) {
        setDraft(current => ({ ...current, [key]: value }))
        setConfirmDelete(false)
      }

      async function save(event) {
        event.preventDefault()
        if (draft === null) return
        setBusy(true)
        setError('')
        setNotice('')
        try {
          const saved = await call('contacts/save', draft)
          await load(saved.id)
          setNotice(t('Contact saved.'))
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure))
        } finally {
          setBusy(false)
        }
      }

      async function remove() {
        if (draft === null || draft.id === '') return
        if (!confirmDelete) {
          setConfirmDelete(true)
          return
        }
        setBusy(true)
        setError('')
        try {
          await call('contacts/delete', { id: draft.id })
          setDraft(null)
          setSelectedId(null)
          await load(undefined)
          setNotice(t('Contact deleted.'))
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure))
        } finally {
          setConfirmDelete(false)
          setBusy(false)
        }
      }

      const isAddress = draft !== null && draft.match.includes('@')

      return h('div', { className: 'dsh-mail-contacts' },
        h('aside', { className: 'dsh-mail-contact-list' },
          h('div', { className: 'dsh-mail-contact-tools' },
            h('input', {
              className: 'dsh-mail-input',
              value: query,
              placeholder: t('Search contacts'),
              onChange: event => setQuery(event.target.value),
            }),
            h('button', {
              type: 'button', className: 'dsh-mail-button', disabled: busy, onClick: create,
            }, t('New contact')),
          ),
          filtered.length === 0
            ? h('p', { className: 'dsh-mail-empty' }, t('No contacts yet. Add who people and domains are, so replies use the right language and tone.'))
            : filtered.map(entry => h('button', {
              key: entry.id,
              type: 'button',
              className: entry.id === selectedId ? 'dsh-mail-item is-active' : 'dsh-mail-item',
              onClick: () => select(entry),
            },
            h('span', { className: 'dsh-mail-item-top' },
              h('span', { className: 'dsh-mail-item-subject' }, entry.name || entry.match),
              h('span', { className: entry.match.includes('@') ? 'dsh-mail-pill is-exact' : 'dsh-mail-pill is-domain' }, entry.match.includes('@') ? t('exact address') : t('domain')),
            ),
            h('span', { className: 'dsh-mail-item-to' }, entry.match),
            entry.relationship !== '' ? h('span', { className: 'dsh-mail-item-time' }, entry.relationship) : null,
            )),
        ),
        h('section', { className: 'dsh-mail-contact-editor' },
          h('div', { className: 'dsh-mail-contact-head' },
            h('h2', null, t('Contact profile')),
            draft !== null ? h('span', { className: isAddress ? 'dsh-mail-pill is-exact' : 'dsh-mail-pill is-domain' }, isAddress ? t('exact address') : t('domain')) : null,
          ),
          error !== '' ? h('div', { className: 'dsh-mail-alert is-error' }, error) : null,
          notice !== '' ? h('div', { className: 'dsh-mail-alert is-ok' }, notice) : null,
          draft === null
            ? h('p', { className: 'dsh-mail-empty' }, t('Select a contact or create a new one.'))
            : h('form', { className: 'dsh-mail-contact-form', onSubmit: save },
              h('div', { className: 'dsh-mail-grid' },
                h(Field, {
                  label: t('Match (address or domain)'),
                  value: draft.match,
                  onChange: value => field('match', value),
                  placeholder: 'anna@client.com / client.com',
                  required: true,
                }),
                h(Field, {
                  label: t('Name'),
                  value: draft.name,
                  onChange: value => field('name', value),
                  placeholder: t('Name'),
                }),
                h(Field, {
                  label: t('Relationship'),
                  value: draft.relationship,
                  onChange: value => field('relationship', value),
                  placeholder: t('Relationship'),
                }),
                h(Field, {
                  label: t('Language'),
                  value: draft.language,
                  onChange: value => field('language', value),
                  placeholder: 'pl / en',
                }),
                h(Field, {
                  label: t('Tone'),
                  value: draft.tone,
                  onChange: value => field('tone', value),
                  placeholder: t('Tone'),
                }),
              ),
              h('label', { className: 'dsh-mail-field' },
                h('span', { className: 'dsh-mail-label' }, t('Notes')),
                h('textarea', {
                  className: 'dsh-mail-textarea is-short',
                  value: draft.notes,
                  onChange: event => field('notes', event.target.value),
                  placeholder: t('Notes'),
                }),
              ),
              h('p', { className: 'dsh-mail-help' },
                t('An exact address wins over a domain. Domain entries also cover subdomains. Profiles only guide language and tone; they never change the trusted-recipient or review policy.'),
              ),
              h('p', { className: 'dsh-mail-help' },
                t('Stored locally under $DSH_HOME/mail-plugin. Do not put passwords or sensitive secrets in notes; they are visible to the model.'),
              ),
              h('div', { className: 'dsh-mail-actions' },
                h('button', {
                  type: 'submit', className: 'dsh-mail-button is-primary', disabled: busy,
                }, busy ? t('Saving…') : t('Save contact')),
                draft.id !== ''
                  ? h('button', {
                    type: 'button', className: 'dsh-mail-button is-danger', disabled: busy, onClick: remove,
                  }, confirmDelete ? t('Confirm delete') : t('Delete contact'))
                  : null,
              ),
            ),
        ),
      )
    }

    function SettingsForm({ status, call, busy, onBusy, onSaved, onError, t }) {
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
            setCheckResult(fill(t('Baseline recorded at UID {uid}. New mail from now on will be processed.'), { uid: result.lastUid }))
          } else if (result?.enabled === false) {
            setCheckResult(t('Enable the watcher first.'))
          } else if (typeof result?.error === 'string') {
            setCheckResult(fill(t('Check failed: {error}'), { error: result.error }))
          } else if (result?.busy === true) {
            setCheckResult(t('A check is already running.'))
          } else if ((result?.new ?? 0) > 0) {
            setCheckResult(fill(t('Queued {count} new message(s) for the watcher session.'), { count: result.new }))
          } else {
            setCheckResult(t('No new mail.'))
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
          h('h2', null, t('Mailbox')),
          h('div', { className: 'dsh-mail-grid' },
            h(Field, { label: t('Email address'), value: form.address, onChange: value => set('address', value), placeholder: 'you@example.com', required: true }),
            h(Field, { label: t('Display name'), value: form.name, onChange: value => set('name', value), placeholder: t('Your name') }),
            h(Field, { label: t('IMAP host'), value: form.imapHost, onChange: value => set('imapHost', value), placeholder: 'imap.example.com', required: true }),
            h(Field, { label: t('IMAP port'), value: form.imapPort, onChange: value => set('imapPort', value), type: 'number' }),
            h(Select, {
              label: t('IMAP security'), value: form.imapSecurity, onChange: value => set('imapSecurity', value),
              options: [['tls', 'TLS (993)'], ['starttls', 'STARTTLS (143)'], ['none', t('None')]],
            }),
            h(Field, { label: t('Username'), value: form.username, onChange: value => set('username', value), placeholder: t('Defaults to the email address') }),
            h(Field, { label: t('SMTP host'), value: form.smtpHost, onChange: value => set('smtpHost', value), placeholder: 'smtp.example.com', required: true }),
            h(Field, { label: t('SMTP port'), value: form.smtpPort, onChange: value => set('smtpPort', value), type: 'number' }),
            h(Select, {
              label: t('SMTP security'), value: form.smtpSecurity, onChange: value => set('smtpSecurity', value),
              options: [['tls', 'TLS (465)'], ['starttls', 'STARTTLS (587)'], ['none', t('None')]],
            }),
            h(Field, { label: t('Inbox folder'), value: form.folder, onChange: value => set('folder', value), placeholder: 'INBOX' }),
            h(Field, { label: t('Sent folder'), value: form.sentFolder, onChange: value => set('sentFolder', value), placeholder: 'Sent' }),
            h(Field, {
              label: status.passwordConfigured ? t('Password (stored)') : t('Password'),
              value: form.password, onChange: value => set('password', value), type: 'password',
              placeholder: status.passwordConfigured ? t('Leave blank to keep the stored password') : t('Mailbox password'),
            }),
          ),
        ),
        h('section', { className: 'dsh-mail-section' },
          h('h2', null, t('Review policy')),
          h('div', { className: 'dsh-mail-grid' },
            h(Select, {
              label: t('Before sending'), value: form.mode, onChange: value => set('mode', value),
              options: [
                ['allowlist', t('Review all, except trusted recipients')],
                ['always', t('Always review')],
                ['never', t('Never review — auto-approve drafts')],
              ],
            }),
          ),
          h('label', { className: 'dsh-mail-field is-wide' },
            h('span', { className: 'dsh-mail-label' }, t('Trusted recipients')),
            h('textarea', {
              className: 'dsh-mail-textarea is-short',
              value: form.domains,
              spellCheck: false,
              onChange: event => set('domains', event.target.value),
              placeholder: 'example.com\ntest@example.com',
            }),
            h('span', { className: 'dsh-mail-help' },
              t('One entry per line. A domain trusts every address at that domain and its subdomains. An exact address such as test@example.com trusts only that mailbox. Anything not listed waits for your approval in Review. With “Never review”, every draft is approved automatically and can be sent by the model without confirmation.')),
          ),
        ),
        h('section', { className: 'dsh-mail-section' },
          h('h2', null, t('Automatic replies')),
          h('label', { className: 'dsh-mail-check' },
            h('input', {
              type: 'checkbox',
              checked: form.watcherEnabled,
              onChange: event => set('watcherEnabled', event.target.checked),
            }),
            h('span', null, t('Check the inbox in the background')),
          ),
          h('div', { className: 'dsh-mail-grid' },
            h(Select, {
              label: t('Check interval'), value: String(form.watcherInterval),
              onChange: value => set('watcherInterval', Number(value)),
              options: [['30', t('Every 30 seconds')], ['60', t('Every minute')], ['120', t('Every 2 minutes')], ['300', t('Every 5 minutes')]],
            }),
          ),
          h('p', { className: 'dsh-mail-help' },
            t('While DSH is running, new unseen mail wakes the session that last used the Mail tools. Replies to trusted domains are sent automatically; drafts to other recipients wait in Review. Enabling the watcher records the current mailbox position, so only later mail is processed.')),
          h('div', { className: 'dsh-mail-watchstate' },
            h('span', null, status.watcher?.lastCheckAt
              ? fill(t('Last check: {time}'), { time: formatDate(status.watcher.lastCheckAt) })
              : t('No check has run yet.')),
            h('span', null, status.watcher?.targetActive
              ? t('Watcher session is active.')
              : t('No active watcher session yet; use any Mail tool in a chat once.')),
            status.watcher?.lastError
              ? h('span', { className: 'is-error' }, fill(t('Last error: {error}'), { error: status.watcher.lastError }))
              : null,
          ),
          h('div', { className: 'dsh-mail-actions' },
            h('button', {
              type: 'button', className: 'dsh-mail-button', disabled: locked, onClick: checkNow,
            }, localBusy ? t('Checking…') : t('Check now')),
            checkResult !== '' ? h('span', { className: 'dsh-mail-help' }, checkResult) : null,
          ),
        ),
        h('div', { className: 'dsh-mail-actions' },
          h('button', { type: 'submit', className: 'dsh-mail-button is-primary', disabled: locked }, busy ? t('Saving…') : t('Save settings')),
          h('button', { type: 'button', className: 'dsh-mail-button', disabled: locked, onClick: test }, localBusy ? t('Testing…') : t('Test connection')),
        ),
        testResult
          ? h('div', { className: 'dsh-mail-test' },
            h(TestLine, { label: 'IMAP', result: testResult.imap, t }),
            h(TestLine, { label: 'SMTP', result: testResult.smtp, t }),
          )
          : null,
      )
    }

    function TestLine({ label, result, t }) {
      return h('div', { className: result?.ok ? 'dsh-mail-test-row is-ok' : 'dsh-mail-test-row is-error' },
        h('strong', null, label),
        h('span', null, result?.ok
          ? (result.value?.messages !== undefined
            ? fill(t('Connected; {count} message(s) in the inbox.'), { count: result.value.messages })
            : t('Connected and authenticated.'))
          : (result?.error ?? t('Unknown failure'))),
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
.dsh-mail-pill.is-exact,.dsh-mail-pill.is-domain{display:inline-flex;align-items:center;gap:5px;padding:0 8px 0 7px;font-weight:600;letter-spacing:.02em;text-transform:capitalize;border:1px solid transparent}
.dsh-mail-pill.is-exact::before,.dsh-mail-pill.is-domain::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor;box-shadow:0 0 0 2px color-mix(in srgb,currentColor 18%,transparent);flex:none}
.dsh-mail-pill.is-exact{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 32%,transparent)}
.dsh-mail-pill.is-domain{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 32%,transparent)}
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
.dsh-mail-contacts{display:flex;gap:24px;align-items:flex-start}
.dsh-mail-contact-list{width:clamp(260px,30vw,380px);flex:none}
.dsh-mail-contact-tools{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.dsh-mail-contact-tools .dsh-mail-input{flex:1;min-width:0}
.dsh-mail-contact-editor{flex:1;min-width:0}
.dsh-mail-contact-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.dsh-mail-contact-head h2{margin:0;font-size:16px;font-weight:500}
.dsh-mail-contact-form{display:flex;flex-direction:column;gap:12px;max-width:760px}
@media (max-width:900px){.dsh-mail-contacts{flex-direction:column}.dsh-mail-contact-list{width:100%}}
.dsh-mail-review{margin-top:14px;min-width:0}
.dsh-mail-review .dsh-mail-editor{min-height:420px}
.dsh-mail-pane{display:flex;flex-direction:column;min-width:0;gap:6px}
.dsh-mail-pane-title{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-secondary)}
.dsh-mail-pane-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.dsh-mail-editor-hint{font-size:11px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-toolbar{display:flex;flex-wrap:wrap;gap:3px;padding:6px;border:1px solid var(--dsw-alias-border-l1);border-bottom:0;border-radius:10px 10px 0 0;background:var(--dsw-alias-bg-layer-1)}
.dsh-mail-tool{appearance:none;min-width:28px;height:26px;padding:0 6px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:600 12px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.dsh-mail-tool:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}
.dsh-mail-tool:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dsh-mail-tool:disabled{opacity:.45;cursor:default}
.dsh-mail-editor{min-height:300px;overflow:auto;padding:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:0 0 10px 10px;background:#fff;color:#1f2328;font:14px/1.55 -apple-system,Segoe UI,sans-serif;outline:none}
.dsh-mail-editor:focus{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary)}
.dsh-mail-editor:empty::before{content:attr(data-placeholder);color:#8a8f98;pointer-events:none}
.dsh-mail-editor p{margin:0 0 10px}
.dsh-mail-editor h1,.dsh-mail-editor h2,.dsh-mail-editor h3{margin:0 0 8px;line-height:1.3}
.dsh-mail-editor h1{font-size:22px}.dsh-mail-editor h2{font-size:18px}.dsh-mail-editor h3{font-size:16px}
.dsh-mail-editor ul,.dsh-mail-editor ol{margin:0 0 10px;padding-left:22px}
.dsh-mail-editor blockquote{margin:0 0 10px;padding-left:12px;border-left:3px solid #d0d5dd;color:#4a5058}
.dsh-mail-editor a{color:#0b57d0}
.dsh-mail-editor img{max-width:100%}
.dsh-mail-editor table{border-collapse:collapse;max-width:100%}
.dsh-mail-editor td,.dsh-mail-editor th{border:1px solid #d0d5dd;padding:4px 6px}
.dsh-mail-editor-help{margin:6px 0 0;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-revision{margin-top:14px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.dsh-mail-revision-row{display:flex;gap:8px;margin-top:6px}
.dsh-mail-revision-row .dsh-mail-input{flex:1;min-width:0}
.dsh-mail-revision-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.dsh-mail-chip{appearance:none;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer}
.dsh-mail-chip:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.dsh-mail-chip:disabled{opacity:.5;cursor:default}
.dsh-mail-revision-error{margin:8px 0 0;color:var(--dsw-alias-state-error-primary);font-size:12px}
.dsh-mail-advanced{margin-top:8px}
.dsh-mail-advanced summary{cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mail-advanced summary:hover{color:var(--dsw-alias-label-primary)}
.dsh-mail-advanced .dsh-mail-textarea{margin-top:8px;min-height:180px}
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
.dsh-mail-detail-error{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
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
      inject: ['locale', 'slots'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(LOCALE_NS, 'en', EN), 'dsh-mail: English dictionary')
        ctx.effect(() => ctx.locale.register(LOCALE_NS, 'zh', ZH), 'dsh-mail: Chinese dictionary')
        const t = ctx.locale.bind(LOCALE_NS)
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
            throw new Error(result?.error?.message ?? t('Mail request failed'))
          }
          return result.value
        }

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'mail',
          locale: LOCALE_NS,
          inject: () => ({ call }),
        }, MailPanel))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'mail',
          order: 20,
          locale: LOCALE_NS,
          label: () => t('Mail'),
          inject: () => ({ call }),
        }, MailIcon))
      },
    }
  },
})

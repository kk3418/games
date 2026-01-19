type ModalActionFn = () => void | Promise<void>

type AppModalOptions = {
  id?: string
  title: string
  body: HTMLElement
  closeable?: boolean
  primaryText?: string
  secondaryText?: string
  onPrimary?: ModalActionFn
  onSecondary?: ModalActionFn
}

function ensureAppDialog(id: string): HTMLDialogElement {
  const existing = document.getElementById(id)
  if (existing instanceof HTMLDialogElement) return existing

  const dialog = document.createElement('dialog')
  dialog.id = id
  dialog.className = 'app-modal'

  const container = document.createElement('div')
  container.className = 'app-modal-container'

  const titleEl = document.createElement('h2')
  titleEl.className = 'app-modal-title'
  titleEl.dataset.role = 'title'

  const bodyEl = document.createElement('div')
  bodyEl.className = 'app-modal-body'
  bodyEl.dataset.role = 'body'

  const actionsEl = document.createElement('div')
  actionsEl.className = 'app-modal-actions'
  actionsEl.dataset.role = 'actions'

  const secondaryBtn = document.createElement('button')
  secondaryBtn.type = 'button'
  secondaryBtn.className = 'app-modal-btn app-modal-btn-secondary'
  secondaryBtn.dataset.role = 'secondary'

  const primaryBtn = document.createElement('button')
  primaryBtn.type = 'button'
  primaryBtn.className = 'app-modal-btn app-modal-btn-primary'
  primaryBtn.dataset.role = 'primary'

  actionsEl.appendChild(secondaryBtn)
  actionsEl.appendChild(primaryBtn)

  container.appendChild(titleEl)
  container.appendChild(bodyEl)
  container.appendChild(actionsEl)

  dialog.appendChild(container)
  document.body.appendChild(dialog)

  return dialog
}

export function showAppModal(options: AppModalOptions): HTMLDialogElement {
  const dialog = ensureAppDialog(options.id ?? 'app-modal')

  const titleEl = dialog.querySelector('[data-role="title"]')
  const bodyEl = dialog.querySelector('[data-role="body"]')
  const actionsEl = dialog.querySelector('[data-role="actions"]')
  const primaryBtn = dialog.querySelector('[data-role="primary"]')
  const secondaryBtn = dialog.querySelector('[data-role="secondary"]')

  if (!(titleEl instanceof HTMLElement)) return dialog
  if (!(bodyEl instanceof HTMLElement)) return dialog
  if (!(actionsEl instanceof HTMLElement)) return dialog
  if (!(primaryBtn instanceof HTMLButtonElement)) return dialog
  if (!(secondaryBtn instanceof HTMLButtonElement)) return dialog

  titleEl.textContent = options.title
  bodyEl.replaceChildren(options.body)

  const closeable = options.closeable !== false
  dialog.dataset.closeable = closeable ? 'true' : 'false'

  const isCloseable = () => dialog.dataset.closeable !== 'false'

  dialog.oncancel = (e: Event) => {
    if (!isCloseable()) e.preventDefault()
  }

  dialog.onclick = (e: MouseEvent) => {
    if (isCloseable()) return
    if (e.target === dialog) {
      e.preventDefault()
    }
  }

  dialog.onclose = () => {
    if (!isCloseable()) {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal()
      } else {
        dialog.open = true
      }
    }
  }

  const hasPrimary = typeof options.primaryText === 'string' && options.primaryText.length > 0
  const hasSecondary = typeof options.secondaryText === 'string' && options.secondaryText.length > 0

  actionsEl.hidden = !(hasPrimary || (hasSecondary && closeable))

  if (hasPrimary) {
    primaryBtn.textContent = options.primaryText!
    primaryBtn.hidden = false
    primaryBtn.onclick = async () => {
      if (options.onPrimary) await options.onPrimary()
    }
  } else {
    primaryBtn.hidden = true
    primaryBtn.onclick = null
  }

  if (closeable && hasSecondary) {
    secondaryBtn.textContent = options.secondaryText!
    secondaryBtn.hidden = false
    secondaryBtn.onclick = async () => {
      try {
        if (options.onSecondary) await options.onSecondary()
      } finally {
        dialog.close()
      }
    }
  } else {
    secondaryBtn.hidden = true
    secondaryBtn.onclick = null
  }

  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal()
  } else {
    dialog.open = true
  }

  return dialog
}

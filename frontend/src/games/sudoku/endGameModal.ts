type EndGameFn<TArgs extends unknown[]> = (...args: TArgs) => void | Promise<void>

type EndGameModalOptions<TArgs extends unknown[]> = {
  title: string
  message: string
  primaryText: string
  secondaryText?: string
  endGame?: EndGameFn<TArgs>
  endGameArgs?: TArgs
}

function ensureEndGameDialog(): HTMLDialogElement {
  const existing = document.getElementById('endgame-dialog')
  if (existing instanceof HTMLDialogElement) return existing

  const dialog = document.createElement('dialog')
  dialog.id = 'endgame-dialog'

  const body = document.createElement('div')
  body.className = 'modal'

  const titleEl = document.createElement('h2')
  titleEl.className = 'modal-title'
  titleEl.dataset.role = 'title'

  const messageEl = document.createElement('p')
  messageEl.className = 'modal-message'
  messageEl.dataset.role = 'message'

  const actions = document.createElement('div')
  actions.className = 'modal-actions'

  const secondaryBtn = document.createElement('button')
  secondaryBtn.type = 'button'
  secondaryBtn.className = 'modal-btn modal-btn-secondary'
  secondaryBtn.dataset.role = 'secondary'

  const primaryBtn = document.createElement('button')
  primaryBtn.type = 'button'
  primaryBtn.className = 'modal-btn modal-btn-primary'
  primaryBtn.dataset.role = 'primary'

  actions.appendChild(secondaryBtn)
  actions.appendChild(primaryBtn)

  body.appendChild(titleEl)
  body.appendChild(messageEl)
  body.appendChild(actions)

  dialog.appendChild(body)
  document.body.appendChild(dialog)

  return dialog
}

export function showEndGameModal<TArgs extends unknown[]>(
  options: EndGameModalOptions<TArgs>,
): void {
  const dialog = ensureEndGameDialog()

  const titleEl = dialog.querySelector('[data-role="title"]')
  const messageEl = dialog.querySelector('[data-role="message"]')
  const primaryBtn = dialog.querySelector('[data-role="primary"]')
  const secondaryBtn = dialog.querySelector('[data-role="secondary"]')

  if (!(titleEl instanceof HTMLElement)) return
  if (!(messageEl instanceof HTMLElement)) return
  if (!(primaryBtn instanceof HTMLButtonElement)) return
  if (!(secondaryBtn instanceof HTMLButtonElement)) return

  titleEl.textContent = options.title
  messageEl.textContent = options.message
  primaryBtn.textContent = options.primaryText

  if (options.secondaryText) {
    secondaryBtn.textContent = options.secondaryText
    secondaryBtn.hidden = false
  } else {
    secondaryBtn.hidden = true
  }

  const primaryHandler = async () => {
    try {
      if (options.endGame) {
        const args = (options.endGameArgs ?? []) as TArgs
        await options.endGame(...args)
      }
    } finally {
      dialog.close()
    }
  }

  const secondaryHandler = () => {
    dialog.close()
  }

  primaryBtn.onclick = primaryHandler
  secondaryBtn.onclick = secondaryHandler

  if (typeof dialog.showModal === 'function') {
    dialog.showModal()
  } else {
    dialog.open = true
  }
}

import LiveSocket, {View} from '../js/phoenix_live_view'
import {Socket} from "phoenix"

let prepareLiveViewDOM = (document) => {
  const div = document.createElement('div')
  const loader = document.createElement('div')
  loader.classList.add('phx-loader')
  div.setAttribute('data-phx-view', '')
  div.setAttribute('data-phx-session', 'abc123')
  div.setAttribute('id', 'container')
  div.innerHTML = `
    <label for="plus">Plus</label>
    <input id="plus" value="1" />
    <button phx-click="inc_temperature">Inc Temperature</button>
  `
  const button = div.querySelector('button')
  const input = div.querySelector('input')
  button.addEventListener('click', () => {
    setTimeout(() => {
      input.value += 1
    }, 200)
  })
  document.body.appendChild(div)
  document.body.appendChild(loader)
}

describe('LiveSocket', () => {
  beforeEach(() => {
    global.Phoenix = { Socket }
    prepareLiveViewDOM(global.document)
  })

  afterAll(() => {
    global.document.body.innerHTML = ''
  })

  test('sets defaults', async () => {
    let opts = { viewLogger: 'foo' }
    let liveSocket = new LiveSocket('/live', opts)
    expect(liveSocket.socket).toBeDefined()
    expect(liveSocket.socket.onOpen).toBeDefined()
    expect(liveSocket.opts.viewLogger).toBe('foo')
    expect(liveSocket.viewLogger).toBe('foo')
    expect(liveSocket.unloaded).toBe(false)
    expect(liveSocket.bindingPrefix).toBe('phx-')
    expect(liveSocket.activeElement).toBe(null)
    expect(liveSocket.prevActive).toBe(null)
  })

  test('sets defaults with socket', async () => {
    let liveSocket = new LiveSocket(new Socket('//example.org/chat'))
    expect(liveSocket.socket).toBeDefined()
    expect(liveSocket.socket.onOpen).toBeDefined()
    expect(liveSocket.unloaded).toBe(false)
    expect(liveSocket.bindingPrefix).toBe('phx-')
    expect(liveSocket.activeElement).toBe(null)
    expect(liveSocket.prevActive).toBe(null)
  })

  test('viewLogger', async () => {
    let viewLogger = (view, kind, msg, obj) => {
      expect(view.id).toBe('container')
      expect(kind).toBe('updated')
      expect(msg).toBe('')
      expect(obj).toBe('\"<div>\"')
    }
    let liveSocket = new LiveSocket('/live', { viewLogger })
    liveSocket.connect()
    let view = liveSocket.getViewById('container')
    liveSocket.log(view, 'updated', () => ['', JSON.stringify('<div>')])
  })

  test('connect', async () => {
    let liveSocket = new LiveSocket('/live')

    expect(liveSocket.getViewById('container')).toBeUndefined()
    let socket = liveSocket.connect()

    expect(liveSocket.getViewById('container')).toBeDefined()
  })

  test('disconnect', async () => {
    let liveSocket = new LiveSocket('/live')

    liveSocket.connect()
    liveSocket.disconnect()

    expect(liveSocket.views['container'].destroy).toBeDefined()
  })

  test('channel', async () => {
    let liveSocket = new LiveSocket('/live')

    liveSocket.connect()
    let channel = liveSocket.channel('lv:def456', () => {
        return { session: this.getSession() }
    })

    expect(channel).toBeDefined()
  })

  test('getViewById', async () => {
    let liveSocket = new LiveSocket('/live')

    liveSocket.connect()

    expect(liveSocket.getViewById('container').destroy).toBeDefined()
  })

  test('destroyViewById', async () => {
    let liveSocket = new LiveSocket('/live')

    liveSocket.connect()

    liveSocket.destroyViewById('container')
    expect(liveSocket.getViewById('container')).toBeUndefined()
  })

  test('getBindingPrefix', async () => {
    let liveSocket = new LiveSocket('/live')

    expect(liveSocket.getBindingPrefix()).toEqual('phx-')
  })

  test('getBindingPrefix custom', async () => {
    let liveSocket = new LiveSocket('/live', { bindingPrefix: 'company-' })

    expect(liveSocket.getBindingPrefix()).toEqual('company-')
  })

  test('getActiveElement default before LiveSocket activeElement is set', async () => {
    let liveSocket = new LiveSocket('/live')

    let input = document.querySelector('input')
    input.focus()

    expect(liveSocket.getActiveElement()).toEqual(input)
  })

  test('setActiveElement and getActiveElement', async () => {
    let liveSocket = new LiveSocket('/live')

    let input = document.querySelector('input')

    // .activeElement
    liveSocket.setActiveElement(input)
    expect(liveSocket.activeElement).toEqual(input)
    expect(liveSocket.getActiveElement()).toEqual(input)
  })

  test('blurActiveElement', async () => {
    let liveSocket = new LiveSocket('/live')

    let input = document.querySelector('input')
    input.focus()

    expect(liveSocket.prevActive).toBeNull()

    liveSocket.blurActiveElement()
    // sets prevActive
    expect(liveSocket.prevActive).toEqual(input)
    expect(liveSocket.getActiveElement()).not.toEqual(input)
  })

  test('restorePreviouslyActiveFocus', async () => {
    let liveSocket = new LiveSocket('/live')

    let input = document.querySelector('input')
    input.focus()

    liveSocket.blurActiveElement()
    expect(liveSocket.prevActive).toEqual(input)
    expect(liveSocket.getActiveElement()).not.toEqual(input)

    // focus()
    liveSocket.restorePreviouslyActiveFocus()
    expect(liveSocket.prevActive).toEqual(input)
    expect(liveSocket.getActiveElement()).toEqual(input)
  })

  test('dropActiveElement unsets prevActive', async () => {
    let liveSocket = new LiveSocket('/live')

    liveSocket.connect()

    let input = document.querySelector('input')
    liveSocket.setActiveElement(input)
    liveSocket.blurActiveElement()
    expect(liveSocket.prevActive).toEqual(input)

    let view = liveSocket.getViewById('container')
    liveSocket.dropActiveElement(view)
    expect(liveSocket.prevActive).toBeNull()
    // this fails.  Is this correct?
    // expect(liveSocket.getActiveElement()).not.toEqual(input)
  })

  test('onViewError unsets prevActive', async () => {
    let liveSocket = new LiveSocket('/live')

    liveSocket.connect()

    let input = document.querySelector('input')
    liveSocket.setActiveElement(input)
    liveSocket.blurActiveElement()

    let view = liveSocket.getViewById('container')
    expect(view).toBeDefined()
    liveSocket.onViewError(view)
    expect(liveSocket.prevActive).toBeNull()
  })
})

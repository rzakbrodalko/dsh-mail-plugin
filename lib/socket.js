/** Buffered line/byte socket used by the IMAP and SMTP clients. */

import net from 'node:net'
import tls from 'node:tls'

const DEFAULT_TIMEOUT = 30_000

/** One TCP or TLS connection with buffered line and length reads. */
export class LineSocket {
  /**
   * @param {import('node:net').Socket|import('node:tls').TLSSocket} socket - connected socket.
   * @param {AbortSignal|undefined} signal - caller cancellation.
   */
  constructor(socket, signal) {
    this.socket = socket
    this.signal = signal
    this.buffer = Buffer.alloc(0)
    this.waiters = []
    this.closed = undefined
    this.timeoutMs = DEFAULT_TIMEOUT
    this.onData = chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk])
      this.pump()
    }
    this.onError = error => {
      this.fail(error)
    }
    this.onClose = () => {
      this.fail(new Error('Connection closed by the server'))
    }
    this.onAbort = () => {
      this.fail(new Error('Operation aborted'))
      this.socket.destroy()
    }
    socket.on('data', this.onData)
    socket.on('error', this.onError)
    socket.on('close', this.onClose)
    if (signal !== undefined) {
      if (signal.aborted) this.onAbort()
      else signal.addEventListener('abort', this.onAbort, { once: true })
    }
  }

  /**
   * Open a TCP or implicit-TLS connection.
   * @param {{host:string, port:number, tls:boolean, servername?:string, timeoutMs?:number, signal?:AbortSignal}} options connection options.
   * @returns {Promise<LineSocket>} connected wrapper.
   */
  static async connect(options) {
    const secure = options.tls === true
    const socket = secure
      ? tls.connect({
        host: options.host,
        port: options.port,
        servername: options.servername ?? options.host,
        rejectUnauthorized: true,
      })
      : net.connect({ host: options.host, port: options.port })
    const signal = options.signal
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup()
        socket.destroy()
        reject(new Error(`Connection to ${options.host}:${options.port} timed out`))
      }, options.timeoutMs ?? DEFAULT_TIMEOUT)
      const onReady = () => {
        cleanup()
        resolve()
      }
      const onError = error => {
        cleanup()
        reject(error)
      }
      const onAbort = () => {
        cleanup()
        socket.destroy()
        reject(new Error('Operation aborted'))
      }
      const cleanup = () => {
        clearTimeout(timeout)
        socket.off(secure ? 'secureConnect' : 'connect', onReady)
        socket.off('error', onError)
        signal?.removeEventListener('abort', onAbort)
      }
      socket.once(secure ? 'secureConnect' : 'connect', onReady)
      socket.once('error', onError)
      if (signal !== undefined) {
        if (signal.aborted) onAbort()
        else signal.addEventListener('abort', onAbort, { once: true })
      }
    })
    const wrapper = new LineSocket(socket, signal)
    wrapper.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT
    return wrapper
  }

  /** Reject every pending read and mark the connection closed. */
  fail(error) {
    if (this.closed !== undefined) return
    this.closed = error instanceof Error ? error : new Error(String(error))
    for (const waiter of this.waiters.splice(0)) waiter.reject(this.closed)
  }

  /** Resolve waiters whose target amount of data is available. */
  pump() {
    for (let i = 0; i < this.waiters.length; i += 1) {
      const waiter = this.waiters[i]
      if (waiter.predicate(this.buffer)) {
        this.waiters.splice(i, 1)
        i -= 1
        waiter.resolve()
      }
    }
  }

  /** Wait until a predicate sees the buffered bytes. */
  async waitFor(predicate) {
    if (this.closed !== undefined) throw this.closed
    if (predicate(this.buffer)) return
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.waiters.indexOf(waiter)
        if (index >= 0) this.waiters.splice(index, 1)
        reject(new Error('Timed out waiting for the mail server'))
      }, this.timeoutMs)
      const waiter = {
        predicate,
        resolve: () => {
          clearTimeout(timer)
          resolve()
        },
        reject: error => {
          clearTimeout(timer)
          reject(error)
        },
      }
      this.waiters.push(waiter)
      this.pump()
    })
  }

  /** Read one CRLF- or LF-terminated line without its terminator. */
  async readLine() {
    let index = -1
    await this.waitFor(buffer => {
      index = buffer.indexOf(0x0a)
      return index >= 0
    })
    const raw = this.buffer.subarray(0, index)
    this.buffer = this.buffer.subarray(index + 1)
    return raw.toString('utf8').replace(/\r$/, '')
  }

  /** Read exactly `length` bytes. */
  async readBytes(length) {
    await this.waitFor(buffer => buffer.length >= length)
    const bytes = this.buffer.subarray(0, length)
    this.buffer = this.buffer.subarray(length)
    return bytes
  }

  /** Write all bytes, honouring backpressure. */
  async write(data) {
    if (this.closed !== undefined) throw this.closed
    await new Promise((resolve, reject) => {
      this.socket.write(data, error => {
        if (error) reject(error)
        else resolve()
      })
    })
  }

  /** Upgrade the current plain connection to TLS (STARTTLS). */
  async upgradeToTls(servername) {
    if (this.buffer.length > 0) throw new Error('Cannot upgrade to TLS with buffered data')
    this.socket.off('data', this.onData)
    this.socket.off('error', this.onError)
    this.socket.off('close', this.onClose)
    const secure = tls.connect({
      socket: this.socket,
      servername,
      rejectUnauthorized: true,
    })
    await new Promise((resolve, reject) => {
      secure.once('secureConnect', resolve)
      secure.once('error', reject)
    })
    this.socket = secure
    secure.on('data', this.onData)
    secure.on('error', this.onError)
    secure.on('close', this.onClose)
  }

  /** Close the connection. */
  close() {
    if (this.closed !== undefined) return
    this.closed = new Error('Connection closed')
    this.socket.end()
    setTimeout(() => this.socket.destroy(), 1_000).unref?.()
  }

  /** Destroy immediately. */
  destroy() {
    this.fail(new Error('Connection aborted'))
    this.socket.destroy()
  }
}

/**
 * Race an operation against caller cancellation.
 * @template T
 * @param {Promise<T>} promise operation.
 * @param {AbortSignal|undefined} signal cancellation.
 * @returns {Promise<T>} the operation result.
 */
export function withAbort(promise, signal) {
  if (signal === undefined) return promise
  if (signal.aborted) return Promise.reject(new Error('Operation aborted'))
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new Error('Operation aborted'))
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      value => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      error => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

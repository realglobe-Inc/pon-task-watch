'use strict'

const { TheLock } = require('@the-/lock')
const path = require('path')

/**
 * Define task
 * @function define
 * @param {string|string[]} filenames - Filenames or glob pattern to watch
 * @param {function} handler - Change handler function
 * @param {Object} [options={}] - Optional settings
 * @param {number} [options.delay=100] - Delay to trigger watch
 * @param {string} [options.events=["change"]] - Target events
 * @returns {function} Defined task
 */
function define (filenames, handler, options = {}) {
  const lock = new TheLock()
  const {
    delay = 0,
    events = ['change']
  } = options

  async function task (ctx) {
    const { logger, watcher, cwd } = ctx
    const timers = []
    let watching = true
    const unwatch = await watcher.watch(filenames, (event, filename) => {
      let hit = !!~[].concat(events).indexOf(event)
      if (!hit) {
        return
      }
      clearTimeout(timers[event])
      timers[event] = setTimeout(() => {
        lock.acquire(`handle/${filename}`, async () => {
          logger.trace(`File changed:`, path.relative(cwd, filename))
          try {
            await Promise.resolve(handler(event, filename))
          } catch (err) {
            logger.error(err)
          }
        })
      }, delay)
    }, { cwd })

    function close () {
      watching = false
      unwatch()
    }

    process.setMaxListeners(process.getMaxListeners() + 1)
    process.on('beforeExit', () => close())
    // Keep Process
    void new Promise(_ => null)

    return close
  }

  return Object.assign(task,
    // Define sub tasks here
    {}
  )
}

module.exports = define



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
'use strict'

const asleep = require('asleep')
const path = require('path')

/** @lends define */
function define (filenames, handler, options = {}) {
  const {
    delay = 100,
    events = ['change']
  } = options

  async function task (ctx) {
    const {logger, watcher, cwd} = ctx
    const timers = []
    let watching = true
    let handling = false
    const unwatch = await watcher.watch(filenames, (event, filename) => {
      if (handling) {
        return
      }
      let hit = !!~[].concat(events).indexOf(event)
      if (!hit) {
        return
      }
      clearTimeout(timers[event])
      timers[event] = setTimeout(() => {
        if (handling === filename) {
          return
        }
        logger.trace(`File changed:`, path.relative(cwd, filename))
        const cacheKeys = Object.keys(require.cache).filter((cacheKey) => cacheKey.match(filename))
        for (let cacheKey of cacheKeys) {
          delete require.cache[cacheKey]
          logger.trace(`Require cache deleted:`, path.relative(cwd, filename))
        }

        handling = filename
        Promise.resolve(handler(event, filename))
          .catch((err) => logger.error(err))
          .then(() => {
            handling = false
          })
      }, delay)
    }, {cwd})

    function close () {
      watching = false
      unwatch()
    }

    process.setMaxListeners(process.getMaxListeners() + 1)
    process.on('beforeExit', () => close())
    await asleep(0)
    ;(async () => {
      while (watching) {
        await asleep(10)
      }
    })()

    return close
  }

  return Object.assign(task,
    // Define sub tasks here
    {}
  )
}

module.exports = define



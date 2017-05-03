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

const co = require('co')
const asleep = require('asleep')
const path = require('path')

/** @lends define */
function define (filenames, handler, options = {}) {
  let {
    delay = 100,
    events = [ 'change' ]
  } = options

  function task (ctx) {
    return co(function * () {
      let { logger, watcher, cwd } = ctx
      let timers = []
      let watching = true
      let handling = false
      let close = yield watcher.watch(filenames, (event, filename) => {
        if (handling) {
          return
        }
        let hit = !!~[].concat(events).indexOf(event)
        if (!hit) {
          return
        }
        clearTimeout(timers[ event ])
        timers[ event ] = setTimeout(() => {
          logger.trace(`File changed:`, path.relative(cwd, filename))
          handling = true
          Promise.resolve(handler(event, filename))
            .catch((err) => logger.error(err))
            .then(() => {
              handling = false
            })
        }, delay)
      }, { cwd })

      process.setMaxListeners(process.getMaxListeners() + 1)
      process.on('beforeExit', () => {
        watching = false
        close()
      })
      while (watching) {
        yield asleep(10)
      }
    })
  }

  return Object.assign(task,
    // Define sub tasks here
    {}
  )
}

module.exports = define



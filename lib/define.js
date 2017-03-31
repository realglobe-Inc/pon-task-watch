/**
 * Define task
 * @function define
 * @param {string|string[]} filenames - Filenames or glob pattern to watch
 * @param {function} handler - Change handler function
 * @param {Object} [options={}] - Optional settings
 * @param {number} [options.delay=100] - Delay to trigger watch
 * @returns {function} Defined task
 */
'use strict'

const co = require('co')
const asleep = require('asleep')
const path = require('path')
const minimatch = require('minimatch')

/** @lends define */
function define (filenames, handler, options = {}) {
  let {
    delay = 100
  } = options

  function task (ctx) {
    return co(function * () {
      let { logger, watcher, cwd } = ctx
      let timers = []
      let watching = true
      let close = yield watcher.watch(filenames, (event, filename) => {
        let gone = !minimatch(filename, filenames, { cwd })
        if (gone) {
          return
        }
        logger.trace(`File changed:`, path.relative(cwd, filename))
        clearTimeout(timers[ event ])
        let handle = Promise.resolve(handler(event, filename))
          .catch((err) => logger.error(err))
        timers[ event ] = setTimeout(() => handle, delay)
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



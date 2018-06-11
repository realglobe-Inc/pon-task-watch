/**
 * Pon task to watch files
 * @module pon-task-watch
 * @version 2.1.1
 */

'use strict'

const define = require('./define')

let lib = define.bind(this)

Object.assign(lib, define, {
  define
})

module.exports = lib

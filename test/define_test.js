/**
 * Test case for define.
 * Runs with mocha.
 */
'use strict'

const define = require('../lib/define.js')
const ponContext = require('pon-context')
const {equal} = require('assert')
const path = require('path')
const mkdirp = require('mkdirp')
const asleep = require('asleep')
const writeout = require('writeout')

describe('define', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Define', async () => {
    let ctx = ponContext()
    let srcDir = `${__dirname}/../tmp/testing-watching/src`
    let destDir = `${__dirname}/../tmp/testing-watching/dest`
    await mkdirp(path.dirname(srcDir))
    await mkdirp(path.dirname(destDir))
    await asleep(10)
    let src = srcDir + '/foo.pcss'
    require.cache[path.resolve(srcDir, src)] = {m: 'This is mock cache'}
    await writeout(src, ':root { --red: #d33; } a { &:hover { color: color(var(--red) a(54%)); } }', {mkdirp: true})
    await asleep(100)
    let received = []
    const task = define(srcDir + '/*.*', (event, filename) => {
      writeout(destDir + '/' + filename, 'hogehoge', {mkdirp: true})
      received.push([event, filename])
    }, {delay: 1})
    const close = await task(ctx)
    await writeout(src, ':root { --red: #dd1; } a { &:hover { color: color(var(--red) a(54%)); } }', {mkdirp: true})
    await asleep(200)
    await writeout(src, ':root { --red: #5FF; } a { &:hover { color: color(var(--red) a(54%)); } }', {mkdirp: true})
    await asleep(200)

    close()

    equal(received.length, 2)
  })
})

/* global describe, before, after, it */

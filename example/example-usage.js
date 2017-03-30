'use strict'

const pon = require('pon')
const watch = require('pon-task-watch')

async function tryExample () {
  let run = pon({
    myWatch: watch('src/**/*.txt', (event, filename) => {
      console.log('File changed', filename)
    })
  })

  run('myWatch')
}

tryExample()

#!/usr/bin/env node

const gooey = require("./index")

require('yargs')
  .command('clone [distro]', 'clone all modules of the given distribution', (yargs) => {
    yargs.positional('distro', {
      describe: 'distribution to clone',
      default: 'iota'
    })
  }, (argv) => {
    gooey.cloneDistro(argv.distro)
  })
  .help()
  .argv
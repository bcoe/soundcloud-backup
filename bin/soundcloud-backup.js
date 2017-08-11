#!/usr/bin/env node

const SoundCloudBackup = require('../')

require('yargs') // eslint-disable-line
  .command(['backup', '*'], 'backup your SoundCloud meta-information', () => {}, (argv) => {
    SoundCloudBackup(argv)
  })
  .option('client-id', {
    describe: 'client_id for performing API calls, fetch this from inspecting XHR requests in browser',
    demand: true
  })
  .option('user', {
    default: 'benjamin-e-coe',
    describe: 'SoundCloud account to fetch data for'
  })
  .option('output', {
    default: './soundcloud-backup',
    describe: 'folder to output JSON data to'
  })
  .help()
  .argv

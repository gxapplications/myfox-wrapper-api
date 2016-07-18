'use strict'

import config from 'config'
import 'colors'

import ApplicationHapi from './application-hapi'

// Application (Hapi server)
var server = new ApplicationHapi(config.get('myfox-wrapper-api.server.hapi.options'))

// Server start
server.start((err) => {
  if (err) {
    console.log('ERROR: Hapi server cannot start.'.red)
    console.log(err)
    process.exit(1)
  }
  console.log('WARNING: The hapi server version here is in construction.'.red)
  console.log('✔ Server ready.'.green)
  console.log('✔ Server listening on '.green, String(server.info.uri).cyan)
})


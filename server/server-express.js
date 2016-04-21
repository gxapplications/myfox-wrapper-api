'use strict'

import { createServer } from 'http'
import 'colors'

import application from './application-express'

const server = createServer(application)
server.listen(application.get('port'), () => {
  console.log('✔ Server listening on port'.green, String(application.get('port')).cyan)
})

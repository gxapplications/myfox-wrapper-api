'use strict'

import { createServer } from 'http'
import 'colors'

import application from './application-express'

const server = createServer(application)
server.listen(application.get('port'), () => {
  console.log('WARNING: The express server version here is for example purposes only.'.red)
  console.log('The API it provides is not protected against malformed/malicious requests.'.yellow)
  console.log('To have a Swagger interface, please use the hapi server version (see /server.js).'.green)
  console.log('✔ Server listening on port'.green, String(application.get('port')).cyan)
})

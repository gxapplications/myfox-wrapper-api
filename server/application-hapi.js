'use strict'

import config from 'config'
import Hapi from 'hapi'

class ApplicationHapi extends Hapi.Server {
  constructor (options) {
    super(options)

    let connection = config.get('myfox-wrapper-api.server.hapi.main-connection')
    if (process.env.PORT) {
      connection.port = process.env.PORT
    }
    this.connection(connection)

    this.route([
      // TODO: inscription des routes...
    ])
  }
}

export default ApplicationHapi


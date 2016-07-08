'use strict'

import config from 'config'
import { join as joinPaths } from 'path'
import Hapi from 'hapi'
import Hoek from 'hoek'

class ApplicationHapi extends Hapi.Server {
  constructor (options) {
    super(options)

    let connection = config.get('myfox-wrapper-api.server.hapi.main-connection')
    if (process.env.PORT) {
      connection.port = process.env.PORT
    }
    this.connection(connection)

    // Assets path
    this.register(require('inert'), (err) => {
      Hoek.assert(!err, err)
    })
    this.route({
      method: 'GET',
      path: '/assets/{param*}',
      handler: {
        directory: {
          path: joinPaths(__dirname, 'assets'),
          listing: false
        }
      }
    })

    // TODO: equivalents de bodyParser et methodOverride d'express ?
    // TODO: logger https://github.com/hapijs/good

    this.route([
      // TODO: inscription des routes et middlewares (pre, post, ...)... avec options: {"routes": {"prefix": "/v1"}}

    ])
  }
}

export default ApplicationHapi


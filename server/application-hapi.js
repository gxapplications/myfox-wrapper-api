'use strict'

import config from 'config'
import { join as joinPaths } from 'path'
import Hapi from 'hapi'
import Hoek from 'hoek'
import Blipp from 'blipp'

import hapiControllerV1 from './controller-hapi-v1'

class ApplicationHapi extends Hapi.Server {
  constructor (options) {
    super(options)

    let connection = config.get('myfox-wrapper-api.server.hapi.main-connection')
    if (process.env.PORT) {
      connection.port = process.env.PORT
    }
    this.connection(connection)

    // Logger
    const loggerOptions = {
      ops: {
        interval: 1000
      },
      reporters: {
        console: [{
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{ log: '*', response: '*' }]
        }, {
          module: 'good-console'
        }, 'stdout']
      }
    }
    this.register({
      register: require('good'),
      loggerOptions
    }, (err) => {
      Hoek.assert(!err, err)
    })

    // Controller and routes
    this.register({register: hapiControllerV1}, {routes: {prefix: '/v1'}}, (err) => {
      Hoek.assert(!err, err)
    })

    // Assets path
    this.register(require('inert'), (err) => {
      Hoek.assert(!err, err)
    })
    this.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: joinPaths(__dirname, 'assets'),
          listing: false
        }
      }
    })

    // Blipp, for routes dump at startup time.
    this.register({
      register: Blipp, options: {
        showStart: true
      }
    }, (err) => {
      Hoek.assert(!err, err)
    })

    // TODO !0: equivalents de bodyParser et methodOverride d'express ?
  }
}

export default ApplicationHapi


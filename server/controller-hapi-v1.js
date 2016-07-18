'use strict'

import prompter from './credentials-prompter'
import Api from '../lib/index'
import routes from './routes-v1'
import config from 'config'

exports.register = function (server, options, next) {
  // This const is instantiated once at init,
  // to keep the same instance of this object for all requests.
  // This is mandatory to share authenticated session.
  // But from this point, we must always ensure an instance will handle calls for only one Myfox account!
  const api = Api(config.get('myfox-wrapper-api.server.myfox'), prompter())

  // Routes
  for (let routeName in routes) {
    let routeParams = routes[routeName]
    let preHandlers = []

    // pre-action middleware
    if (routeParams.pre !== null && routeParams.pre !== undefined) {
      const preHandler = routeParams.pre.hapi || routeParams.pre
      preHandlers.push({method: (request, reply) => {
        return preHandler(request, reply, api, () => { reply.continue() })
      }})
    }

    if (routeParams.get !== null && routeParams.get !== undefined) {
      server.route([{
        path: routeParams.path.hapi || routeParams.path,
        method: 'get',
        config: {
          pre: preHandlers,
          handler: (request, reply) => {
            (routeParams.get.hapi || routeParams.get)(request, reply, api)
          }
        }
      }])
    }
    if (routeParams.post !== null && routeParams.post !== undefined) {
      server.route([{
        path: routeParams.path.hapi || routeParams.path,
        method: 'post',
        config: {
          pre: preHandlers,
          handler: (request, reply) => {
            (routeParams.post.hapi || routeParams.post)(request, reply, api)
          }
        }
      }])
    }
    if (routeParams.patch !== null && routeParams.patch !== undefined) {
      server.route([{
        path: routeParams.path.hapi || routeParams.path,
        method: 'patch',
        config: {
          pre: preHandlers,
          handler: (request, reply) => {
            (routeParams.patch.hapi || routeParams.patch)(request, reply, api)
          }
        }
      }])
    }
    if (routeParams.put !== null && routeParams.put !== undefined) {
      server.route([{
        path: routeParams.path.hapi || routeParams.path,
        method: 'put',
        config: {
          pre: preHandlers,
          handler: (request, reply) => {
            (routeParams.put.hapi || routeParams.put)(request, reply, api)
          }
        }
      }])
    }
    if (routeParams.delete !== null && routeParams.delete !== undefined) {
      server.route([{
        path: routeParams.path.hapi || routeParams.path,
        method: 'delete',
        config: {
          pre: preHandlers,
          handler: (request, reply) => {
            (routeParams.delete.hapi || routeParams.delete)(request, reply, api)
          }
        }
      }])
    }
  }

  // Tea pot test route. To keep for test purpose.
  server.route([{
    path: '/',
    method: 'get',
    config: {
      handler: (request, reply) => {
        reply('Hello world!').code(418)
      }
    }
  }])

  next()
}

exports.register.attributes = {
  name: 'controller-hapi-v1',
  version: '1.0.0'
}


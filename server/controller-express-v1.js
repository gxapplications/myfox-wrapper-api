'use strict'

import { Router } from 'express'
import prompter from './credentials-prompter'
import Api from '../lib/index'
import routes from './routes-v1'
import config from 'config'

// These const are instantiated once at init,
// to keep the same instance of these objects for all requests.
// This is mandatory to share authenticated session.
// But from this point, we must always ensure an instance will handle calls for only one Myfox account!
const router = new Router()
const api = Api(config.get('myfox-wrapper-api.server.myfox'), prompter())

for (var routeName in routes) {
  let routeParams = routes[routeName]
  let route = router.route(routeParams.path.express || routeParams.path)

  // pre-action middleware
  if (routeParams.pre !== null && routeParams.pre !== undefined) {
    route = route.all((req, res, next) => {
      (routeParams.pre.express || routeParams.pre)(req, res, api, next)
    })
  }

  // HTTP methods
  if (routeParams.get !== null && routeParams.get !== undefined) {
    route = route.get((req, res, next) => {
      (routeParams.get.express || routeParams.get)(req, res, api)
    })
  }
  if (routeParams.post !== null && routeParams.post !== undefined) {
    route = route.post((req, res, next) => {
      (routeParams.post.express || routeParams.post)(req, res, api)
    })
  }
  if (routeParams.patch !== null && routeParams.patch !== undefined) {
    route = route.patch((req, res, next) => {
      (routeParams.patch.express || routeParams.patch)(req, res, api)
    })
  }
  if (routeParams.put !== null && routeParams.put !== undefined) {
    route = route.put((req, res, next) => {
      (routeParams.put.express || routeParams.put)(req, res, api)
    })
  }
  if (routeParams.delete !== null && routeParams.delete !== undefined) {
    route = route.delete((req, res, next) => {
      (routeParams.delete.express || routeParams.delete)(req, res, api)
    })
  }
}

// Tea pot test route. To keep for test purpose.
router.get('/', function test (request, reply) {
  reply.status(418).send('Hello world!')
})

export default router

'use strict'

import { Router } from 'express'
import Api from '../lib/index'

// These const are instantiated once at init,
// to keep the same instance of these objects for all requests.
const router = new Router()
const api = Api()

router.get('/test/:vari', function test (request, reply, next) {
  api.callScenario('123', () => {})
  // console.log(rest().callScenario('123', () => {}))
  reply.send('test: ' + request.params.vari)
})

export default router

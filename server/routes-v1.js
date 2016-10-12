'use strict'

const routes = {
  'testLocal': {
    'path': {
      'express': '/test/:variable',
      'hapi': '/test/{variable}'
    },
    'pre': (req, res, api, next) => {
      // call next() to ensure method handler will be called.
      next()
    },
    'get': {
      'express': (req, res, api) => {
        // call next() only if not finished (go to next route matching request)
        res.send('Hello ' + req.params.variable).end()
      },
      'hapi': (req, reply, api) => {
        // call next() only if not finished (go to next route matching request)
        reply('Hello ' + req.params.variable)
      }
    }
  },
  'home': {
    'path': '/home',
    'get': {
      'express': (req, res, api) => {
        api.callHome((err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        })
      },
      'hapi': (req, reply, api) => {
        api.callHome((err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        })
      }
    }
  },
  'scenario_action': {
    'path': {
      'express': '/scenario/:id/:action/:delay?',
      'hapi': '/scenario/{id}/{action}/{delay?}'
    },
    'post': {
      'express': (req, res, api) => {
        let nextCalls = req.body ? req.body['next_calls'] : []
        api.callScenarioAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        }, undefined, ...nextCalls)
      },
      'hapi': (req, reply, api) => {
        let nextCalls = req.body ? req.body['next_calls'] : []
        api.callScenarioAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        }, undefined, ...nextCalls)
      }
    }
  },
  'domotic_action': {
    'path': {
      'express': '/domotic/:id/:action/:delay?',
      'hapi': '/domotic/{id}/{action}/{delay?}'
    },
    'post': {
      'express': (req, res, api) => {
        let nextCalls = req.body ? req.body['next_calls'] : []
        api.callDomoticAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        }, undefined, ...nextCalls)
      },
      'hapi': (req, reply, api) => {
        let nextCalls = req.body ? req.body['next_calls'] : []
        api.callDomoticAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        }, undefined, ...nextCalls)
      }
    }
  },
  'heating_action': {
    'path': {
      'express': '/heating/:id/:action/:delay?',
      'hapi': '/heating/{id}/{action}/{delay?}'
    },
    'post': {
      'express': (req, res, api) => {
        let nextCalls = req.body ? req.body['next_calls'] : []
        api.callHeatingAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        }, undefined, ...nextCalls)
      },
      'hapi': (req, reply, api) => {
        let nextCalls = req.body ? req.body['next_calls'] : []
        api.callHeatingAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        }, undefined, ...nextCalls)
      }
    }
  },
  'alarm_action': {
    'path': {
      'express': '/alarm/:action',
      'hapi': '/alarm/{action}'
    },
    'post': {
      'express': (req, res, api) => {
        api.callAlarmLevelAction({action: req.params.action, password: req.payload && req.payload.password}, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        })
      },
      'hapi': (req, reply, api) => {
        api.callAlarmLevelAction({action: req.params.action, password: req.payload && req.payload.password}, (err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        })
      }
    }
  },
  'inspect_scenario_temperature': {
    'path': {
      'express': '/scenario_edition/inspect_temperature/:id',
      'hapi': '/scenario_edition/inspect_temperature/{id}'
    },
    'get': {
      'express': (req, res, api) => {
        api.inspectScenarioTemperatureSettings(req.params.id, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        })
      },
      'hapi': (req, reply, api) => {
        api.inspectScenarioTemperatureSettings(req.params.id, (err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        })
      }
    }
  },
  'update_scenario_temperature': {
    'path': {
      'express': '/scenario_edition/update_temperatures/:id',
      'hapi': '/scenario_edition/update_temperatures/{id}'
    },
    'put': {
      'express': (req, res, api) => {
        api.updateScenarioTemperatureSettings(req.params.id, req.payload, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        })
      },
      'hapi': (req, reply, api) => {
        api.updateScenarioTemperatureSettings(req.params.id, req.payload, (err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        })
      }
    }
  }
}

export default routes

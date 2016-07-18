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
        let nextCalls = req.body['next_calls']
        api.callScenarioAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        }, ...nextCalls)
      },
      'hapi': (req, reply, api) => {
        let nextCalls = req.body['next_calls']
        api.callScenarioAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return reply(err.toString()).code(err.status)
          }
          reply(result)
        }, ...nextCalls)
      }
    }
  }
}

export default routes


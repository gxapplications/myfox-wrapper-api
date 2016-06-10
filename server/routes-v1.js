'use strict'

const routes = {
  'testLocal': {
    'path': {
      'express': '/test/:variable',
      'hapi': '/test/{variable}'
    },
    'pre': {
      'express': (req, res, api, next) => {
        // call next() to ensure method handler will be called.
        next()
      }
    },
    'get': {
      'express': (req, res, api, next) => {
        // call next() only if not finished (go to next route matching request)
        res.send('Hello ' + req.params.variable).end()
      }
    }
  },
  'home': {
    'path': {
      'express': '/home'
    },
    'get': {
      'express': (req, res, api) => {
        api.callHome((err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        })
      }
    }
  },
  'scenario_action': {
    'path': {
      'express': '/scenario/:id/:action/:delay?',
      'hapi': '/scenario/{id}/{action}/{delay?}'
    },
    'get': { // FIXME: no, post !
      'express': (req, res, api) => {
        // TODO !0:  support more actions in serial way from : [{id, action, delay}] as third param
        api.callScenarioAction({id: req.params.id, action: req.params.action, delay: req.params.delay | 0}, (err, result) => {
          if (err) {
            return res.status(err.status).send(err.toString())
          }
          res.send(result)
        })
      }
    }
  }
}
// TODO !9: quand fera hapi, si express et hapi ont la meme syntaxe dans la route, ou les handlers, alors on met en commun en sautant un �tage dans le tableau (testAction.get = function direct)

export default routes

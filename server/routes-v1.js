'use strict'

const routes = {
    'testAction': {
        'path': {
            'express': '/test/:variable'
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
                api.callScenario('123', () => {})
                res.send('test: ' + req.params.variable).end()
            }
        }
    }
}
// TODO: quand fera hapi, si expres et hapi ont la meme syntaxe dans la route, ou les handlers, alors on met en commun en sautant un étage dans le tableau (testAction.get = function direct)

export default routes

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
    'test': {
        'path': {
            'express': '/home'
        },
        'get': {
            'express': (req, res, api) => {
                api.callHome(api.authenticatedData.siteId, (err, result) =>{
                    if (err) {
                        return res.send(err).code(500).end()
                    }
                    res.send('/home succeed!').end()
                })
            }
        }
    }
}
// TODO: quand fera hapi, si express et hapi ont la meme syntaxe dans la route, ou les handlers, alors on met en commun en sautant un �tage dans le tableau (testAction.get = function direct)

export default routes

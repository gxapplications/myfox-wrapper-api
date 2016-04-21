'use strict'

import express from 'express'
import { join as joinPaths } from 'path'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import morgan from 'morgan'
import expressControllerV1 from './controller-express-v1'

// application
const application = express()
const assetsPath = joinPaths(__dirname, 'assets')
application.set('port', process.env.PORT || 3000)

// middlewares
application.use(express.static(assetsPath))
application.use(bodyParser.urlencoded({ extended: true }))
application.use(methodOverride((req) => req.body._method))

// logger
if (application.get('env') !== 'test') {
  application.use(morgan(application.get('env') === 'development' ? 'dev' : 'combined'))
}

// api routes & middlewares
application.use('/v1', expressControllerV1)

export default application

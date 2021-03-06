'use strict'

const createServer = require('http').createServer
const express = require('express')

const application = express()
application.all('/*', (req, res, next) => {
  setTimeout(() => {
    res.write('<html><head><title>... Page not found</title></head><body><a>tag A<br/></a>')
    res.flushHeaders()
  }, 1000)
  setTimeout(() => {
    res.write('<span>tag span</span><br/>')
    res.flushHeaders()
  }, 2000)
  setTimeout(() => {
    res.write('<b>tag B</b><br/>')
    res.flushHeaders()
  }, 5000)
  setTimeout(() => {
    res.write('<span>tag span 2</span><br/></body></html>')
    res.end()
  }, 8000)
})
const server = createServer(application)
server.listen(8001, () => {
  console.log('Server listening on port', '8001')
})

'use strict'

import config from 'config'
import http from 'http'
import https from 'https'
import querystring from 'querystring'
import { notFound200 } from './false-error-codes'

// TODO !0: doc et TU
export function httpsRequest (method, path, streamParser, callback, queryParams, payload, headers) {
  // POST / PUT / PATCH cases
  if (payload) {
    payload = JSON.stringify(payload)
  }
  const postHeaders = (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) ? {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': payload.length
  } : {}

  // Query parameters to path
  if (queryParams && queryParams !== {}) {
    queryParams = querystring.stringify(queryParams)
    path = path + '?' + queryParams
  }

  try {
    const requestData = {
      hostname: config.get('html.myfox.hostname'),
      port: config.get('html.myfox.port'),
      path: path,
      headers: Object.assign(postHeaders, config.get('html.myfox.headers'), headers),
      method: method
    }

    let req = ((config.get('html.myfox.protocol') === 'http') ? http : https).request(requestData, (res) => {
      // If HTTP error case, no need to parse the body
      if (res.statusCode >= 400) {
        const error = new Error('Error status code returned by Myfox.')
        error.status = res.statusCode
        return callback(error)
      }

      // If false HTTP codes, fix them
      if (res.statusCode === 302 && res.headers.location === config.get('html.myfox.redirectForbidden')) {
        const error = new Error('Myfox redirected to / because of forbidden access.')
        error.status = 403
        return callback(error)
      }
      res.pipe(notFound200) // Change 'Page not found' code 200 by 404
      notFound200.on('error', callback)

      res.setEncoding('utf8')
      if (streamParser !== null && streamParser !== undefined) {
        // There is a streamParser. 'end' event won't return data (parser must catch data needed).
        res.pipe(streamParser)
        res.on('end', callback)
      } else {
        // There is no streamParser, so all data will be bufferized and returned at the 'end' event.
        let buffer = ''
        res.on('data', (chunk) => {
          buffer += chunk
        })
        res.on('end', () => {
          callback(null, buffer)
        })
      }
    })
    streamParser.on('error', callback)
    req.on('error', callback)
    if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(payload)
    }
    req.end()
  } catch (err) {
    console.error('requestData() encounter exception parsing Myfox response.', err)
    if (err.status === null || err.status === undefined) {
      err.status = 500
    }
    callback(err)
  }
}

// TODO !0: doc et TU
export function trumpetInnerText (callback) {
  return function (element) {
    let buffer = ''
    const stream = element.createReadStream()
    stream.setEncoding('utf8')
    stream.on('data', (chunk) => {
      buffer += chunk
    })
    stream.on('end', () => {
      callback(buffer)
    })
    stream.on('error', (err) => {
      throw new Error(err)
    })
  }
}

'use strict'

import config from 'config'
import http from 'http'
import https from 'https'
import querystring from 'querystring'
import { notFound200 } from './false-error-codes'

// TODO !0: TU
/**
 * Helper to send an HTTP request to Myfox services, and parse response stream
 * You will use this to analyze Myfox HTML response from an HTTP query,
 * and to avoid parsing general events like errors, authentication problems, etc...
 * @param {string} method The HTTP method, in upper case (GET, POST, PUT, PATCH, DELETE, ...)
 * @param {string} path The URL path part (without query string and host parts), like '/home/1234' 
 * @param {object} streamParser a stream parser to pipe on the distant response stream
 * @param {function} callback The callback function to call after parsing (will take (err, data) as arguments)
 * @param {object} queryParams An object to serialize into the query string
 * @param {object} payload An object to serialize as the request payload
 * @param {object} headers An object to push into the request headers
 */
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

      // From here we start to analyze the content of the data. Keep it in a buffer anyway.
      res.setEncoding('utf8')
      let buffer = ''
      res.on('data', (chunk) => {
        buffer += chunk
      })

      res.pipe(codeKo200) // Change code KO with 200 by 400 and fetch the message
      codeKo200.on('error', () => {
          // TODO !1: manage this {"code":"KO","msg":[["Identification failed for the following reason: Too many connection attempts.","error"]]}
          // ici on doit donc chopper msg ! via un autre parser ? du genre res.pipe(JSONStream.parse('msg').on(...)) ?

          // TODO !1: tester ! c douteux !
      })

      if (streamParser !== null && streamParser !== undefined) {
        // There is a streamParser. 'end' event won't return data (parser must catch data needed).
        res.pipe(streamParser)
        res.on('end', callback)
      } else {
        // There is no streamParser, so all bufferized data will be returned at the 'end' event.
        res.on('end', () => {
          callback(null, buffer)
        })
      }
    })

    if (streamParser !== null && streamParser !== undefined) {
      streamParser.on('error', callback)
    }
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

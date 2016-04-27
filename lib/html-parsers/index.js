'use strict'

import https from 'https'
import config from 'config'

// TODO !2: doc et TU
export function httpsRequest (method, path, streamParser, callback, queryParams, payload, headers) {
  if (payload) {
    payload = JSON.stringify(payload)
  }
  const postHeaders = (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) ? {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': payload.length
  } : {}

  // FIXME !0: queryParams to take into account (stringify ? add to path ?)
  try {
    let req = https.request({
      hostname: config.get('html.myfox.hostname'),
      port: config.get('html.myfox.port'),
      path: path,
      headers: Object.assign(postHeaders, config.get('html.myfox.headers'), headers),
      method: method
    }, (res) => {
      // If error case, no need to parse the body
      if (res.statusCode >= 400) {
        const error = new Error()
        error.status = res.statusCode
        return callback(error)
      }

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
    req.write(payload)
    req.end()
  } catch (err) {
    err.status = 500
    callback(err)
  }
}

// TODO !3: doc et TU
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

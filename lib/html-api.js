'use strict'

import https from 'https'
import trumpet from 'trumpet'
import JsonStream from 'JSONStream'
import config from 'config'

import MyfoxWrapperApiCommon from './common-api'

const httpsRequest = function (method, path, streamParser, callback, queryParams, payload, headers) {
  if (payload) {
      payload = JSON.stringify(payload)
  }
  const postHeaders = (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) ? {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': payload.length
  } : {}

  // FIXME !2: queryParams to take into account (stringify ? add to path ?)
  try {
    let req = https.request({
      hostname: config.get('html.myfox.hostname'),
      port: config.get('html.myfox.port'),
      path: path,
      headers: Object.assign(postHeaders, config.get('html.myfox.headers'), headers),
      method: method
    }, (res) => {
      res.setEncoding('utf8')
      if (streamParser !== null && streamParser !== undefined) {
        res.pipe(streamParser)
      } else {
        // TODO !1: recup la data complete dans une var, et quand fini, callback(null, var)
      }
      res.on('end', callback)
    })
    streamParser.on('error', callback)
    req.on('error', callback)
    req.write(payload)
    req.end()
  } catch (err) {
    callback(err)
  }
}

const trumpetInnerText = function (callback) {
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

class MyfoxWrapperApiHtml extends MyfoxWrapperApiCommon {

  /**
   * Call Myfox authentication process (login form filled in POST method).
   * Do not use this method directly to login to Myfox services: the auth will not be stored.
   * @param {object} authData Authentification data that comes from previous authentication.
   * @param {function} callback To use when the authentication is done (fail or success), with parameters: (err, authData)
   */
  authenticate (authData, callback) {
    const validSiteIds = this.options.myfoxSiteIds || [];

    // Call https://myfox.me/login', POST, payload={'username', 'password'}
    // Receive {'code': "KO"} OR {rdt: ["https://myfox.me/home/XXXX", 0]}
    httpsRequest(
      'POST',
      config.get('html.myfox.paths.login'),
      JsonStream.parse('rdt.0').on('data', (data) => {
        // FIXME !0: on parse data pour en extraire siteId, on voit si bien dans validSiteIds. sinon callback('error')
        return callback(null, data)
      }),
      (err) => {
        callback(err || 'Login failed')
      },
      {},
      {'username': 'toto', 'password': 'titi'} // FIXME !3: les recuperer d'ou ?
    )
  }

  /**
   * Call Myfox interface with the action/query.
   * Do not use this method directly to call Myfox services. Prefer use this.callApi(url, method, queryParams, headers, payload)
   * @param {string} url The HTTP(s) URL to call
   * @param {string} method The HTTP method (get, post, patch, put, delete)
   * @param {object} queryParams An object to serialize into the query string
   * @param {object} headers An object to push into the request headers
   * @param {object} payload An object to serialize as the request payload
   * @param {object} streamParser a stream parser to pipe on the distant response stream
   * @param {function} resolve The callback to use if the call succeeds (with data as unique parameter)
   * @param {function} reject The callback to use if the call fails (with the error as unique parameter)
   * @param {function} reAuthenticate The callback to use if the call received a 403 error, to force a new loop with an authentication process. May be null ! In this case, throw an error.
   */
  callDistant (url, method, queryParams, headers, payload, streamParser, resolve, reject, reAuthenticate) {
    httpsRequest(
      method,
      url,
      streamParser,
      (err, fullData) => {
        if (err) {
          // FIXME !4: si 403, reAuthenticate() plutot que reject !
          return reject(err)
        }
        resolve(fullData)
      },
      queryParams,
      payload,
      headers
    )
  }

  callHome (callback) {
    // TODO !5: example to do
    let myVar
    let trumpetParser = trumpet()
    trumpetParser.selectAll('span.todo', trumpetInnerText((data) => {
        myVar = data
    }))
    super.callApi('/home', 'GET', trumpetParser, {}, {}, {})
      .then((fullData) => {
        callback(null, myVar)
      })
      .catch((err) => {
        callback(err)
      })
  }
}

// exports
export default function myfoxWrapperApiHtml (options, fallbackApi) {
  return new MyfoxWrapperApiHtml(options, fallbackApi)
}

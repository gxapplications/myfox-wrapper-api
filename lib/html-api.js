'use strict'

import JsonStream from 'JSONStream'
import config from 'config'

import MyfoxWrapperApiCommon from './common-api'
import { httpsRequest } from './html-parsers'

// Html parsers
import homeParser from './html-parsers/home'

class MyfoxWrapperApiHtml extends MyfoxWrapperApiCommon {

  /**
   * Call Myfox authentication process (login form filled in POST method).
   * Do not use this method directly to login to Myfox services: the auth will not be stored.
   * @param {object} authData Authentication data that comes from previous authentication.
   * @param {function} callback To use when the authentication is done (fail or success), with parameters: (err, authData)
   */
  authenticate (authData, callback) {
    const validSiteIds = this.options.myfoxSiteIds || []

    // Call https://myfox.me/login', POST, payload={'username', 'password'}
    // Receive {'code': "KO"} OR {rdt: ["https://myfox.me/home/XXXX", 0]}
    httpsRequest(
      'POST',
      config.get('html.myfox.paths.login'),
      JsonStream.parse('rdt').on('data', (data) => {
        try {
          const siteId = data[0].split('/').pop()
          if (validSiteIds.indexOf(siteId) === -1) {
            console.error(`Authenticated with a forbidden siteId (${siteId}). Please check your configuration (server.myfox.myfoxSiteIds)`)
            const error = new Error('Forbidden siteId. The server is restricted to a list of siteIds and your does not match one of them.')
            error.status = 449
            return callback(error)
          }
          return callback(null, data)
        } catch (err) {
          err.status = 500
          return callback(err)
        }
      }),
      (err) => {
        callback(err || 'Login failed.')
      },
      {},
      {'username': 'toto', 'password': 'titi'} // FIXME !4: les recuperer d'ou ?
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
          // FIXME !1: si 403, reAuthenticate() si present, sinon reject d'un error object, representant une 403
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
    console.info('Routing - callHome:', 'GET', '/home')
    super.callApi('/home', 'GET', homeParser, {}, {}, {})
      .then(() => {
        // TODO !6: example to do and to doc
        callback(null, homeParser.myVar)
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

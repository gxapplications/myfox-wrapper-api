'use strict'

import MyfoxWrapperApiCommon from './common-api'

class MyfoxWrapperApiHtml extends MyfoxWrapperApiCommon {

  /**
   * Call Myfox authentication process (login form filled in POST method).
   * @param {object} authData Authentification data that comes from previous authentication.
   * @param {function} callback To use when the authentication is done (fail or success), with parameters: (err, authData)
   */
  authenticate (authData, callback) {
    // TODO
    callback(null, authData)
  }

  /**
   * Call Myfox interface with the action/query.
   * Do not use this method directly to call Myfox services. Prefer use this.callApi(url, method, queryParams, headers, payload)
   * @param {string} url The HTTP(s) URL to call
   * @param {string} method The HTTP method (get, post, patch, put, delete)
   * @param {object} queryParams An object to serialize into the query string
   * @param {object} headers An object to push into the request headers
   * @param {object} payload An object to serialize as the request payload
   * @param {function} resolve The callback to use if the call succeeds (with data as unique parameter)
   * @param {function} reject The callback to use if the call fails (with the error as unique parameter)
   * @param {function} reAuthenticate The callback to use if the call received a 403 error, to force a new loop with an authentication process. May be null ! In this case, throw an error.
   */
  callDistant (url, method, queryParams, headers, payload, resolve, reject, reAuthenticate) {
    // TODO
    resolve('yosh')
  }

  // FIXME: to remove after tests
  callScenario (scenarioId, callback) {
    super.callApi('', 'GET', {}, {}, {})
      .then((data) => {
        console.log('then', data)
      })
      .catch((err) => {
        console.log('catch', err)
      })
  }
}

// exports
export default function myfoxWrapperApiHtml (options, fallbackApi) {
  return new MyfoxWrapperApiHtml(options, fallbackApi)
}

'use strict'

import Joi from 'joi'

// keep this private. Not exported with the class.
const _notImplemented = function (functionName, ...params) {
  if (this.fallbackApi !== null && this.fallbackApi !== undefined) {
    this.fallbackApi[functionName](params)
  } else {
    throw new Error('Feature not implemented in this wrapper.')
  }
}

class MyfoxWrapperApiCommon {

  // Construction parts

  constructor (options, fallbackApi) {
    this.options = Object.assign({}, MyfoxWrapperApiCommon.defaultOptions(), options)
    Joi.assert(this.options, MyfoxWrapperApiCommon.optionsSchema())

    this.fallbackApi = fallbackApi

    this.authenticatedUntil = new Date()
    this.authenticatedData = null
  }

  static defaultOptions () {
    return {
      apiStrategy: 'custom',
      autoAuthentication: true,
      autoAuthRetryCredits: 3, // 4 calls maximum means 3 retries
      authValidity: 120, // 2 minutes
      myfoxSiteIds: [] // must be overriden by your siteIds (most often just one...)
    }
  }

  static optionsSchema () {
    return Joi.object({
      apiStrategy: Joi.string().required().valid(['htmlOnly', 'htmlFirst', 'restFirst', 'restOnly', 'custom']),
      autoAuthentication: Joi.boolean().required(),
      autoAuthRetryCredits: Joi.number().integer().min(0).max(10).required(),
      authValidity: Joi.number().integer().min(1).max(86400).required(), // 10 seconds to 24hrs
      myfoxSiteIds: Joi.array().items(Joi.number().integer().min(1)).min(1).required() // at least 1 number
    })
  }

  // MyFox distant caller and auto-authentification system

  /**
   * Call this when you need to call distant Myfox services.
   * This method will manage authentication layer.
   * @param {string} url The HTTP(s) URL to call
   * @param {string} method The HTTP method (get, post, patch, put, delete)
   * @param {object} queryParams An object to serialize into the query string
   * @param {object} headers An object to push into the request headers
   * @param {object} payload An object to serialize as the request payload
   * @returns {Promise} A promise for asynchronous behavior
   */
  callApi (url, method, queryParams, headers, payload) {
    // No auth needed, handled manually. Just call the service.
    if (!this.options.autoAuthentication) {
      return new Promise((resolve, reject) => {
        this.callDistant(url, method, queryParams, headers, payload, resolve, reject, null)
      })
    }
    // Try to authenticate function
    let tryToAuthenticate
    tryToAuthenticate = (retryCredits, callDistant, resolve, reject) => {
      this.authenticate(this.authenticatedData, (err, authData) => {
        if (err) { // TODO: more specific failure ? http code ?
          if (retryCredits > 0) { // retry one more time
            return tryToAuthenticate(retryCredits - 1, callDistant, resolve, reject)
          } else {
            return reject(err)
          }
        } else {
          this.authenticatedUntil.setTime(new Date().getTime() + (this.options.authValidity * 1000))
          this.authenticatedData = authData
          return callDistant(url, method, queryParams, headers, payload, resolve, reject, null)
        }
      })
    }
    return new Promise((resolve, reject) => {
      let authCredits = this.options.autoAuthRetryCredits
      // For sure, we need to auth before calling service
      if (!this.isMaybeAuthenticated()) {
        return tryToAuthenticate(authCredits, this.callDistant.bind(this), resolve, reject)
      }
      // Maybe we are still authenticated. Try service and see... if fails auth and try again once.
      this.callDistant(url, method, queryParams, headers, payload, resolve, reject, () => {
        return tryToAuthenticate(authCredits, this.callDistant.bind(this), resolve, reject)
      })
    })
  }

  isMaybeAuthenticated () {
    const now = new Date()
    return this.authenticatedUntil > now
  }

  // Wrapper API methods

  /**
   * Call Myfox authentication process.
   * This method must be overridden in the extended api implementation.
   * @param {object} authData Authentification data that comes from previous authentication.
   * @param {function} callback To use when the authentication is done (fail or success), with parameters: (err, authData)
   */
  authenticate (authData, callback) {
    throw new Error('Feature not implemented in this wrapper.')
  }

  /**
   * Call Myfox interface with the action/query.
   * This method must be overridden in the extended api implementation.
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
    throw new Error('Feature not implemented in this wrapper.')
  }

  callHome (siteId, callback) {
    _notImplemented.bind(this)('callHome', siteId, callback)
  }
}

export default MyfoxWrapperApiCommon

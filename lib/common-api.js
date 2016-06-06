'use strict'

import Joi from 'joi'

import persistentState from './persistent-state'

/**
 * Uses the fallback API wrapper if available, else raises a 'Not Implemented' exception.
 * Keep this function private: Not exported with the class.
 * As we use 'this' in the function, you MUST always call it with a bind:
 * _notImplemented.bind(<object_as_this>)(...)
 *
 * @method  _notImplemented
 * @param   {string}  functionName           The method name that is not implemented yet.
 * @param   {mixed}   params                 The list of the parameters given to the original method (rest notation).
 * @throws  {Error}   If there is no fallback API set during the API wrapper instanciation.
 */
const _notImplemented = function (functionName, ...params) {
  if (this.fallbackApi !== null && this.fallbackApi !== undefined) {
    this.fallbackApi[functionName](params)
  } else {
    throw new Error('Feature not implemented in this wrapper.')
  }
}

/**
 * Parent class that contains the method list to implement on the subclasses, and common methods.
 * The constructor must never be squizzed even by a subclass: parameters validation is done here.
 */
class MyfoxWrapperApiCommon {

  // Construction parts

  /**
   * Common constructor called by subclasses.
   *
   * @param   {object}    options                        The options to build the wrapper. Will be merged with default values (see below).
   * @param   {string}    [options.apiStrategy]          The strategy adopted to fallback on another wrapper if the method does not exists. One of the following values: ['htmlOnly', 'htmlFirst', 'restFirst', 'restOnly', 'custom'].
   * @param   {boolean}   [options.autoAuthentication]   To automate or not the authentication process (between the wrapper and Myfox services).
   * @param   {integer}   [options.autoAuthRetryCredits] The amount of tries to authenticate against Myfox services [0-10]. Warning: too many attempts can blacklist your IP.
   * @param   {integer}   [options.authValidity]         The amount of seconds a Myfox session SHOULD live [1-86400].
   * @param   {integer[]} [options.myfoxSiteIds]         The list of site IDs (linked to the same user account) allowed to be used by the wrapper.
   * @param   {MyfoxWrapperApiCommon} [fallbackApi]      Another instance of wrapper to use as fallback if the called method does not exists.
   * @param   {object}    [accountCredentials]           The Myfox account credentials
   * @param   {string}    [accountCredentials.username]  The username (the email used to login on the Myfox interface).
   * @param   {string}    [accountCredentials.password]  The password (used to login on the Myfox interface). Stored nowhere except on this dynamic class instance.
   * @return {MyfoxWrapperApiCommon} The instance to use as wrapper or as fallback wrapper inside another one.
   */
  constructor (options, fallbackApi, accountCredentials) {
    this.options = Object.assign({}, MyfoxWrapperApiCommon.defaultOptions(), options)
    Joi.assert(this.options, MyfoxWrapperApiCommon.optionsSchema())

    this.accountCredentials = accountCredentials
    if (this.accountCredentials !== null && this.accountCredentials !== undefined) {
      Joi.assert(this.accountCredentials, MyfoxWrapperApiCommon.accountCredentialsSchema())
    }

    this.fallbackApi = fallbackApi

    // auth data, statefull
    this.authenticatedUntil = new Date()
    this.authenticatedData = null
    this.authenticatedSiteId = null
    this.cookieJar = {}

    // persistent states are event triggerers and registers listeners. Statefull
    this.persistentStates = {
      status: persistentState('status'),
      alarm: persistentState('alarm'),
      scenarii: persistentState('scenarii')
      // domotic: persistentState('domotic') // No dynamic behavior, so should not be required...
    }
  }

  /**
   * Default options merged into options given to the constructor.
   * See details on the documented constructor.
   */
  static defaultOptions () {
    return {
      apiStrategy: 'custom',
      autoAuthentication: true,
      autoAuthRetryCredits: 1, // 2 calls maximum means 1 retry
      authValidity: 120, // 2 minutes
      myfoxSiteIds: [] // must be overriden by your siteIds (most often just one...)
    }
  }

  /**
   * Options format validator.
   * See details on the documented constructor.
   */
  static optionsSchema () {
    return Joi.object({
      apiStrategy: Joi.string().required().valid(['htmlOnly', 'htmlFirst', 'restFirst', 'restOnly', 'custom']),
      autoAuthentication: Joi.boolean().required(),
      autoAuthRetryCredits: Joi.number().integer().min(0).max(10).required(),
      authValidity: Joi.number().integer().min(1).max(86400).required(), // 10 seconds to 24hrs
      myfoxSiteIds: Joi.array().items(Joi.number().integer().min(1)).min(1).required() // at least 1 number
    })
  }

  /**
   * Account credentials format validator.
   * See details on the documented constructor.
   */
  static accountCredentialsSchema () {
    return Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required()
    })
  }

  // MyFox distant caller and auto-authentification system

  /**
   * Call this when you need to call distant Myfox services.
   * This method will manage authentication layer.
   *
   * @method  callApi
   * @param   {string}  url          The HTTP(s) URL to call
   * @param   {string}  method       The HTTP method in uppercase (GET, POST, PATCH, PUT, DELETE, etc...)
   * @param   {object}  streamParser A stream parser to pipe on the distant response stream
   * @param   {object}  queryParams  An object to serialize into the query string
   * @param   {object}  headers      An object to push into the request headers
   * @param   {object}  payload      An object to serialize as the request payload
   * @return  {Promise}              A promise for asynchronous behavior
   */
  callApi (url, method, streamParser, queryParams, headers, payload) {
    // No auth needed, handled manually. Just call the service.
    if (this.options.autoAuthentication === false) {
      console.info('Authentication should be made manually.')
      return new Promise((resolve, reject) => {
        this.callDistant(url, method, queryParams, headers, payload, streamParser, resolve, reject, null)
      })
    }

    // Try to authenticate function
    let tryToAuthenticate
    tryToAuthenticate = (retryCredits, callDistant, streamParser, resolve, reject) => {
      this.authenticate(this.authenticatedData, (err, authData, defaultSiteId) => {
        if (err) {
          if (retryCredits > 0) { // retry one more time
            console.warn('Authentication failed. Retrying ' + retryCredits + ' times left.')
            retryCredits--
            return tryToAuthenticate(retryCredits, callDistant, streamParser, resolve, reject)
          } else {
            const error = new Error('Authentication failed. No retry credits left.')
            error.status = 403
            error.previous = err
            return reject(error)
          }
        } else {
          console.info('Authenticated against Myfox services at ' + new Date().getTime())
          this.authenticatedUntil.setTime(new Date().getTime() + (this.options.authValidity * 1000))
          this.authenticatedData = authData
          this.authenticatedSiteId = defaultSiteId
          return callDistant(url, method, queryParams, headers, payload, streamParser, resolve, reject, null)
        }
      })
    }
    return new Promise((resolve, reject) => {
      let authCredits = this.options.autoAuthRetryCredits
      // For sure, we need to auth before calling service
      if (!this.isMaybeAuthenticated()) {
        console.info('(RE)Authentication needed.')
        tryToAuthenticate(authCredits, this.callDistant.bind(this), streamParser, resolve, reject)
      } else {
        console.info('Authentication should not be needed...')
        // Maybe we are still authenticated. Try service and see... if fails auth and try again once.
        this.callDistant(url, method, queryParams, headers, payload, streamParser, resolve, reject, () => {
          tryToAuthenticate(authCredits, this.callDistant.bind(this), streamParser, resolve, reject)
        })
      }
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
   *
   * @param   {object}     authData Authentication data that comes from previous authentication.
   * @param   {function}   callback To use when the authentication is done (fail or success), with parameters: (err, authData)
   */
  authenticate (authData, callback) {
    throw new Error('Feature not implemented in this wrapper.')
  }

  /**
   * Call Myfox interface with the action/query.
   * This method must be overridden in the extended api implementation.
   * Do not use this method directly to call Myfox services. Prefer use this.callApi(url, method, queryParams, headers, payload)
   *
   * @param   {string}   url            The HTTP(s) URL to call. This url will be parsed in subclasses to replace {siteId} by its value
   * @param   {string}   method         The HTTP method in uppercase (GET, POST, PATCH, PUT, DELETE, etc...)
   * @param   {object}   queryParams    An object to serialize into the query string
   * @param   {object}   headers        An object to push into the request headers
   * @param   {object}   payload        An object to serialize as the request payload
   * @param   {object}   streamParser   A stream parser to pipe on the distant response stream
   * @param   {function} resolve        The callback to use if the call succeeds (with data as unique parameter)
   * @param   {function} reject         The callback to use if the call fails (with the error as unique parameter)
   * @param   {function} reAuthenticate The callback to use if the call received a 403 error, to force a new loop with an authentication process. May be null ! In this case, throw an error.
   */
  callDistant (url, method, queryParams, headers, payload, streamParser, resolve, reject, reAuthenticate) {
    throw new Error('Feature not implemented in this wrapper.')
  }

  /**
   * Adds a listener to a persistent state, given a state label.
   * The listener is a function, that will be called with the following arguments:
   * - state label
   * - new state value,
   * - previous state value,
   * - a timestamp (creation date of the event)
   *
   * @param  {string}   label     The unique label that identifies a persistent state
   * @param  {function} listener  The listener function to call if the state changes.
   * @return {boolean}  True if the listener is added, false if already registered.
   */
  addStateListener (label, listener) {
    let state = this.persistentStates['label']
    if (state === null || state === undefined) {
      throw new Error(`The state label ${label} does not exists`)
    }
    return state.addListener(listener)
  }

  /**
   * Calls main page (/home) to retrieve data like alarm level, box status, default site info, and other subparts.
   * This call is made for HTML wrapper. Rest wrapper does not provides this call.
   *
   * @param   {function} callback The function to call with all data retrieved through /home.
   */
  callHome (callback) {
    _notImplemented.bind(this)('callHome', callback)
  }
}

export default MyfoxWrapperApiCommon

'use strict'

import JsonStream from 'JSONStream'
import config from 'config'
import Joi from 'joi'
import crypto from 'crypto'

import MyfoxWrapperApiCommon from './common-api'
import { httpsRequest } from './html-parsers'

// Html parsers
import homeParser from './html-parsers/home'
import scenarioActionParser from './html-parsers/scenario-action'

class MyfoxWrapperApiHtml extends MyfoxWrapperApiCommon {

  /**
   * Html version constructor.
   * This overrides the default constructor to add HTML parameters to the configuration.
   *
   * @param   {object}    options                        The options to build the wrapper. Will be merged with default values (see below)
   * @param   {string}    [options.apiStrategy]          The strategy adopted to fallback on another wrapper if the method does not exists. One of the following values: ['htmlOnly', 'htmlFirst', 'restFirst', 'restOnly', 'custom']
   * @param   {boolean}   [options.autoAuthentication]   To automate or not the authentication process (between the wrapper and Myfox services)
   * @param   {integer}   [options.autoAuthRetryCredits] The amount of tries to authenticate against Myfox services [0-10]. Warning: too many attempts can blacklist your IP
   * @param   {integer}   [options.authValidity]         The amount of seconds a Myfox session SHOULD live [1-86400]
   * @param   {integer[]} [options.myfoxSiteIds]         The list of site IDs (linked to the same user account) allowed to be used by the wrapper
   * @param   {MyfoxWrapperApiCommon} [fallbackApi]      Another instance of wrapper to use as fallback if the called method does not exists
   * @param   {object}    [accountCredentials]           The Myfox account credentials
   * @param   {string}    [accountCredentials.username]  The username (the email used to login on the Myfox interface)
   * @param   {string}    [accountCredentials.password]  The password (used to login on the Myfox interface). Stored nowhere except on this dynamic class instance
   * @return  {MyfoxWrapperApiCommon} The instance to use as wrapper or as fallback wrapper inside another one
   */
  constructor (options, fallbackApi, accountCredentials) {
    super(options, fallbackApi, accountCredentials)
    try {
      const defaultConfig = {'html': require('../config/default.json')['myfox-wrapper-api']['html']}
      config.util.setModuleDefaults('myfox-wrapper-api', defaultConfig)
    } catch (err) {
      // FIXME: il faut tryer que si en mode server ou tests. Pas en mode lib!
    }
  }

  /**
   * Call Myfox authentication process (login form filled in POST method).
   * Do not use this method directly to login to Myfox services: the auth will not be stored.
   *
   * @param {object} authData Authentication data that comes from previous authentication.
   * @param {function} callback To use when the authentication is done (fail or success), with parameters: (err, authData)
   */
  authenticate (authData, callback) {
    const validSiteIds = this.options.myfoxSiteIds || []
    try {
      // Call https://myfox.me/login', POST, payload={'username', 'password'}
      // Receive {'code': "KO"} OR {rdt: ["https://myfox.me/home/XXXX", 0]}

      httpsRequest(
        'POST',
        config.get('myfox-wrapper-api.html.myfox.paths.login'),
        JsonStream.parse('rdt').on('data', (data) => {
          try {
            const siteId = data[0].split('/').pop()
            if (validSiteIds.indexOf(parseInt(siteId)) === -1) {
              console.error(`Authenticated with a forbidden siteId (${siteId}). Please check your configuration (server.myfox.myfoxSiteIds)`)
              const error = new Error('Forbidden siteId. The server is restricted to a list of siteIds and your does not match one of them.')
              error.status = 449
              return callback(error)
            }
            // transfer of auth data (containing default siteId)
            return callback(null, data, siteId)
          } catch (err) {
            err.status = 500
            return callback(err)
          }
        }),
        (err) => {
          if (err) {
            return callback(err)
          }
        },
        {},
        {'username': this.accountCredentials.username, 'password': this.accountCredentials.password},
        config.get('myfox-wrapper-api.html.myfox.headers_login'),
        (cookie) => {
          if (cookie !== null && cookie !== undefined) {
            this.cookieJar = cookie
          } else {
            return this.cookieJar
          }
        }
      )
    } catch (err) {
      console.error(err)
      callback(err)
    }
  }

  /**
   * Call Myfox interface with the action/query.
   * Do not use this method directly to call Myfox services. Prefer use this.callApi(url, method, queryParams, headers, payload).
   *
   * @param {string} url The HTTP(s) URL to call. This url will be parsed to replace {siteId} by its value
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
    const path = url.replace('{siteId}', this.authenticatedSiteId)
    console.info('Routing - call distant:', 'GET', path)
    httpsRequest(
      method,
      path,
      streamParser,
      (err, fullData) => {
        if (err) {
          if (err.status === null || err.status === undefined) {
            err.status = 500
          }
          if (err.status === 403 && reAuthenticate !== null && reAuthenticate !== undefined) {
            return reAuthenticate()
          }
          return reject(err)
        }
        resolve(fullData || true)
      },
      queryParams,
      payload,
      headers,
      (cookie) => {
        if (cookie !== null && cookie !== undefined) {
          this.cookieJar = cookie
        } else {
          return this.cookieJar
        }
      }
    )
  }

  /**
   * Calls main page (/home) to retrieve data like alarm level, box status, default site info, and other subparts.
   * This call is made for HTML wrapper. Rest wrapper does not provides this call.
   *
   * You should use this call to test your connection. In the same time, this call will give you data to keep in cache:
   * - scenarii list
   * - domotic stuff list
   * - heat list
   * - data list
   * Except the fact that some of these can change their value, the list of their IDs cannot change really often,
   * and in case of change, a persistantState listener can be called.
   *
   * @param   {function} callback The function to call with all data retrieved through /home.
   */
  callHome (callback) {
    super.callApi(config.get('myfox-wrapper-api.html.myfox.paths.home'), 'GET', homeParser(this), {}, {}, {})
      .then((parser) => {
        callback(null, {
          status: parser.status,
          scenarii: parser.scenarii,
          alarm: parser.alarm,
          domotic: parser.domotic,
          data: parser.data,
          heat: parser.heat
        })
      })
      .catch((err) => {
        console.error(err)
        callback(err)
      })
  }

  /**
   * Calls scenario action (/widget/{siteId}/scenario/{action}/{id}) to turn on/off or to activate a scenario.
   * The possible action depends on the action type (on demand or not).
   *
   * @param  {Object}   [info]       Information to trigger the event
   * @param  {string}   info.id      The unique ID of the scenario to play action against
   * @param  {string}   info.action  The action to trigger. Can be play for 'on demand' scenario, on or off for others
   * @param  {integer}  info.delay   The delay (optional) to wait before triggering the action. If > 0 then the method will callback just after scheduling of the action
   * @param  {function} callback     The function to call with all data, depending on the step of the action macro: in the simplest case (one action, no delay),
   *                                 then the result of the call to Myfox. In other cases, an ID to follow with a macro listener
   *                                 The callback parameters must follows the same signature as a macro listener (see addMacroListener() method)
   * @param  {Object[]} [info[]]     The next actions informations, like the first param
   */
  callScenarioAction ({id, action, delay = 0}, callback, ...nextActions) {
    // Validation of parameters
    const validator = Joi.object({
      id: Joi.number().integer().required().positive(),
      action: Joi.string().required().valid(['on', 'off', 'play']),
      delay: Joi.number().integer().min(0).optional().default(0)
    })

    Joi.assert({id, action, delay}, validator)
    // If nextActions not empty, then check structure
    for (var nextAction of nextActions) {
      Joi.assert(nextAction, validator)
    }

    // If there is a delay, or nextActions, then an ID should be returned to allow a listener to be registered.
    if (delay > 0 || nextActions.length > 0) {
      this._callScenarioAction({id, action, delay}, callback, crypto.randomBytes(20).toString('hex'), ...nextActions)
    } else {
      this._callScenarioAction({id, action, delay: 0}, callback)
    }
  }

  /**
   * Subcall of callScenarioAction() to allow recursive call, and to keep unique macro ID over all the macro steps.
   *
   * @private
   * @param  {Object}   [info]       Information to trigger the event
   * @param  {integer}  info.id      The unique ID of the scenario to play action against
   * @param  {string}   info.action  The action to trigger. Can be play for 'on demand' scenario, on or off for others
   * @param  {integer}  info.delay   The delay (optional) to wait before triggering the action. If > 0 then the method will callback just after scheduling of the action
   * @param  {function} callback     The function to call with all data, depending on the step of the action macro: in the simplest case (one action, no delay),
   *                                 then the result of the call to Myfox. In other cases, the macro ID to follow with a macro listener
   *                                 The callback parameters must follows the same signature as a macro listener (see addMacroListener() method)
   * @param  {integer}  macroId      The unique ID to follow each step of the macro. This Id is returned in the callback, and can be used to follow the macro trougth a macro listener
   * @param  {Object[]} [info[]]     The next actions informations, like the first param
   */
  _callScenarioAction ({id, action, delay = 0}, callback, macroId = null, ...nextActions) {
    // Call Api for first action (or schedule it if delayed), THEN schedule next.
    // If scheduled, cannot return the state in the callback: will return an ID to register a listener.
    if (delay > 0) {
      // Delayed case: returns directly with an ID, and schedules calling itself for later.
      setTimeout(() => {
        this._callScenarioAction({id, action, delat: 0}, super.notifyMacroListeners, macroId, ...nextActions)
      }, delay)
      callback(null, { id: macroId, state: 'delayed', remaining: nextActions.length })
    } else {
      let url = config.get('myfox-wrapper-api.html.myfox.paths.scenario_action').replace('{action}', action).replace('{id}', id)
      if (action === 'play') {
        url += '?_=' + (new Date()).getTime()
      }
      super.callApi(url, (action === 'play') ? 'GET' : 'POST', scenarioActionParser(this), {}, {}, {})
        .then((parser) => {
          callback(null, {
            id: macroId,
            data: parser.data,
            state: (nextActions.length > 0) ? 'progress' : 'finished',
            remaining: nextActions.length
          })
          if (nextActions.length > 0) {
            let nextAction = nextActions.shift()
            this._callScenarioAction(nextAction, super.notifyMacroListeners, macroId, ...nextActions)
          }
        })
        .catch((err) => {
          console.error(err)
          callback(err)
        })
    }
  }
}

// exports
export default function myfoxWrapperApiHtml (options, fallbackApi, accountCredentials) {
  return new MyfoxWrapperApiHtml(options, fallbackApi, accountCredentials)
}

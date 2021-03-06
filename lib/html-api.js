'use strict'

import JsonStream from 'JSONStream'
import config from 'config'
import Joi from 'joi'
import crypto from 'crypto'
import cloneDeep from 'clone-deep'

import MyfoxWrapperApiCommon from './common-api'
import { httpsRequest } from './html-parsers'

// Html parsers
import homeParser from './html-parsers/home'
import simpleCodeActionParser from './html-parsers/simple-code-action'
import { step1Parser, step2Parser, step3TempInspectionParser, step3TempModificationParser,
    step3TempFixer, step4Parser, step5Parser } from './html-parsers/scenario_edition'

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
      // Success only if used as a dependency.
      const defaultConfig = {'html': require('../config/default.json')['myfox-wrapper-api']['html']}
      config.util.setModuleDefaults('myfox-wrapper-api', defaultConfig)
    } catch (err) {
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
    console.info('Routing - call distant:', method, path)
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
   * @param  {string}   [macroId]    Optional ID to keep track of the action if multiple steps or delay is provided.
   * @param  {Object[]} [info[]]     The next actions informations, like the first param
   */
  callScenarioAction ({id, action, delay = 0}, callback, macroId = undefined, ...nextActions) {
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
      this._callScenarioAction({id, action, delay}, callback, macroId || crypto.randomBytes(20).toString('hex'), ...nextActions)
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
      const that = this
      setTimeout(function () {
        that._callScenarioAction({id, action, delay: 0}, that.notifyMacroListeners.bind(that), macroId, ...nextActions)
      }, delay)
      callback(null, { id: macroId, state: 'delayed', remaining: nextActions.length })
    } else {
      let url = config.get('myfox-wrapper-api.html.myfox.paths.scenario_action').replace('{action}', action).replace('{id}', id)
      this.callApi(url, 'POST', simpleCodeActionParser(this), {}, {}, {})
        .then((parser) => {
          // If action succeed and on/off, then must update persistentStates
          if (parser.status === 'ok' && action !== 'play') {
            const scenarii = cloneDeep(this.persistentStates.scenarii.value)
            scenarii[id].active = (action === 'on') ? '1' : '0'
            this.persistentStates.scenarii.push(scenarii)
          }
          callback(null, {
            id: macroId,
            data: parser.data,
            state: (nextActions.length > 0) ? 'progress' : 'finished',
            remaining: nextActions.length
          })
          // If still some steps after, then call in recursive way
          if (nextActions.length > 0) {
            let nextAction = nextActions.shift()
            this._callScenarioAction(nextAction, this.notifyMacroListeners.bind(this), macroId, ...nextActions)
          }
        })
        .catch((err) => {
          console.error(err)
          callback(err)
        })
    }
  }

  /**
   * Calls domotic switch action (/widget/{siteId}/domotic/{action}/{id}) to turn on/off a domotic switch.
   *
   * @param  {Object}   [info]       Information to trigger the event
   * @param  {integer}  info.id      The unique ID of the domotic switch to play action against
   * @param  {string}   info.action  The action to trigger. Can be on or off
   * @param  {integer}  info.delay   The delay (optional) to wait before triggering the action. If > 0 then the method will callback just after scheduling of the action
   * @param  {function} callback     The function to call with all data, depending on the step of the action macro: in the simplest case (one action, no delay),
   *                                 then the result of the call to Myfox. In other cases, an ID to follow with a macro listener
   *                                 The callback parameters must follows the same signature as a macro listener (see addMacroListener() method)
   * @param  {string}   [macroId]    Optional ID to keep track of the action if multiple steps or delay is provided.
   * @param  {Object[]} [info[]]     The next actions informations, like the first param
   */
  callDomoticAction ({id, action, delay = 0}, callback, macroId = undefined, ...nextActions) {
    // Validation of parameters
    const validator = Joi.object({
      id: Joi.number().integer().required().positive(),
      action: Joi.string().required().valid(['on', 'off']),
      delay: Joi.number().integer().min(0).optional().default(0)
    })

    Joi.assert({id, action, delay}, validator)
    // If nextActions not empty, then check structure
    for (var nextAction of nextActions) {
      Joi.assert(nextAction, validator)
    }

    // If there is a delay, or nextActions, then an ID should be returned to allow a listener to be registered.
    if (delay > 0 || nextActions.length > 0) {
      this._callDomoticAction({id, action, delay}, callback, macroId || crypto.randomBytes(20).toString('hex'), ...nextActions)
    } else {
      this._callDomoticAction({id, action, delay: 0}, callback)
    }
  }

  /**
   * Subcall of callDomoticAction() to allow recursive call, and to keep unique macro ID over all the macro steps.
   *
   * @private
   * @param  {Object}   [info]       Information to trigger the event
   * @param  {integer}  info.id      The unique ID of the domotic switch to play action against
   * @param  {string}   info.action  The action to trigger. Can be on or off
   * @param  {integer}  info.delay   The delay (optional) to wait before triggering the action. If > 0 then the method will callback just after scheduling of the action
   * @param  {function} callback     The function to call with all data, depending on the step of the action macro: in the simplest case (one action, no delay),
   *                                 then the result of the call to Myfox. In other cases, an ID to follow with a macro listener
   *                                 The callback parameters must follows the same signature as a macro listener (see addMacroListener() method)
   * @param  {string}   [macroId]    Optional ID to keep track of the action if multiple steps or delay is provided.
   * @param  {Object[]} [info[]]     The next actions informations, like the first param
   */
  _callDomoticAction ({id, action, delay = 0}, callback, macroId = null, ...nextActions) {
    // Call Api for first action (or schedule it if delayed), THEN schedule next.
    // If scheduled, cannot return the state in the callback: will return an ID to register a listener.
    if (delay > 0) {
      // Delayed case: returns directly with an ID, and schedules calling itself for later.
      const that = this
      setTimeout(function () {
        that._callDomoticAction({id, action, delay: 0}, that.notifyMacroListeners.bind(that), macroId, ...nextActions)
      }, delay)
      callback(null, { id: macroId, state: 'delayed', remaining: nextActions.length })
    } else {
      let url = config.get('myfox-wrapper-api.html.myfox.paths.domotic_action').replace('{action}', action).replace('{id}', id)
      this.callApi(url, 'POST', simpleCodeActionParser(this), {}, {}, {})
        .then((parser) => {
          if (parser.status === 'ok') {
            const domotic = cloneDeep(this.persistentStates.domotic.value)
            domotic[id].supposedState = (action === 'on') ? '1' : '0'
            this.persistentStates.domotic.push(domotic)
          }
          callback(null, {
            id: macroId,
            data: parser.data,
            state: (nextActions.length > 0) ? 'progress' : 'finished',
            remaining: nextActions.length
          })
          // If still some steps after, then call in recursive way
          if (nextActions.length > 0) {
            let nextAction = nextActions.shift()
            this._callDomoticAction(nextAction, this.notifyMacroListeners.bind(this), macroId, ...nextActions)
          }
        })
        .catch((err) => {
          console.error(err)
          callback(err)
        })
    }
  }

  /**
   * Calls heating 4 orders piloted (/widget/{siteId}/heating/{action}/{id}) to turn on/eco/frost/off a heating.
   *
   * @param  {Object}   [info]       Information to trigger the event
   * @param  {integer}  info.id      The unique ID of the heating pilot to play action against
   * @param  {string}   info.action  The action to trigger. Can be on, eco, frost or off
   * @param  {integer}  info.delay   The delay (optional) to wait before triggering the action. If > 0 then the method will callback just after scheduling of the action
   * @param  {function} callback     The function to call with all data, depending on the step of the action macro: in the simplest case (one action, no delay),
   *                                 then the result of the call to Myfox. In other cases, an ID to follow with a macro listener
   *                                 The callback parameters must follows the same signature as a macro listener (see addMacroListener() method)
   * @param  {string}   [macroId]    Optional ID to keep track of the action if multiple steps or delay is provided.
   * @param  {Object[]} [info[]]     The next actions informations, like the first param
   */
  callHeatingAction ({id, action, delay = 0}, callback, macroId = undefined, ...nextActions) {
    // Validation of parameters
    const validator = Joi.object({
      id: Joi.number().integer().required().positive(),
      action: Joi.string().required().valid(['on', 'eco', 'frost', 'off']),
      delay: Joi.number().integer().min(0).optional().default(0)
    })

    Joi.assert({id, action, delay}, validator)
    // If nextActions not empty, then check structure
    for (var nextAction of nextActions) {
      Joi.assert(nextAction, validator)
    }

    // If there is a delay, or nextActions, then an ID should be returned to allow a listener to be registered.
    if (delay > 0 || nextActions.length > 0) {
      this._callHeatingAction({id, action, delay}, callback, macroId || crypto.randomBytes(20).toString('hex'), ...nextActions)
    } else {
      this._callHeatingAction({id, action, delay: 0}, callback)
    }
  }

    /**
   * Subcall of callHeatingAction() to allow recursive call, and to keep unique macro ID over all the macro steps.
   *
   * @private
   * @param  {Object}   [info]       Information to trigger the event
   * @param  {integer}  info.id      The unique ID of the heating pilot to play action against
   * @param  {string}   info.action  The action to trigger. Can be on, eco, frost or off
   * @param  {integer}  info.delay   The delay (optional) to wait before triggering the action. If > 0 then the method will callback just after scheduling of the action
   * @param  {function} callback     The function to call with all data, depending on the step of the action macro: in the simplest case (one action, no delay),
   *                                 then the result of the call to Myfox. In other cases, an ID to follow with a macro listener
   *                                 The callback parameters must follows the same signature as a macro listener (see addMacroListener() method)
   * @param  {string}   [macroId]    Optional ID to keep track of the action if multiple steps or delay is provided.
   * @param  {Object[]} [info[]]     The next actions informations, like the first param
   */
  _callHeatingAction ({id, action, delay = 0}, callback, macroId = null, ...nextActions) {
    // Call Api for first action (or schedule it if delayed), THEN schedule next.
    // If scheduled, cannot return the state in the callback: will return an ID to register a listener.
    if (delay > 0) {
      // Delayed case: returns directly with an ID, and schedules calling itself for later.
      const that = this
      setTimeout(function () {
        that._callHeatingAction({id, action, delay: 0}, that.notifyMacroListeners.bind(that), macroId, ...nextActions)
      }, delay)
      callback(null, { id: macroId, state: 'delayed', remaining: nextActions.length })
    } else {
      let url = config.get('myfox-wrapper-api.html.myfox.paths.heating_action').replace('{action}', action).replace('{id}', id)
      this.callApi(url, 'POST', simpleCodeActionParser(this), {}, {}, {})
        .then((parser) => {
          // If action succeed, then must update persistentStates
          if (parser.status === 'ok') {
            const heat = cloneDeep(this.persistentStates.heat.value)
            heat[id].state = action
            this.persistentStates.heat.push(heat)
          }
          callback(null, {
            id: macroId,
            data: parser.data,
            state: (nextActions.length > 0) ? 'progress' : 'finished',
            remaining: nextActions.length
          })
          // If still some steps after, then call in recursive way
          if (nextActions.length > 0) {
            let nextAction = nextActions.shift()
            this._callHeatingAction(nextAction, this.notifyMacroListeners.bind(this), macroId, ...nextActions)
          }
        })
        .catch((err) => {
          console.error(err)
          callback(err)
        })
    }
  }

  /**
   * Modifies the alarm level (off, half, on).
   *
   * @param  {Object}   [info]        Information to trigger the event.
   * @param  {string}   info.action   The level to trigger. Can be on, half or off.
   * @param  {string}   info.password The password, as for authentication process, only if the alarm level must be off or half.
   * @param  {function} callback      The function to call with all data, depending on the step of the action macro: in the simplest case (one action, no delay),
   *                                  then the result of the call to Myfox. In other cases, an ID to follow with a macro listener
   *                                  The callback parameters must follows the same signature as a macro listener (see addMacroListener() method).
   * @param  {string}   [macroId]     Optional ID to keep track of the action if multiple steps or delay is provided.
   */
  callAlarmLevelAction ({action, password = undefined}, callback, macroId = undefined) {
    // Validation of parameters
    const validator = Joi.object({
      action: Joi.string().required().valid(['on', 'half', 'off'])
    })
    Joi.assert({action}, validator)

    if (password || action === 'off' || action === 'half') {
      if (!password || this.accountCredentials.password !== password) {
        console.error('Given password does not match the one used for authentication.')
        return callback('Given password does not match the one used for authentication.')
      }
    }
    // Build macroId only if a delay or complex steps are added.
    // macroId = macroId || crypto.randomBytes(20).toString('hex')
    macroId = null
    const actionLevel = action === 'off' ? 1 : (action === 'half' ? 2 : (action === 'on' ? 4 : -1))
    let url = config.get('myfox-wrapper-api.html.myfox.paths.alarm_action').replace('{level}', actionLevel)

    this.callApi(url, 'POST', simpleCodeActionParser(this), {}, {}, {})
      .then((parser) => {
        // If action succeed, then must update persistentStates
        if (parser.status === 'ok') {
          this.persistentStates.alarm.push(action)
        }
        callback(null, {
          id: macroId,
          data: parser.data,
          state: 'finished',
          remaining: 0
        })
      })
      .catch((err) => {
        console.error(err)
        callback(err)
      })
  }

  /**
   * Uses edition mode to inspect a scenario and get its temperature settings (HTML strategy only)
   *
   * @param  {string}   scenarioId    The ID of the scenario to inspect. The scenario edition will not modify any parameter.
   * @param  {function} callback      The function to call with all data.
   */
  inspectScenarioTemperatureSettings (scenarioId, callback) {
    const url1 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_1').replace('{scenarioId}', scenarioId)
    const url2 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_2').replace('{scenarioId}', scenarioId)
    const url3 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_3').replace('{scenarioId}', scenarioId)
    this.callApi(url1, 'GET', step1Parser(this), {}, {}, {})
      .then((parser1) => {
        return this.callApi(url2, 'POST', step2Parser(this), {}, {}, parser1.nextPayload)
      })
      .then((parser2) => {
        return this.callApi(url3, 'POST', step3TempInspectionParser(this), {}, {}, parser2.nextPayload)
      })
      .then((parser3) => {
        callback(null, parser3.data)
      })
      .catch((err) => {
        console.error(err)
        callback(err)
      })
  }

  /**
   * Uses edition mode to inspect and modify a scenario, in order to change temperature conditions values (HTML strategy only)
   *
   * The temperature conditions are hard coded and supports 3 conditions, described by their HTML names here:
   * - trigger_4: the main trigger of the scenario: you can find it in the tabs of events that will execute the scenario
   * - condition_4_1: the first condition that you can add after the main trigger: you can find it in a list of checkable conditions.
   * - condition_4_2: the second sub-condition that appears when the condition_4_1 is already checked and set.
   *
   * @param  {string}   scenarioId    The ID of the scenario to modify. The scenario edition WILL modify parameters depending on the settings given.
   * @param  {Object[]} settings      An array of temperature values to modify, associated to the conditions to look in.
   * @param  {function} callback      The function to call with all data.
   */
  updateScenarioTemperatureSettings (scenarioId, settings, callback) {
    // Validation of parameters
    Joi.assert(scenarioId, Joi.string().required())
    const validator = Joi.array().items(Joi.object({
      toTemperature: Joi.number(),
      controls: Joi.array().items(Joi.object({
        condition: Joi.string().required().valid(['trigger_4', 'condition_4_1', 'condition_4_2']),
        deviceSlaveId: Joi.string().required(),
        checked: Joi.boolean().optional()
      }).unknown())
    }))
    Joi.assert(settings, validator)

    // Launch edition posts
    const url1 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_1').replace('{scenarioId}', scenarioId)
    const url2 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_2').replace('{scenarioId}', scenarioId)
    const url3 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_3').replace('{scenarioId}', scenarioId)
    const url4 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_4').replace('{scenarioId}', scenarioId)
    const url5 = config.get('myfox-wrapper-api.html.myfox.paths.scenario_edition_temp_5').replace('{scenarioId}', scenarioId)
    this.callApi(url1, 'GET', step1Parser(this), {}, {}, {})
      .then((parser1) => {
        return this.callApi(url2, 'POST', step2Parser(this), {}, {}, parser1.nextPayload)
      })
      .then((parser2) => {
        return this.callApi(url3, 'POST', step3TempModificationParser(this), {}, {}, parser2.nextPayload)
      })
      .then((parser3) => {
        const fixedPayload = step3TempFixer(parser3.nextPayload, settings)
        return this.callApi(url4, 'POST', step4Parser(this), {}, {}, fixedPayload)
      })
      .then((parser4) => {
        return this.callApi(url5, 'POST', step5Parser(this), {}, {}, parser4.nextPayload)
      })
      .then((parser5) => {
        callback(null, parser5.data)
      })
      .catch((err) => {
        console.error(err)
        callback(err)
      })
  }
}

// exports
export default function myfoxWrapperApiHtml (options, fallbackApi, accountCredentials) {
  return new MyfoxWrapperApiHtml(options, fallbackApi, accountCredentials)
}

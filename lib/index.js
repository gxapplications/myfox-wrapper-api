'use strict'

import Joi from 'joi'
import RestApi from './rest-api'
import HtmlApi from './html-api'
import MyfoxWrapperApiCommon from './common-api'

/**
 * Generate an Api class instance depending on the wanted strategy.
 * XXX: The strategies are not fully implemented yet. Please use htmlOnly for now.
 * 
 * Strategies:
 *  - htmlOnly: only HTML API wrapper is given. You can call only methods provided by the HTML Api version.
 *  - htmlFirst: The HTML wrapper is followd by the Rest one, to use as fallback if the called method is not implemented in the HTML version.
 *  - restFirst: The Rest wrapper is followed by the HTML one, to use as fallback if the called method is not implemented in the Reste version.
 *  - restOnly: only Rest API wrapper is given. You can call only methods provided by the Rest Api version.
 *  The htmlFirst is the default strategy.
 * 
 * @method  myfoxWrapperApi
 * @param   {object}                options                The options to configure the API wrapper. Please see MyfoxWrapperApiCommon.optionsSchema() for the valid format.
 * @param   {object}                accountCredentials     The credentials to allow API wrapper to authenticate on the Myfox API side. Only one account is allowed per API wrapper instance!
 * @return  {MyfoxWrapperApiCommon} The instance of API wrapper. Subclass depending on the given strategy.
 */
const myfoxWrapperApi = function (options, accountCredentials) {
  // merge default options given in MyfoxWrapperApiCommon; override strategy; and apply custom options
  options = Object.assign({}, MyfoxWrapperApiCommon.defaultOptions(), {apiStrategy: 'htmlFirst'}, options)
  Joi.assert(options, MyfoxWrapperApiCommon.optionsSchema())
  if (accountCredentials !== null && accountCredentials !== undefined) {
    Joi.assert(accountCredentials, MyfoxWrapperApiCommon.accountCredentialsSchema())
  }

  switch (options.apiStrategy) {
    case 'htmlOnly':
      return HtmlApi(options, null, accountCredentials)
    case 'htmlFirst':
      return HtmlApi(options, RestApi(options, null, accountCredentials), accountCredentials)
    case 'restFirst':
      return RestApi(options, HtmlApi(options, null, accountCredentials), accountCredentials)
    case 'restOnly':
      return RestApi(options, null, accountCredentials)
    default:
      throw new Error('apiStrategy option inconsistent.')
  }
}

// allow indirect access to specific wrappers
myfoxWrapperApi.rest = RestApi
myfoxWrapperApi.html = HtmlApi

// exports
export default myfoxWrapperApi

// allow direct access to specific wrappers
// only default exports from rest & html are re-exported.
export { default as Rest } from './rest-api'
export { default as Html } from './html-api'

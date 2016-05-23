'use strict'

import MyfoxWrapperApiCommon from './common-api'

class MyfoxWrapperApiRest extends MyfoxWrapperApiCommon {

}

// exports
export default function myfoxWrapperApiRest (options, fallbackApi, accountCredentials) {
  return new MyfoxWrapperApiRest(options, fallbackApi, accountCredentials)
}

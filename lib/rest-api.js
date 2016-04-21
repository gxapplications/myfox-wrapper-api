'use strict'

import MyfoxWrapperApiCommon from './common-api'

class MyfoxWrapperApiRest extends MyfoxWrapperApiCommon {

}

// exports
export default function myfoxWrapperApiRest (options, fallbackApi) {
  return new MyfoxWrapperApiRest(options, fallbackApi)
}
// export const toto = 123;

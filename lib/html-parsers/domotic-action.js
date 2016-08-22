'use strict'

import JsonStream from 'JSONStream'

/**
 * Returns a JSON parser that will expect 'code' attribute to interpret it.
 *
 * This parser understands the following values:
 * - OK, and responds with self.status = 'ok'
 * - KO, and responds with self.status = 'ko'
 * - other values triggers an 'error' event from the parser.
 *
 * @param  {MyfoxWrapperApiCommon}  wrapperApi  The Api instance, to throw events
 * @return {JsonStream}             The JsonStream parser to plug on the json stream.
 */
export default function (wrapperApi) {
  // TODO !9: Very similar (equal, in fact) to scenario-action. so maybe factorization should be right :)
  // Call https://myfox.me/widget/{siteId}/domotic/{action}/{id}', POST only, no payload
  // Receive {"code":"OK"} OR {"code":"KO","msg":[["...","error"]]}
  const parser = JsonStream.parse('code')
  parser.on('data', (data) => {
    if (data === 'KO') {
      parser.status = 'ko'
    } else if (data === 'OK') {
      parser.status = 'ok'
    } else {
      const error = new Error('Unknown format returned by Myfox.')
      error.status = 500
      parser.emit('error', error)
    }
  })
  return parser
}


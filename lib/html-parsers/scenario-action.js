'use strict'

import JsonStream from 'JSONStream'

// TODO !0: TU et docs
export default function (wrapperApi) {
  // Call https://myfox.me/widget/{siteId}/scenario/{action}/{id}', POST or GET, no payload
  // Receive {'code': "OK"} OR {"code":"KO","msg":[["...","error"]]}
  const parser = JsonStream.parse('code')
  parser.on('data', (data) => {
    if (data === 'KO') {
      parser.status = 'ko'
    } else if (data === 'OK') {
      parser.status = 'ok'
    } else {
      const error = new Error('Unknown error returned by Myfox.')
      error.status = 500
      parser.emit('error', error)
    }
  })
  return parser
}


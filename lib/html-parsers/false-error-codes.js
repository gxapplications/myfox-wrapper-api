'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText } from './index'
import JsonStream from 'JSONStream'

// Myfox page not found is a code 200... must fix it!
const notFound200 = function () {
  const parser = trumpet()
  parser.select('head title', trumpetInnerText((data) => {
    parser.status = 200
    if (data.indexOf('Page not found') !== -1) {
      parser.status = 404
      const error = new Error('Page not found case returned by Myfox.')
      error.status = 404
      return parser.emit('error', error)
    }
  }))
  return parser
}

// Myfox code KO is a code 200... must fix it and return error messages.
const codeKo200 = function () {
  const parser = JsonStream.parse('code')
  parser.on('data', (data) => {
    if (data === 'KO') {
      const error = new Error('Code KO returned by Myfox.')
      error.status = 400
      return parser.emit('error', error)
    }
  })
  return parser
}

export { notFound200 as notFound200 }
export { codeKo200 as codeKo200 }

'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText } from './index'
import JsonStream from 'JSONStream'

// Myfox page not found is a code 200... must fix it!
const notFound200 = trumpet()
notFound200.select('head title', trumpetInnerText((data) => {
  notFound200.status = 200
  if (data.indexOf('Page not found') !== -1) {
    notFound200.status = 404
    const error = new Error('Page not found case returned by Myfox.')
    error.status = 404
    return notFound200.emit('error', error)
  }
}))

// Myfox code KO is a code 200... must fix it and return error messages.
const codeKo200 = JsonStream.parse('code')
codeKo200.on('data', (data) => {
  if (data === 'KO') {
    const error = new Error('Code KO returned by Myfopx.')
    error.status = 400
    return codeKo200.emit('error', error)
  }
})

export { notFound200 as notFound200 }
export { codeKo200 as codeKo200 }

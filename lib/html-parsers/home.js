'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText } from './index'

export default function () {
  const trumpetParser = trumpet()
  trumpetParser.status = {}

  // Master status
  trumpetParser.selectAll('div#masterStatus > a > span.icon', (span) => {
    span.getAttribute('class', (classes) => {
      let matches = null
      let key = null
      let value = null
      classes.split(' ').forEach((element) => {
        matches = element.match(/icon-(.+)/i)
        if (matches && matches.length > 0) {
          key = key || matches[1]
        }
        matches = element.match(/level-([0-9]+)/i)
        if (matches && matches.length > 0) {
          value = value || matches[1]
        }
      })
      if (key !== null && value !== null) {
        trumpetParser.status[key] = value
      }
    })
  })

  // User / site info
  trumpetParser.select('div#userPanel span.site > a', trumpetInnerText((siteName) => {
    trumpetParser['siteName'] = siteName
  }))

  // End of parsing, no need to go further
  trumpetParser.selectAll('footer', () => {
    console.log('######', 'The END')
    trumpetParser.end()
    // TODO !1: test, et va-t-on plus loin dans le flux ?
  })

  return trumpetParser
}

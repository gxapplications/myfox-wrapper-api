'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText } from './index'

export default function () {
  const trumpetParser = trumpet()

  // Master status
  trumpetParser.selectAll('div#masterStatus > a > span.icon', (span) => {
    span.getAttribute('class', (classes) => {
      console.log("### div#masterStatus ###", classes)
      // TODO !0
    })
  })

  // User / site info
  trumpetParser.select('div#userPanel span.site > a', trumpetInnerText((siteName) => {
    console.log("### div#userPanel site name ###", siteName)
    // TODO !0
  }))


  // End of parsing, no need to go further
  trumpetParser.selectAll('footer', () => {
    trumpetParser.end()
    // TODO !1: test, et va-t-on plus loin dans le flux ?
  })

  return trumpetParser
}

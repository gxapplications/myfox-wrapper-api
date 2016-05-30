'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText, trumpetClasses } from './index'

// TODO !3: doc et TU
export default function (wrapperApi) {
  const trumpetParser = trumpet()
  trumpetParser.status = {}

  // Master status
  trumpetParser.selectAll('div#masterStatus > a > span.icon', trumpetClasses((classes) => {
    let matches = null
    let key = null
    let value = null
    classes.forEach((element) => {
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
  }))

  // User / site info
  trumpetParser.select('div#userPanel span.site > a', trumpetInnerText((siteName) => {
    trumpetParser['siteName'] = siteName
  }))

  // Alarm status
  trumpetParser.select('div#dashboard div.widget-protection div#slider_zone', trumpetClasses((classes) => {
    if (classes.indexOf('seclev2') !== -1) {
        // ici, protect intermediaire
    }
    // TODO !0: aura une classe 'seclevX'
    console.log("======", classes)

    // TODO !0: if level CHANGED, then triggers an event! compare from wrapperApi.persistentStates.alarm.push(...)
  }))

  // TODO !4: all others to parse!

  // End of parsing, no need to go further
  trumpetParser.selectAll('footer', () => {
    wrapperApi.persistentStates.status.push(trumpetParser.status)
    trumpetParser.end()
  })

  return trumpetParser
}

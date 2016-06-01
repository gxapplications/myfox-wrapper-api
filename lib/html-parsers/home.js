'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText, trumpetClasses } from './index'

// TODO !2: TU
/**
 * Returns a trumpet parser with multiple selectors and events to parse all data present on the /home/<siteId> page.
 *
 * Can throw event on the following persistent states:
 * - alarm (when the alarm level changed)
 * - status (when the box status changed, or at least one of its 3 sub elements)
 *
 * @param  {MyfoxWrapperApiCommon}  wrapperApi  The Api instance, to throw events
 * @return {trumpet}                The trumpet parser to plug on the HTML stream.
 */
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
    if (classes.indexOf('seclev1') !== -1) {
      trumpetParser.alarm = 'off'
    } else if (classes.indexOf('seclev2') !== -1) {
      trumpetParser.alarm = 'half'
    } else if (classes.indexOf('seclev4') !== -1) {
      trumpetParser.alarm = 'full'
    }
    wrapperApi.persistentStates.alarm.push(trumpetParser.alarm)
  }))

  // TODO !1: all others to parse: cameras?, scenarii (whole list, activated or not, with actions URLs), domotic equip (whole list, with actions URLs), data states (lumino, temp only, with ids or urls?), NO HISTORY (only 5 items), heat (whole list with state and actions URLs)

  // End of parsing, no need to go further
  trumpetParser.selectAll('footer', () => {
    wrapperApi.persistentStates.status.push(trumpetParser.status)
    trumpetParser.end()
  })

  return trumpetParser
}

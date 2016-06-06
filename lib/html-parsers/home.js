'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText, trumpetClasses, trumpetAttr } from './index'

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
  trumpetParser.setMaxListeners(32) // We have a lot of stuff to analyze...
  trumpetParser.status = {}
  trumpetParser.scenarii = {}
  trumpetParser.domotic = {}

  let temp = {
    'scenarioNames': [],
    'scenariosIds': [],
    'domoticNames': []
  }

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

  // Cameras (XXX, I have no cam to try)
  // trumpetParser.select('div#camera-widget-body > table.list', trumpetInnerText((camerasToParse) => {
  // }))

  // Scenarii
  trumpetParser.selectAll('div#scenario_list > table.list tr span.text', trumpetInnerText((scenarioName) => {
    temp.scenarioNames.push(scenarioName)
  })) // To retrieve scenario name
  // trumpetParser.selectAll('div#scenario_list > table.list tr span.icon', trumpetClasses((scenarioTypeClasses) => {
    // XXX retrieve class 'icon-scenariotype-X' and store X (==type!)
  // })) // To retrieve scenario type
  trumpetParser.selectAll('div#scenario_list > table.list tr a.btn-play', trumpetAttr('href', (url) => {
    let id = url.split('/').pop()
    trumpetParser.scenarii[id] = {'type': 1, 'name': temp.scenarioNames.shift()}
  })) // To retrieve action URL (then, type==1)
  trumpetParser.selectAll('div#scenario_list > table.list tr span[data-value="0"]', trumpetAttr('data-call', (url) => {
    temp.scenariosIds.push(url.split('/').pop())
  })) // To retrieve action URL (then, type>1)
  trumpetParser.selectAll('div#scenario_list > table.list tr input', trumpetAttr('value', (active) => {
    trumpetParser.scenarii[temp.scenariosIds.shift()] = {'type': '>1', 'name': temp.scenarioNames.shift(), 'active': active}
  })) // To retrieve state value

  // Domotic stuff
  trumpetParser.selectAll('div#domotic_list > table.list tr span.text', trumpetInnerText((domoticName) => {
    temp.domoticNames.push(domoticName)
  })) // To retrieve domotic stuff name
  // TODO !0: le reste pour domotic: ID. +toujours ON/OFF ou plusieurs types ?

  // Data modules (temp, light)
  trumpetParser.selectAll('div#data_list > table.list tr', trumpetInnerText((dataLine) => {
    // TODO !1: une TD contenant le nom, l'autre TD contenant les 2 états et l'ID
  }))

  // Heat modules
  trumpetParser.selectAll('div#heating_list > table.list tr', trumpetInnerText((dataLine) => {
    // TODO !1: une TD contenant le nom, l'autre TD contenant les 2 états et l'ID
  }))

  // End of parsing, no need to go further
  trumpetParser.selectAll('footer', () => {
    wrapperApi.persistentStates.status.push(trumpetParser.status)
    wrapperApi.persistentStates.scenarii.push(trumpetParser.scenarii)
    // wrapperApi.persistentStates.domotic.push(trumpetParser.domotic) // No dynamic behavior, so should not be required...

    trumpetParser.end()
  })

  return trumpetParser
}

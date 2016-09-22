'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText, trumpetClasses, trumpetAttr } from './index'

/**
 * Returns a trumpet parser with multiple selectors and events to parse all data present on the /home/<siteId> page.
 *
 * Can throw event on the following persistent states:
 * - alarm (when the alarm level changed)
 * - status (when the box status changed, or at least one of its 3 sub elements)
 * - scenarii (name, ID, type, state). For now, type === "1" or type === ">1"
 * - domotic stuff (name, ID)
 * - data modules (name, ID, temperature, light). for now, just literals values (in your language...)
 * - heat modules (name, ID, state)
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
  trumpetParser.data = {}
  trumpetParser.heat = {}

  let temp = {
    'scenarioNames': [],
    'scenariosIds': [],
    'domoticNames': [],
    'dataNames': [],
    'dataTemperatures': [],
    'dataIds': [],
    'heatIds': [],
    'heatNames': []
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
  trumpetParser.selectAll('div#domotic_list > table.list tr span.buttons > span + span', trumpetAttr('data-call', (url) => {
    trumpetParser.domotic[url.split('/').pop()] = {'name': temp.domoticNames.shift()}
  })) // To retrieve action URL

  // Data modules (temp, light)
  trumpetParser.selectAll('div#data_list > table.list tr', trumpetAttr('data-href', (url) => {
    temp.dataIds.push(url.split('/').pop())
  }))
  trumpetParser.selectAll('div#data_list > table.list tr span.text', trumpetInnerText((dataName) => {
    temp.dataNames.push(dataName)
  })) // To retrieve data module name
  trumpetParser.selectAll('div#data_list > table.list tr span.temperature', trumpetInnerText((temperature) => {
    temp.dataTemperatures.push(temperature)
  })) // To retrieve temperature
  trumpetParser.selectAll('div#data_list > table.list tr span.light', trumpetInnerText((light) => {
    trumpetParser.data[temp.dataIds.shift()] = {'name': temp.dataNames.shift(), 'temperature': temp.dataTemperatures.shift(), 'light': light}
  }))

  // Heat modules
  trumpetParser.selectAll('div#heating_list > table.list tr span.text', trumpetInnerText((heatName) => {
    temp.heatNames.push(heatName)
  })) // To retrieve heat module name
  trumpetParser.selectAll('div#heating_list > table.list tr span.buttons > span[data-value="1"]', trumpetAttr('data-call', (url) => {
    temp.heatIds.push(url.split('/').pop())
  })) // To retrieve action URL
  trumpetParser.selectAll('div#heating_list > table.list tr span.buttons > span[data-value="2"]', trumpetClasses((classes) => {
    let state = ''
    if (classes.indexOf('active-1') !== -1) {
      state = 'on'
    } else if (classes.indexOf('active-2') !== -1) {
      state = 'eco'
    } else if (classes.indexOf('active-4') !== -1) {
      state = 'frost'
    } else if (classes.indexOf('active-3') !== -1) {
      state = 'off'
    }
    trumpetParser.heat[temp.heatIds.shift()] = {'name': temp.heatNames.shift(), 'state': state}
  })) // To retrieve state value

  // End of parsing, no need to go further
  trumpetParser.selectAll('footer', () => {
    wrapperApi.persistentStates.status.push(trumpetParser.status)
    wrapperApi.persistentStates.scenarii.push(trumpetParser.scenarii)

    // If a supposedState was added to the domotic element, then keep it. GET /home does not modify domotic states.
    for (let key in trumpetParser.domotic) {
      if (wrapperApi.persistentStates.domotic && wrapperApi.persistentStates.domotic.value &&
          wrapperApi.persistentStates.domotic.value[key].supposedState) {
        trumpetParser.domotic[key].supposedState = wrapperApi.persistentStates.domotic.value[key].supposedState
      }
    }
    wrapperApi.persistentStates.domotic.push(trumpetParser.domotic)

    wrapperApi.persistentStates.data.push(trumpetParser.data)
    wrapperApi.persistentStates.heat.push(trumpetParser.heat)
    trumpetParser.end()
  })

  return trumpetParser
}

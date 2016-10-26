'use strict'

import trumpet from 'trumpet'
import { trumpetAttr, trumpetInnerText, trumpetAffectValue } from './index'

/**
 * Returns a trumpet parser that will get input values to go to the next edition step.
 *
 * GET https://myfox.me/scenario/{homeId}/manage/{scenarioId}/1
 * => <form id="scenarioForm" action="https://myfox.me/scenario/xxxx/manage/xxxx/2" method="post">
 *      <input type="hidden" name="scData" value="xxxx" />
 *      <input type="text" name="label" id="scenarioLabel" value="xxxxx" maxlength="30" autocomplete="off" />
 *    </form>
 *
 * @param  {MyfoxWrapperApiCommon}  wrapperApi  The Api instance, to throw events
 * @return {trumpet}                The trumpet parser to plug on the HTML stream.
 */
export function step1Parser (wrapperApi) {
  const trumpetParser = trumpet()
  trumpetParser.nextPayload = {}

  // get scData
  trumpetParser.select('form#scenarioForm input[name="scData"]', trumpetAttr('value', (value) => {
    trumpetParser.nextPayload.scData = value
  }))
  // get label
  trumpetParser.select('form#scenarioForm input[name="label"]', trumpetAttr('value', (value) => {
    trumpetParser.nextPayload.label = value
  }))

  // input submit (button) means end of the parsing
  trumpetParser.select('form#scenarioForm input[type="submit"]', () => {
    if (!trumpetParser.nextPayload.scData || !trumpetParser.nextPayload.label) {
      const error = new Error('Scenario edition failed at step 1. Step 1 form not found.')
      error.status = 404
      return trumpetParser.emit('error', error)
    }
    trumpetParser.end()
  })

  return trumpetParser
}

/**
 * Returns a trumpet parser that will get input values to go to the next edition step.
 *
 * POST https://myfox.me/scenario/{homeId}/manage/{scenarioId}/2
 *    with scData: "xxxx"
 *         label: "xxxxx"
 * => <form id="scenarioForm" action="https://myfox.me/scenario/xxxx/manage/xxxx/3" method="post">
 *      <input type="hidden" name="scData" value="xxxx" />
 *      <input type="hidden" id="scenarioType" name="type" value="xxxx" />
 *    </form>
 *
 * @param  {MyfoxWrapperApiCommon}  wrapperApi  The Api instance, to throw events
 * @return {trumpet}                The trumpet parser to plug on the HTML stream.
 */
export function step2Parser (wrapperApi) {
  const trumpetParser = trumpet()
  trumpetParser.nextPayload = {}

  // get scData
  trumpetParser.select('form#scenarioForm input[name="scData"]', trumpetAttr('value', (value) => {
    trumpetParser.nextPayload.scData = value
  }))
  // get label
  trumpetParser.select('form#scenarioForm input[name="type"]', trumpetAttr('value', (value) => {
    trumpetParser.nextPayload.type = value
  }))

  // input submit (button) means end of the parsing
  trumpetParser.select('form#scenarioForm input[type="submit"]', () => {
    if (!trumpetParser.nextPayload.scData || !trumpetParser.nextPayload.type) {
      const error = new Error('Scenario edition failed at step 2. Step 2 form not found.')
      error.status = 404
      return trumpetParser.emit('error', error)
    }
    trumpetParser.end()
  })

  return trumpetParser
}

/**
 * Returns a trumpet parser that will inspect form structure searching for temperature condition occurrences.
 *
 * POST https://myfox.me/scenario/{homeId}/manage/{scenarioId}/3
 *    with scData: "xxxx"
 *         type: "xxxx"
 * => <form id="scenarioForm" action="https://myfox.me/scenario/xxxx/manage/xxxx/4" method="post">
 *      <input type="hidden" name="scData" value="xxxx" />
 *      <inputs ...>  (not needed here)
 *      <div class="tab-content tab-sensors">
 *        <input type="radio" name="_trigger_type" value="4" checked="checked" />   (if checked, keep condition)
 *        <div class="settings-tooltip" id="_trigger_4">
 *          <div class="settings temperature">
 *            <select name="_trigger[4][1][deviceSlaveId]"><option value="xxxx" selected="selected">Capteur SdB</option><option value="xxxx">Capteur Salon</option></select>
 *            <input name="_trigger[4][1][value]" value="15" type="text" class="" />
 *            <input type="radio" name="_trigger[4][1][operator]" value="1" checked="checked" /> (à la hausse)
 *            <input type="radio" name="_trigger[4][1][operator]" value="0" /> (à la baisse)
 *          </div>
 *        </div>
 *      </div>
 *      <div class="conditions">
 *        <div class="condition condition-4 option-block" data-triggertype="4">
 *          <input type="checkbox" name="_condition_4_1" value="4" />
 *          <span>Si la température...</span>
 *        </div>
 *        <div class="condition-inputs choice-4-1">
 *          ... du capteur 	<select name="_condition[4][1][deviceSlaveId]">
 *            <option value="xxxx">Capteur SdB</option>
 *            <option value="xxxx" selected="selected">Capteur Salon</option>
 *          </select> est 	<select name="_condition[4][1][operator]">
 *            <option value="0" selected="selected"><</option>
 *            <option value="1">></option>
 *            <option value="2">=</option>
 *          </select> à <input name="_condition[4][1][value]" value="16" type="text" class="" /> °C
 *        </div>
 *        <div class="condition choice-4-2">
 *          <input type="checkbox" name="_condition_4_2" value="4" />
 *          <span>Et si la température...</span>
 *        </div>
 *        <div class="item condition-inputs">
 *          ... du capteur 	<select name="_condition[4][2][deviceSlaveId]">
 *            <option value="xxxx">Capteur SdB</option>
 *            <option value="xxxx" selected="selected">Capteur Salon</option>
 *          </select> est 	<select name="_condition[4][2][operator]">
 *            <option value="0"><</option>
 *            <option value="1" selected="selected">></option>
 *            <option value="2">=</option>
 *          </select> à <input name="_condition[4][2][value]" value="14" type="text" class="" /> °C
 *        </div>
 *      </div>
 *    </form>
 *
 * @param  {MyfoxWrapperApiCommon}  wrapperApi  The Api instance, to throw events
 * @return {trumpet}                The trumpet parser to plug on the HTML stream.
 */
export function step3TempInspectionParser (wrapperApi) {
  const trumpetParser = trumpet()
  trumpetParser.data = {}
  trumpetParser.setMaxListeners(14) // We have a lot of stuff to analyze...

  // if input type="radio" name="_trigger_type" value="4" has checked="checked", then scan main temperature condition
  trumpetParser.select('form#scenarioForm input[name="_trigger_type"][value="4"][checked="checked"]', (element) => {
    trumpetParser.data.trigger_4 = {}

    // get scenario
    trumpetParser.select(
      'form#scenarioForm select[name="_trigger[4][1][deviceSlaveId]"] option[selected="selected"]',
      trumpetAttr('value', (value) => {
        trumpetParser.data.trigger_4 = {deviceSlaveId: value}
      })
    )
    trumpetParser.select(
      'form#scenarioForm select[name="_trigger[4][1][deviceSlaveId]"] option[selected="selected"]',
      trumpetInnerText((text) => {
        trumpetParser.data.trigger_4.deviceSlaveName = text
      })
    )

    // get temperature value
    trumpetParser.select(
      'form#scenarioForm input[name="_trigger[4][1][value]"]',
      trumpetAttr('value', (value) => {
        trumpetParser.data.trigger_4.value = value
      })
    )

    // get operator
    trumpetParser.select(
      'form#scenarioForm input[name="_trigger[4][1][operator]"][checked="checked"]',
      trumpetAttr('value', (value) => {
        trumpetParser.data.trigger_4.operator = value
      })
    )
  })

  // First secondary condition
  trumpetParser.select(
    'div.conditions div.choice-4-1 select[name="_condition[4][1][deviceSlaveId]"] option[selected="selected"]',
    trumpetAttr('value', (value) => {
      trumpetParser.data.condition_4_1 = {deviceSlaveId: value}
    })
  )
  trumpetParser.select(
    'div.conditions div.choice-4-1 select[name="_condition[4][1][deviceSlaveId]"] option[selected="selected"]',
    trumpetInnerText((text) => {
      trumpetParser.data.condition_4_1.deviceSlaveName = text
    })
  )
  trumpetParser.select(
    'div.conditions div.choice-4-1 select[name="_condition[4][1][operator]"] option[selected="selected"]',
    trumpetAttr('value', (value) => {
      if (trumpetParser.data.condition_4_1) {
        trumpetParser.data.condition_4_1.operator = value
      }
    })
  )
  trumpetParser.select(
    'div.conditions div.choice-4-1 input[name="_condition[4][1][value]"]',
    trumpetAttr('value', (value) => {
      if (trumpetParser.data.condition_4_1) {
        trumpetParser.data.condition_4_1.value = value
      }
    })
  )

  // Second secondary condition
  trumpetParser.select(
    'div.conditions div.item.condition-inputs select[name="_condition[4][2][deviceSlaveId]"] option[selected="selected"]',
    trumpetAttr('value', (value) => {
      trumpetParser.data.condition_4_2 = {deviceSlaveId: value}
    })
  )
  trumpetParser.select(
    'div.conditions div.item.condition-inputs select[name="_condition[4][2][deviceSlaveId]"] option[selected="selected"]',
    trumpetInnerText((text) => {
      trumpetParser.data.condition_4_2.deviceSlaveName = text
    })
  )
  trumpetParser.select(
    'div.conditions div.item.condition-inputs select[name="_condition[4][2][operator]"] option[selected="selected"]',
    trumpetAttr('value', (value) => {
      if (trumpetParser.data.condition_4_2) {
        trumpetParser.data.condition_4_2.operator = value
      }
    })
  )
  trumpetParser.select(
    'div.conditions div.item.condition-inputs input[name="_condition[4][2][value]"]',
    trumpetAttr('value', (value) => {
      if (trumpetParser.data.condition_4_2) {
        trumpetParser.data.condition_4_2.value = value
      }
    })
  )

  return trumpetParser
}

/**
 * Returns a trumpet parser that will inspect and modify form structure searching for temperature condition occurrences.
 *
 * POST https://myfox.me/scenario/{homeId}/manage/{scenarioId}/3
 *    with scData: "xxxx"
 *         type: "xxxx"
 * => <form id="scenarioForm" action="https://myfox.me/scenario/xxx/manage/xxxxxx/4" method="post">
 *      <input type="hidden" name="scData" value="xxxxx" />
 *      <h2>...</h2>
 *      <div class="tabs-list">...</div>
 *      <div class="tabs-contents">
 *
 *        <div class="tab-content tab-securityLevel">
 *          <div class="item security-level">
 *            <ul class="...">
 *              <li class="seclev-4">
 *                <span ...><span ...>
 *                  <input type="checkbox" name="_trigger[3][4]" value="1" />
 *                </span></span>
 *              </li>
 *              <li class="seclev-2">
 *                <span ...><span ...>
 *                  <input type="checkbox" name="_trigger[3][2]" value="1" />
 *                </span></span>
 *              </li>
 *              <li class="seclev-1">
 *                <span ...><span ...>
 *                  <input type="checkbox" name="_trigger[3][1]" value="1" />
 *                </span></span>
 *              </li>
 *            </ul>
 *          </div>
 *        </div>
 *
 *        <div class="tab-content tab-risks">
 *          <div class="item">
 *            <ul class="reset">
 *              <li class="risk-10 option-block">
 *                <span ...><span ...>
 *                    <input type="radio" name="_trigger[2]" value="10" />
 *                </span></span>
 *              </li>
 *              <li class="risk-16 option-block">
 *                <span ...><span ...>
 *                  <input type="radio" name="_trigger[2]" value="16" />
 *                </span></span>
 *              </li>
 *              <li class="risk-4 option-block">
 *                <span ...><span ...>
 *                  <input type="radio" name="_trigger[2]" value="4" />
 *                </span></span>
 *              </li>
 *              <li class="risk-512 option-block">
 *                <span ...><span ...>
 *                  <input type="radio" name="_trigger[2]" value="512" />
 *                </span></span>
 *              </li>
 *              <li class="risk-2048 option-block">
 *                <span ...><span ...>
 *                  <input type="radio" name="_trigger[2]" value="2048" />
 *                </span></span>
 *              </li>
 *            </ul>
 *          </div>
 *        </div>
 *
 *        <div class="tab-content tab-sensors"><div class="item">
 *          <ul class="reset">
 *            <li class="sensors sensors-4 option-block" data-triggertype="4">
 *              <div class="choice">
 *                <span ...><span ...>
 *                  <input type="radio" name="_trigger_type" value="4" checked="checked" />
 *                </span></span>
 *              </div>
 *              <div class="settings-tooltip" id="_trigger_4">
 *                <div class="settings-tooltip-body">
 *                  <div class="settings temperature">
 *                      <table>
 *                        <tr><td>Capteur</td><td>
 *                          <select name="_trigger[4][1][deviceSlaveId]">
 *                            <option value="xxxxxx" selected="selected">Capteur SdB</option><option value="xxxxxx">Capteur Salon</option>
 *                          </select>
 *                        </td></tr><tr><td>Température</td><td><span class="input input-temperature">
 *                          <input name="_trigger[4][1][value]" value="15" type="text" class="" />
 *                        </span> °C	</td></tr><tr><td>Franchissement</td><td><span class="input-radio " data-default="1" data-group="_trigger_4__1__operator_" data-cancel="0">
 *                          <span class="icon">
 *                            <input type="radio" name="_trigger[4][1][operator]" value="1" checked="checked" />
 *                          </span>
 *                        </span> à la hausse &nbsp; &nbsp; <span class="input-radio " data-default="1" data-group="_trigger_4__1__operator_" data-cancel="0">
 *                          <span class="icon">
 *                            <input type="radio" name="_trigger[4][1][operator]" value="0" />
 *                          </span>
 *                        </span> à la baisse </td></tr>
 *                      </table>
 *                  </div>
 *                </div><!-- End tooltip body -->
 *              </div>
 *            </li>
 *            <li class="sensors sensors-5 option-block" data-triggertype="5">
 *              <div class="choice">
 *                <span class="input-radio trigger-choice" data-default="" data-group="_trigger_type" data-cancel="1"><span class="icon">
 *                  <input type="radio" name="_trigger_type" value="5" />
 *                </span></span>
 *              </div>
 *              <div class="settings-tooltip" id="_trigger_5">
 *                <div class="settings-tooltip-body">
 *                  <div class="settings light">
 *                      <table>
 *                        <tr><td>Capteur</td><td>
 *                        <select name="_trigger[5][1][deviceSlaveId]"><option value="xxxxxx">Capteur SdB</option><option value="xxxxxxx">Capteur Salon</option></select>
 *                        </td></tr><tr><td>Luminosité</td><td>
 *                          <select name="_trigger[5][1][value]">
 *                            <option value="1">Pleine lumière</option>
 *                            <option value="2">Lumière du jour</option>
 *                            <option value="4">Lumière basse</option>
 *                            <option value="5">Pénombre</option>
 *                            <option value="6">Obscurité</option>
 *                          </select>
 *                        </td></tr><tr><td>Franchissement</td><td><span class="input-radio " data-default="1" data-group="_trigger_5__1__operator_" data-cancel="0"><span class="icon">
 *                          <input type="radio" name="_trigger[5][1][operator]" value="1" checked="checked" />
 *                        </span></span> à la hausse &nbsp; &nbsp; <span class="input-radio " data-default="1" data-group="_trigger_5__1__operator_" data-cancel="0"><span class="icon">
 *                          <input type="radio" name="_trigger[5][1][operator]" value="0" />
 *                        </span></span> à la baisse </td></tr>
 *                      </table>
 *                  </div>
 *                </div><!-- End tooltip body -->
 *              </div>
 *            </li>
 *            <li class="sensors sensors-7 option-block" data-triggertype="7">
 *              <div class="choice">
 *                <span class="input-radio trigger-choice" data-default="" data-group="_trigger_type" data-cancel="1"><span class="icon">
 *                  <input type="radio" name="_trigger_type" value="7" />
 *                </span></span>
 *              </div>
 *              <div class="settings-tooltip" id="_trigger_7">
 *                <div class="settings-tooltip-body">
 *                  <div class="settings device">
 *                      <table>
 *                      <tr><td>Capteur</td><td>
 *                      <select name="_trigger[7]">
 *                        <option value="xxx">Porte d'entrée</option>
 *                        <option value="xxxx">Mouvement garage</option>
 *                        <option value="xxxx">Fenêtre salon</option>
 *                        <option value="xxxx">Mouvement salon</option>
 *                        <option value="xx">Porte du garage</option>
 *                      </select>
 *                      </td></tr>
 *                      </table>
 *                  </div>
 *                </div><!-- End tooltip body -->
 *              </div>
 *            </li>
 *          </ul>
 *        </div>
 *
 *      </div>
 *
 *      <div class="form-buttons collapse">
 *        <a href="#" class="btn-nextStep" >
 *          <input type="submit" name="sbt" value="Étape suivante" /><span class="text">Étape suivante</span>
 *        </a>
 *      </div>
 *
 *      <h2>Choisissez des conditions facultatives</h2>
 *      <div class="conditions">
 *
 *        <div class="condition condition-3 option-block" data-triggertype="3">
 *          <div class="title">
 *            <span class="input-checkbox condition-choice condition-3-choice" data-default=""><span class="icon">
 *              <input type="checkbox" name="_condition_3" value="3" />
 *            </span></span>
 *          </div>
 *          <div class="item condition-inputs security-level">
 *            <ul class="reset">
 *              <li class="seclev-4">
 *                <span class="input-radio " data-default="" data-group="trigger-3" data-cancel="1"><span class="icon">
 *                  <input type="radio" name="_condition[3][4]" value="1" />
 *                </span></span>
 *              </li>
 *              <li class="seclev-2">
 *                <span class="input-radio " data-default="" data-group="trigger-3" data-cancel="1"><span class="icon">
 *                  <input type="radio" name="_condition[3][2]" value="1" />
 *                </span></span>
 *              </li>
 *              <li class="seclev-1">
 *                <span class="input-radio " data-default="" data-group="trigger-3" data-cancel="1"><span class="icon">
 *                  <input type="radio" name="_condition[3][1]" value="1" />
 *                </span></span>
 *              </li>
 *            </ul>
 *          </div>
 *        </div>
 *
 *        <div class="condition condition-1 option-block" data-triggertype="1">
 *          <div class="title">
 *            <span class="input-checkbox condition-choice condition-1-choice" data-default=""><span class="icon">
 *              <input type="checkbox" name="_condition_1" value="1" />
 *            </span></span>
 *          </div>
 *          <div class="item condition-inputs">
 *            <div class="scenario-schedule scenario-schedule-range" data-field="scheduleRule">
 *              <table>...</table>
 *              <div class="ws-prompt input-disabled">
 *                <div class="ws-prompt-inner">
 *                  <div class="ws-prompt-row">
 *                      <table>
 *                        <tr><th><label for="schedule1">Heure de début</label></th><td><span class="input input-time" id="input-schedule1"><span class="icon"></span>
 *                          <input id="schedule1" name="time1" class="ws-prompt-time" placeholder="HH:mm" type="text" />
 *                        </span></td></tr><tr><th><label for="schedule2">Heure de fin</label></th><td><span class="input input-time" id="input-schedule2"><span class="icon"></span>
 *                          <input id="schedule2" name="time2" class="ws-prompt-time" placeholder="HH:mm" type="text" />
 *                        </span></td></tr>
 *                      </table>
 *                  </div>
 *                  <input type="hidden" name="day" />
 *                  <input type="hidden" name="idx" />
 *                </div>
 *              </div>
 *              <input type="hidden" name="_condition[1]" id="scheduleRule" value="" />
 *            </div>
 *          </div>
 *        </div>
 *
 *        <div class="condition condition-4 option-block" data-triggertype="4">
 *          <div class="title">
 *            <span class="input-checkbox condition-choice condition-Limited 4-1" data-default="4"><span class="icon">
 *              <input type="checkbox" name="_condition_4_1" value="4" />
 *            </span></span>
 *            <span>Si la température...</span>
 *          </div>
 *          <div class="item">
 *            <div class="condition-inputs choice-4-1">... du capteur
 *              <select name="_condition[4][1][deviceSlaveId]">
 *                <option value="xxx">Capteur SdB</option>
 *                <option value="xxx" selected="selected">Capteur Salon</option>
 *              </select>
 *              <select name="_condition[4][1][operator]">
 *                <option value="0" selected="selected"><</option>
 *                <option value="1">></option>
 *                <option value="2">=</option>
 *              </select>
 *              à <span class="input input-temperature">
 *                <input name="_condition[4][1][value]" value="16" type="text" class="" />
 *              </span>°C.
 *            </div>
 *            <div class="condition choice-4-2">
 *              <div class="title">
 *                <span class="input-checkbox condition-choice condition-Limited 4-2" data-default="4"><span class="icon">
 *                  <input type="checkbox" name="_condition_4_2" value="4" />
 *                </span></span>
 *                <span>Et si la température...</span>
 *              </div>
 *              <div class="item condition-inputs">... du capteur
 *                <select name="_condition[4][2][deviceSlaveId]">
 *                  <option value="xxx">Capteur SdB</option>
 *                  <option value="xxx" selected="selected">Capteur Salon</option>
 *                </select>
 *                <select name="_condition[4][2][operator]">
 *                  <option value="0"><</option>
 *                  <option value="1" selected="selected">></option>
 *                  <option value="2">=</option>
 *                </select>
 *                à <span class="input input-temperature">
 *                  <input name="_condition[4][2][value]" value="14" type="text" class="" />
 *                </span>°C.
 *              </div>
 *            </div>
 *          </div>
 *        </div>
 *
 *        <div class="condition condition-5 option-block" data-triggertype="5">
 *          <div class="title">
 *            <span class="input-checkbox condition-choice condition-Limited 5-1" data-default=""><span class="icon">
 *              <input type="checkbox" name="_condition_5_1" value="5" />
 *            </span></span>
 *            <span>Si la luminosité...</span>
 *          </div>
 *          <div class="item">
 *            <div class="condition-inputs choice-5-1"> ... du capteur
 *              <select name="_condition[5][1][deviceSlaveId]">
 *                <option value="xxx">Capteur SdB</option>
 *                <option value="xxx">Capteur Salon</option>
 *              </select>
 *              <select name="_condition[5][1][operator]">
 *                <option value="0" selected="selected"><</option>
 *                <option value="1">></option>
 *                <option value="2">=</option>
 *              </select>
 *              <select name="_condition[5][1][value]">
 *                <option value="1">Pleine lumière</option>
 *                <option value="2">Lumière du jour</option>
 *                <option value="4">Lumière basse</option>
 *                <option value="5">Pénombre</option>
 *                <option value="6">Obscurité</option>
 *              </select>
 *            </div>
 *            <div class="condition choice-5-2">
 *              <div class="title">
 *                <span class="input-checkbox condition-choice condition-Limited 5-2" data-default=""><span class="icon">
 *                  <input type="checkbox" name="_condition_5_2" value="5" />
 *                </span></span>
 *              </div>
 *              <div class="item condition-inputs"> ... du capteur
 *                <select name="_condition[5][2][deviceSlaveId]">
 *                  <option value="xxx">Capteur SdB</option>
 *                  <option value="xxx">Capteur Salon</option>
 *                </select>
 *                <select name="_condition[5][2][operator]">
 *                  <option value="0" selected="selected"><</option>
 *                  <option value="1">></option>
 *                  <option value="2">=</option>
 *                </select>
 *                <select name="_condition[5][2][value]">
 *                  <option value="1">Pleine lumière</option>
 *                  <option value="2">Lumière du jour</option>
 *                  <option value="4">Lumière basse</option>
 *                  <option value="5">Pénombre</option>
 *                  <option value="6">Obscurité</option>
 *                </select>
 *              </div>
 *            </div>
 *          </div>
 *        </div>
 *
 *      </div>
 *
 *      <div class="form-buttons">
 *        <input type="submit" name="sbt" value="Étape suivante" />
 *      </div>
 *    </form>
 *
 * =======================================
 * Form elements are classified like this:
 * =======================================
 *
 * <input type="hidden" name="scData" value="xxxxx" />
 * Trigger alarm :
 *   <input type="checkbox" name="_trigger[3][4]" value="1" />
 *   <input type="checkbox" name="_trigger[3][2]" value="1" />
 *   <input type="checkbox" name="_trigger[3][1]" value="1" />
 * Trigger risks :
 *   <input type="radio" name="_trigger[2]" value="10" /> x5
 * Trigger sensors 4:
 *   <input type="radio" name="_trigger_type" value="4" checked="checked" />
 *   <select name="_trigger[4][1][deviceSlaveId]">
 *     <option value="xxxxxx" selected="selected">Capteur SdB</option>
 *     ....
 *   </select>
 *   <input name="_trigger[4][1][value]" value="15" type="text" class="" />
 *   <input type="radio" name="_trigger[4][1][operator]" value="1" checked="checked" />
 *   <input type="radio" name="_trigger[4][1][operator]" value="0" />
 * Trigger sensors 5 :
 *   <input type="radio" name="_trigger_type" value="5" />
 *   <select name="_trigger[5][1][deviceSlaveId]">
 *     <option value="xxxxxx">Capteur SdB</option>
 *     ...
 *   </select>
 *   <select name="_trigger[5][1][value]">
 *     <option value="1">Pleine lumière</option>
 *     ...
 *     <option value="6">Obscurité</option>
 *   </select>
 *   <input type="radio" name="_trigger[5][1][operator]" value="1" checked="checked" />
 *   <input type="radio" name="_trigger[5][1][operator]" value="0" />
 * Trigger sensors 7 :
 *   <input type="radio" name="_trigger_type" value="7" />
 *   <select name="_trigger[7]">
 *     <option value="xxx">Porte d'entrée</option>
 *     ...
 *   </select>
 * CONDITIONS :
 *   <div class="conditions">
 *     Alarm:
 *       <span class="input-checkbox condition-choice condition-3-choice" data-default="3">
 *         <input...>  <-- don't care, see data-default in above span instead
 *       </span>
 *       <input type="radio" name="_condition[3][4]" value="1" />
 *       <input type="radio" name="_condition[3][2]" value="1" />
 *       <input type="radio" name="_condition[3][1]" value="1" />
 *
 *     Time conditions:
 *       <span class="input-checkbox condition-choice condition-1-choice" data-default="1">
 *         <input...>  <-- don't care, see data-default in above span instead
 *       </span>
 *       <input type="hidden" name="_condition[1]" id="scheduleRule" value="" />
 *       Not useful to save:
 *         <input id="schedule1" name="time1" class="ws-prompt-time" placeholder="HH:mm" type="text" />
 *         <input id="schedule2" name="time2" class="ws-prompt-time" placeholder="HH:mm" type="text" />
 *         <input type="hidden" name="day" />
 *         <input type="hidden" name="idx" />
 *
 *     Temperature conditions:
 *       <span class="input-checkbox condition-choice condition-Limited 4-1" data-default="4">
 *         <input ...>  <-- don't care, see data-default in above span instead
 *       </span>
 *       <select name="_condition[4][1][deviceSlaveId]">
 *         <option value="xxx" selected="selected">Capteur Salon</option>
 *       </select>
 *       <select name="_condition[4][1][operator]">
 *         <option value="0" selected="selected"><</option>
 *         <option value="1">></option>
 *         <option value="2">=</option>
 *       </select>
 *       <input name="_condition[4][1][value]" value="16" type="text" class="" />
 *       <span class="input-checkbox condition-choice condition-Limited 4-2" data-default="4">
 *         <input ...>  <-- don't care, see data-default in above span instead
 *       </span>
 *       <select name="_condition[4][2][deviceSlaveId]">
 *         <option value="xxx" selected="selected">Capteur Salon</option>
 *       </select>
 *       <select name="_condition[4][2][operator]">
 *         <option value="0"><</option>
 *         <option value="1" selected="selected">></option>
 *         <option value="2">=</option>
 *       </select>
 *       <input name="_condition[4][2][value]" value="14" type="text" class="" />
 *
 *     Lightning conditions:
 *       <span class="input-checkbox condition-choice condition-Limited 5-1" data-default="5">
 *         <input ...>  <-- don't care, see data-default in above span instead
 *       </span>
 *       <select name="_condition[5][1][deviceSlaveId]">
 *         <option value="xxx">Capteur SdB</option>
 *       </select>
 *       <select name="_condition[5][1][operator]">
 *         <option value="0" selected="selected"><</option>
 *         <option value="1">></option>
 *         <option value="2">=</option>
 *       </select>
 *       <select name="_condition[5][1][value]">
 *         <option value="1">Pleine lumière</option>
 *         ...
 *         <option value="6">Obscurité</option>
 *       </select>
 *       <span class="input-checkbox condition-choice condition-Limited 5-2" data-default="5">
 *         <input ...>  <-- don't care, see data-default in above span instead
 *       </span>
 *       <select name="_condition[5][2][deviceSlaveId]">
 *         <option value="xxx">Capteur SdB</option>
 *       </select>
 *       <select name="_condition[5][2][operator]">
 *         <option value="0" selected="selected"><</option>
 *         <option value="1">></option>
 *         <option value="2">=</option>
 *       </select>
 *       <select name="_condition[5][2][value]">
 *         <option value="1">Pleine lumière</option>
 *         ...
 *         <option value="6">Obscurité</option>
 *       </select>
 *   </div>
 * Submit:
 *   <input type="submit" name="sbt" value="Étape suivante" />
 *
 *
 *
 * @param  {MyfoxWrapperApiCommon}  wrapperApi  The Api instance, to throw events
 * @return {trumpet}                The trumpet parser to plug on the HTML stream.
 */
export function step3TempModificationParser (wrapperApi) {
  const trumpetParser = trumpet()
  trumpetParser.nextPayload = {}
  trumpetParser.setMaxListeners(30) // We have a lot of stuff to analyze...

  // get scData ✔
  trumpetParser.select(
    'form#scenarioForm input[name="scData"]',
    trumpetAffectValue(trumpetParser.nextPayload)
  )

  // Alarm trigger ✔
  trumpetParser.selectAll('form#scenarioForm input[type="checkbox"][name^="_trigger[3]"][checked="checked"]', trumpetAttr('name', (name) => {
    trumpetParser.nextPayload[name] = '1'
  }))

  // Risks trigger ✔
  trumpetParser.select(
    'form#scenarioForm input[type="radio"][name="_trigger[2]"][checked="checked"]',
    trumpetAffectValue(trumpetParser.nextPayload)
  )

  // Sensor 4 trigger (temperatures) OR Sensor 5 trigger (lightning) -> same structure ✔ ✔
  trumpetParser.select('form#scenarioForm input[type="radio"][name="_trigger_type"][checked="checked"]', trumpetAttr('value', (triggerType) => {
    trumpetParser.nextPayload['_trigger_type'] = triggerType
    // tab is selected, add more parsers

    // get scenario ✔
    trumpetParser.select(
      `form#scenarioForm select[name="_trigger[${triggerType}][1][deviceSlaveId]"] option[selected="selected"]`,
      trumpetAffectValue(trumpetParser.nextPayload, `_trigger[${triggerType}][1][deviceSlaveId]`)
    )

    // get temperature value ✔
    trumpetParser.select(
      `form#scenarioForm input[name="_trigger[${triggerType}][1][value]"]`,
      trumpetAffectValue(trumpetParser.nextPayload, `_trigger[${triggerType}][1][value]`)
    )

    // get lightning value ✔
    trumpetParser.select(
      `form#scenarioForm select[name="_trigger[${triggerType}][1][value]"] option[selected="selected"]`,
      trumpetAffectValue(trumpetParser.nextPayload, `_trigger[${triggerType}][1][value]`)
    )

    // get operator ✔
    trumpetParser.select(
      `form#scenarioForm input[name="_trigger[${triggerType}][1][operator]"][checked="checked"]`,
      trumpetAffectValue(trumpetParser.nextPayload, `_trigger[${triggerType}][1][operator]`)
    )
  }))

  // Sensor 7 trigger (intrusion) ✔
  trumpetParser.select('form#scenarioForm input[type="radio"][name="_trigger_type"][value="7"]', trumpetAttr('checked', (checked) => {
    if (checked === 'checked') {
      trumpetParser.nextPayload['_trigger_type'] = '7'
      // tab is selected, add more parsers

      // sensor ID
      trumpetParser.select(
        'form#scenarioForm select[name="_trigger[7]"] option[selected="selected"]',
        trumpetAffectValue(trumpetParser.nextPayload, '_trigger[7]')
      )
    }
  }))

  // Condition: Alarm level ✔
  trumpetParser.select('form#scenarioForm div.conditions span.input-checkbox.condition-choice.condition-3-choice[data-default="3"]', (element) => {
    trumpetParser.nextPayload['_condition_3'] = '3'
    trumpetParser.select(
      'form#scenarioForm div.conditions input[type="radio"][name^="_condition[3]"][checked="checked"]',
      trumpetAttr('name', (name) => {
        trumpetParser.nextPayload[name] = '1'
      })
    )
  })

  // Condition: time ✔
  trumpetParser.select('form#scenarioForm div.conditions span.input-checkbox.condition-choice.condition-1-choice[data-default="1"]', (element) => {
    trumpetParser.nextPayload['_condition_1'] = '1'
    trumpetParser.select(
      'form#scenarioForm div.conditions input[type="hidden"][name="_condition[1]"]',
      trumpetAffectValue(trumpetParser.nextPayload)
    )
  })

  // Condition: temperatures ✔
  trumpetParser.select('form#scenarioForm div.conditions span.input-checkbox.condition-choice.condition-Limited.4-1[data-default="4"]', (element) => {
    trumpetParser.nextPayload['_condition_4_1'] = '4'
    // checked, add more parsers

    trumpetParser.select(
      'form#scenarioForm div.conditions select[name="_condition[4][1][deviceSlaveId]"] option[selected="selected"]',
      trumpetAffectValue(trumpetParser.nextPayload, '_condition[4][1][deviceSlaveId]')
    )
    trumpetParser.select(
      'form#scenarioForm div.conditions select[name="_condition[4][1][operator]"] option[selected="selected"]',
      trumpetAffectValue(trumpetParser.nextPayload, '_condition[4][1][operator]')
    )
    trumpetParser.select(
      'form#scenarioForm div.conditions input[name="_condition[4][1][value]"]',
      trumpetAffectValue(trumpetParser.nextPayload)
    )

    trumpetParser.select('form#scenarioForm div.conditions span.input-checkbox.condition-choice.condition-Limited.4-2[data-default="4"]', (element) => {
      trumpetParser.nextPayload['_condition_4_2'] = '4'
      // checked, add more parsers

      trumpetParser.select(
        'form#scenarioForm div.conditions select[name="_condition[4][2][deviceSlaveId]"] option[selected="selected"]',
        trumpetAffectValue(trumpetParser.nextPayload, '_condition[4][2][deviceSlaveId]')
      )
      trumpetParser.select(
        'form#scenarioForm div.conditions select[name="_condition[4][2][operator]"] option[selected="selected"]',
        trumpetAffectValue(trumpetParser.nextPayload, '_condition[4][2][operator]')
      )
      trumpetParser.select(
        'form#scenarioForm div.conditions input[name="_condition[4][2][value]"]',
        trumpetAffectValue(trumpetParser.nextPayload)
      )
    })
  })

  // Condition: lightnings ✔
  trumpetParser.select('form#scenarioForm div.conditions span.input-checkbox.condition-choice.condition-Limited.5-1[data-default="5"]', (element) => {
    trumpetParser.nextPayload['_condition_5_1'] = '5'
    // checked, add more parsers

    trumpetParser.select(
      'form#scenarioForm div.conditions select[name="_condition[5][1][deviceSlaveId]"] option[selected="selected"]',
      trumpetAffectValue(trumpetParser.nextPayload, '_condition[5][1][deviceSlaveId]')
    )
    trumpetParser.select(
      'form#scenarioForm div.conditions select[name="_condition[5][1][operator]"] option[selected="selected"]',
      trumpetAffectValue(trumpetParser.nextPayload, '_condition[5][1][operator]')
    )
    trumpetParser.select(
      'form#scenarioForm div.conditions select[name="_condition[5][1][value]"] option[selected="selected"]',
      trumpetAffectValue(trumpetParser.nextPayload, '_condition[5][1][value]')
    )

    trumpetParser.select('form#scenarioForm div.conditions span.input-checkbox.condition-choice.condition-Limited.5-2[data-default="5"]', (element) => {
      trumpetParser.nextPayload['_condition_5_2'] = '5'
      // checked, add more parsers

      trumpetParser.select(
        'form#scenarioForm div.conditions select[name="_condition[5][2][deviceSlaveId]"] option[selected="selected"]',
        trumpetAffectValue(trumpetParser.nextPayload, '_condition[5][2][deviceSlaveId]')
      )
      trumpetParser.select(
        'form#scenarioForm div.conditions select[name="_condition[5][2][operator]"] option[selected="selected"]',
        trumpetAffectValue(trumpetParser.nextPayload, '_condition[5][2][operator]')
      )
      trumpetParser.select(
        'form#scenarioForm div.conditions select[name="_condition[5][2][value]"] option[selected="selected"]',
        trumpetAffectValue(trumpetParser.nextPayload, '_condition[5][2][value]')
      )
    })
  })

  return trumpetParser
}

/**
 * Returns a trumpet parser that will inspect form structure to post with no modification
 *
 * POST https://myfox.me/scenario/{homeId}/manage/{scenarioId}/4
 *    with all data obtained by this.step3TempModificationParser() in the payload
 * => <form id="scenarioForm" action="https://myfox.me/scenario/7718/manage/183349/5" method="post">
 *      <input type="hidden" name="scData" value="...">
 *      <h2>...</h2>
 *      <div class="tabs-contents" style="min-height: 209px;">
 *
 *        <div class="tab-content tab-security" style="display: block;">
 *          <div class="item security-level">
 *            <input type="radio" name="_action[securityLevel]" value="4" disabled="disabled">
 *            <input type="radio" name="_action[securityLevel]" value="2" disabled="disabled">
 *            <input type="radio" name="_action[securityLevel]" value="1" disabled="disabled">
 *          </div>
 *        </div>
 *
 *        <div class="tab-content tab-domotic">
 *          <input type="checkbox" name="_cbx161355" value="1" disabled="disabled">
 *          <input type="hidden" name="_action[g][2856]" value="" disabled="disabled">
 *          <input type="checkbox" name="_cbx825488" value="1" disabled="disabled">
 *          <input type="hidden" name="_action[d][71394]" value="" disabled="disabled">
 *        </div>
 *
 * Probleme, je n'ai pas d'exemple ici:
 *        <div class="tab-content tab-video">
 *          <div class="item">Vous n'avez aucune caméra installée.</div>
 *        </div>
 *        <div class="tab-content tab-automatism">
 *          <div class="item">Vous n'avez aucun automatisme installé.</div>
 *        </div>
 *
 *
 *        <div class="tab-content tab-scenario">
 *
 *          <!-- Jouer une sonnerie à l'exécution du scénario -->
 *          <input type="checkbox" name="ringtone" value="1" disabled="disabled">
 *
 *          <!-- Différer l'exécution du scénario -->
 *          <input type="checkbox" name="_cbx836372" value="1" disabled="disabled">
 *          de
 *          <input type="text" name="delayPlay" value="30" class="seconds" disabled="disabled">
 *          secondes
 *
 *          <!-- Lancer le scénario inverse -->
 *          <input type="checkbox" name="_cbx866445" value="1" disabled="disabled">
 *          après
 *          <input type="text" name="delayReverse" value="30" class="seconds" disabled="disabled">
 *          secondes
 *
 *          <!-- Lancer un autre scénario -->
 *          <input type="checkbox" name="_cbx294634" value="1" checked="checked">
 *          <select name="_action[runScenarioId]">
 *            <option value="">Choisissez un de vos scénarios à la demande</option>
 *            <option value="143997" selected="selected">AA test rien</option>
 *            <option value="39004">Ch Chbres Confort 2h</option>
 *          </select>
 *
 *        </div>
 *
 *      </div>
 *      <div class="form-buttons">
 *        <a href="#" class="btn-previousStep"><span class="arrow"></span><input type="submit" name="sbt" value="Étape précédente"><span class="text">Étape précédente</span></a>
 *        <a href="#" class="btn-nextStep"><input type="submit" name="sbt" value="Étape suivante"><span class="text">Étape suivante</span><span class="arrow"></span></a>
 *      </div>
 *    </form>
 *
 *
 * =======================================
 * Form elements are classified like this:
 * =======================================
 *
 * <input type="hidden" name="scData" value="...">
 *
 * Alarm levels:
 *   <input type="radio" name="_action[securityLevel]" value="4" disabled="disabled">
 *   <input type="radio" name="_action[securityLevel]" value="2" disabled="disabled">
 *   <input type="radio" name="_action[securityLevel]" value="1" disabled="disabled">
 *
 * Domotic/groups/other commands ON/OFF
 *   <div class="tab-content tab-domotic">
 *     <span class="input-checkbox action-choice" data-default="1">  <-- if data-default is == "1", then checked
 *       <input type="checkbox" name="_cbxXXXXX" value="1">  <-- don't care
 *     </span>
 *     <input type="hidden" name="_action[g][XXXXX]" value="">  <-- to take only if data-default == "1" above
 *
 *     <span class="input-checkbox action-choice" data-default="">  <-- example unchecked
 *       <input type="checkbox" name="_cbxXXXXX" value="1">  <-- don't care
 *     </span>
 *     <input type="hidden" name="_action[d][XXXXX]" value="">  <-- do not take it (unchecked)
 *   </div>
 *
 * Camera, automatism: PROBLEM, I HAVE NO SAMPLE !
 *   <div class="tab-content tab-video">
 *     <div class="item">Vous n'avez aucune caméra installée.</div>
 *   </div>
 *   <div class="tab-content tab-automatism">
 *     <div class="item">Vous n'avez aucun automatisme installé.</div>
 *   </div>
 * ==> To do, one day maybe...
 *
 * Ringtone:
 *   <span class="input-checkbox action-choice" data-default="1">  <-- if data-default is == "1", then checked
 *     <input type="checkbox" name="ringtone" value="1">  <-- don't care
 *   </span>
 *
 * Scenario play:
 *   <span class="input-checkbox action-choice" data-default="1">  <-- if data-default is == "1", then checked
 *     <input type="checkbox" name="_cbxXXXXX" value="1">  <-- don't care
 *   </span> de
 *   <input type="text" name="delayPlay" value="30" class="seconds" disabled="disabled">  <-- to take only if data-default == "1" above
 *
 *   <span class="input-checkbox action-choice" data-default="1">  <-- if data-default is == "1", then checked
 *     <input type="checkbox" name="_cbxXXXXX" value="1">  <-- don't care
 *   </span> après
 *   <input type="text" name="delayReverse" value="30" class="seconds" disabled="disabled">  <-- to take only if data-default == "1" above
 *
 *   <span class="input-checkbox action-choice" data-default="1">  <-- if data-default is == "1", then checked
 *     <input type="checkbox" name="_cbxXXXXX" value="1">  <-- don't care
 *   </span>
 *   <select name="_action[runScenarioId]">
 *     <option value="">Choisissez un de vos scénarios à la demande</option>
 *     <option value="xxxxx" selected="selected">AA test rien</option>
 *     <option value="xxxxxx">Ch Chbres Confort 2h</option>
 *   </select>
 *
 * @param  {MyfoxWrapperApiCommon}  wrapperApi  The Api instance, to throw events
 * @return {trumpet}                The trumpet parser to plug on the HTML stream.
 */
export function step4Parser (wrapperApi) {
  const trumpetParser = trumpet()
  trumpetParser.nextPayload = {}
  trumpetParser.setMaxListeners(10) // We have a lot of stuff to analyze...

  // get scData ✔
  trumpetParser.select(
    'form#scenarioForm input[name="scData"]',
    trumpetAffectValue(trumpetParser.nextPayload)
  )

// TODO !3: jeux de tests complets d'ici !

  // Alarm levels
  trumpetParser.select(
    'form#scenarioForm input[type="radio"][name="_action[securityLevel]"][checked="checked"]',
    trumpetAffectValue(trumpetParser.nextPayload)
  )

// TODO !0: tester en reel
  // Domotic/groups/other commands ON/OFF
  let nextInputForDomotic = false
  trumpetParser.selectAll(
    'form#scenarioForm div.tab-domotic span.input-checkbox.action-choice',
    trumpetAttr('data-default', (dataDefault) => {
      nextInputForDomotic = (dataDefault === '1')
    })
  )
  trumpetParser.selectAll(
    'form#scenarioForm div.tab-domotic input[type="hidden"][name^="_action"]',
    (element) => {
      element.getAttributes((attributes) => {
        if (nextInputForDomotic && attributes['value'] && attributes['value'] !== '') {
          trumpetParser.nextPayload[attributes['name']] = attributes['value']
        }
      })
    }
  )

  // Camera, automatism
  // To do later, when sample available!

// TODO !0: tester en reel
  // Scenario play
  let nextInputForScenarioPlay = false
  trumpetParser.selectAll(
    'form#scenarioForm div.tab-scenario span.input-checkbox.action-choice',
    trumpetAttr('data-default', (dataDefault) => {
      nextInputForScenarioPlay = (dataDefault === '1')
    })
  )
  trumpetParser.select(
    'form#scenarioForm div.tab-scenario input[type="checkbox"][name="ringtone"]',
    (element) => {
      element.getAttributes((attributes) => {
        if (nextInputForScenarioPlay) {
          trumpetParser.nextPayload['ringtone'] = true
        }
      })
    }
  )
  trumpetParser.select(
    'form#scenarioForm div.tab-scenario input[type="hidden"][name="delayPlay"]',
    (element) => {
      element.getAttributes((attributes) => {
        if (nextInputForScenarioPlay && attributes['value'] && attributes['value'] !== '') {
          trumpetParser.nextPayload['delayPlay'] = attributes['value']
        }
      })
    }
  )
  trumpetParser.select(
    'form#scenarioForm div.tab-scenario input[type="hidden"][name="delayReverse"]',
    (element) => {
      element.getAttributes((attributes) => {
        if (nextInputForScenarioPlay && attributes['value'] && attributes['value'] !== '') {
          trumpetParser.nextPayload['delayReverse'] = attributes['value']
        }
      })
    }
  )
  trumpetParser.select(
    'form#scenarioForm div.tab-scenario select[name="_action[runScenarioId]"] option[selected="selected"]',
    (element) => {
      element.getAttributes((attributes) => {
        if (nextInputForScenarioPlay && attributes['value'] && attributes['value'] !== '') {
          trumpetParser.nextPayload['_action[runScenarioId]'] = attributes['value']
        }
      })
    }
  )

  return trumpetParser
}

export function step5Parser (wrapperApi) {
  const trumpetParser = trumpet()
  trumpetParser.data = {status: 'ko'}

  trumpetParser.select('div.ended p.message-normal', () => {
    trumpetParser.data.status = 'ok'
    trumpetParser.end()
  })

  return trumpetParser
}

export function step3TempFixer (payload, settings) {
  // TODO !4: fixer la payload avec les settings... Faire apres les tests
  console.log(payload, settings, '####')
  return payload
}

'use strict'

import trumpet from 'trumpet'
import { trumpetAttr } from './index'

/**
 * Returns a trumpet parser that will XXX
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
 * Returns a trumpet parser that will XXX
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
    // TODO !0: Store in this.nextPayload the data to POST in step 3
}

/**
 * Returns a trumpet parser that will XXX
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
 *          <input type="checkbox" name="_condition_4_1" value="4" />  (FIXME doit etre checked ??? pas sur !)
 *          <span>Si la température...</span>
 *        </div>
 *        <div class="condition-inputs choice-4-1">
 *          ... du capteur 	<select name="_condition[4][1][deviceSlaveId]">
 *            <option value="xxxx">Capteur SdB</option>
 *            <option value="xxxx" selected="selected">Capteur Salon</option>
 *          </select> est 	<select name="_condition[4][1][operator]">
 *            <option value="0" selected="selected"><</option>
 *            <option value="1">></option><option value="2">=</option>
 *          </select> à <input name="_condition[4][1][value]" value="16" type="text" class="" /> °C
 *        </div>
 *        <div class="condition choice-4-2">
 *          <input type="checkbox" name="_condition_4_2" value="4" />  (FIXME doit etre checked ??? pas sur !)
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
    // TODO !1: retourner dans this.data les différentes etapes contenant une temperature qui pourrait être controlée dans le callback.
}

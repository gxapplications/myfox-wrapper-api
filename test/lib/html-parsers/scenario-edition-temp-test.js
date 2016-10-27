/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import CommonApi from '../../../lib/common-api'
import { step1Parser, step2Parser, step3TempInspectionParser,
  step3TempModificationParser, step3TempFixer, step4Parser } from '../../../lib/html-parsers/scenario_edition'

describe('HTML Scenario edition parser', () => {
  it('can parse the first manager step', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = step1Parser(api)
    tr.on('end', () => {
      expect(tr.nextPayload).to.have.property('scData', 'scdata-value')
      expect(tr.nextPayload).to.have.property('label', 'scenario-label-value')
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-edition-first-step.html')).pipe(tr)
  })

  it('can parse the second manager step', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = step2Parser(api)
    tr.on('end', () => {
      expect(tr.nextPayload).to.have.property('scData', 'scdata-value')
      expect(tr.nextPayload).to.have.property('type', 'type-value')
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-edition-second-step.html')).pipe(tr)
  })

  it('can parse the third manager step and inspect for temperatures', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = step3TempInspectionParser(api)
    tr.on('end', () => {
      expect(tr.data).to.deep.equal({
        trigger_4: {
          deviceSlaveId: 'sdb-id',
          deviceSlaveName: 'Capteur SdB',
          value: '15',
          operator: '1'
        },
        condition_4_1: {
          deviceSlaveId: 'salon-id',
          deviceSlaveName: 'Capteur Salon',
          operator: '0',
          value: '16'
        },
        condition_4_2: {
          deviceSlaveId: 'salon-id-2',
          deviceSlaveName: 'Capteur Salon',
          operator: '1',
          value: '14'
        }
      })
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-edition-third-step.html')).pipe(tr)
  })

  it('can parse the full third manager step and return the whole payload in all cases (1)', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = step3TempModificationParser(api)
    tr.on('end', () => {
      expect(tr.nextPayload).to.deep.equal({
        scData: '12345678',
        '_trigger_type': '4',
        '_trigger[3][2]': '1',
        '_trigger[2]': '16',
        '_trigger[4][1][deviceSlaveId]': '98765432',
        '_trigger[4][1][value]': '15',
        '_trigger[4][1][operator]': '1',
        '_condition_1': '1',
        '_condition_3': '3',
        '_condition[3][2]': '1',
        '_condition[1]': '1:0956,1051,1123,1234;6:0148,0347',
        '_condition_4_1': '4',
        '_condition_4_2': '4',
        '_condition[4][1][deviceSlaveId]': 'xxx',
        '_condition[4][1][operator]': '0',
        '_condition[4][1][value]': '16',
        '_condition[4][2][deviceSlaveId]': 'xxx',
        '_condition[4][2][operator]': '1',
        '_condition[4][2][value]': '14',
        '_condition_5_1': '5',
        '_condition_5_2': '5',
        '_condition[5][1][deviceSlaveId]': 'xxx',
        '_condition[5][1][operator]': '0',
        '_condition[5][1][value]': '6',
        '_condition[5][2][deviceSlaveId]': 'xxx',
        '_condition[5][2][operator]': '0',
        '_condition[5][2][value]': '4'
      })
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-edition-third-step-full-1.html')).pipe(tr)
  })

  it('can parse the full third manager step and return the whole payload in all cases (2)', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = step3TempModificationParser(api)
    tr.on('end', () => {
      expect(tr.nextPayload).to.deep.equal({
        'scData': '12345678',
        '_trigger_type': '7',
        '_trigger[7]': '98712345',
        '_condition_3': '3',
        '_condition[3][2]': '1',
        '_condition_1': '1',
        '_condition[1]': '1:0956,1051,1123,1234;6:0148,0347'
      })
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-edition-third-step-full-2.html')).pipe(tr)
  })

  it('can parse the full third manager step and return the whole payload in all cases (3)', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = step3TempModificationParser(api)
    tr.on('end', () => {
      expect(tr.nextPayload).to.deep.equal({
        'scData': '12345678',
        '_trigger_type': '5',
        '_trigger[5][1][deviceSlaveId]': '4567890',
        '_trigger[5][1][value]': '2',
        '_trigger[5][1][operator]': '1'
      })
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-edition-third-step-full-3.html')).pipe(tr)
  })

  it('can fix a step 3 payload with temperature settings', () => {
    const settings = [{

    }]
    const payload = {

    }
    expect(step3TempFixer(payload, settings)).to.deep.equal({

    })
    // TODO !2: a partir d'un jeu de settings avec les 3 types de conditions,
    // et une payload vue dans un test au-dessus, que doit-on avoir ?
    // (temperature avec des delta +/- 1° ???)
    // Tester le cas des temperatures a virgule (ou a point ?)
  })

  it('can parse the full fourth manager step and return the whole payload in all cases (1)', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = step4Parser(api)
    tr.on('end', () => {
      expect(tr.nextPayload).to.deep.equal({
        '_action[d][75689]': '1',
        '_action[d][7897789]': '0',
        'delayPlay': '32',
        'ringtone': true,
        'scData': 'xxxxxxx'
      })
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-edition-fourth-step-1.html')).pipe(tr)
  })
})

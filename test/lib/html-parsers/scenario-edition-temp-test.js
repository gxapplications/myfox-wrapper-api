/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import CommonApi from '../../../lib/common-api'
import { step1Parser, step2Parser, step3TempInspectionParser } from '../../../lib/html-parsers/scenario_edition'

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
})


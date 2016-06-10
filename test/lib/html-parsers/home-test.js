/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import CommonApi from '../../../lib/common-api'
import homeParser from '../../../lib/html-parsers/home'

describe('HTML Home parser', () => {
  it('can parse a whole page and delivers data', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = homeParser(api)
    tr.on('end', () => {
      done()
    })
    tr.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-home.html')).pipe(tr)
  })

  it('can parse a whole page, then a new one, and triggers persistentState changes', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let listenerNotifications = []
    let listener = (label, value, oldValue, timestamp) => {
      switch (label) {
        case 'status':
          expect(value).to.deep.equal({ internet: '1', powerSupply: '1', diagnosis: '1' })
          expect(oldValue).to.deep.equal({ internet: '0', powerSupply: '0', diagnosis: '0' })
          break
        case 'alarm':
          expect(value).to.equal('half')
          expect(oldValue).to.equal('full')
          break
        case 'scenarii':
          expect(value).to.deep.equal({
            '654': { type: '>1', name: 'Sc activable', active: '1' },
            '987': { type: 1, name: 'Sc playable' }
          })
          expect(oldValue).to.deep.equal({
            '654': { type: '>1', name: 'Sc activable', active: '0' },
            '987': { type: 1, name: 'Sc playable' }
          })
          break
        case 'data':
          expect(value).to.deep.equal({
            '258': { name: 'Capteur 1', temperature: '20.8°', light: 'Pénombre' },
            '259': { name: 'Capteur 2', temperature: '20.2°', light: 'Pénombre' }
          })
          expect(oldValue).to.deep.equal({
            '258': { name: 'Capteur 1', temperature: '22.1°', light: 'Lumière du jour' },
            '259': { name: 'Capteur 2', temperature: '20.2°', light: 'Pénombre' }
          })
          break
        case 'heat':
          expect(value).to.deep.equal({
            '965': { name: 'Ch 2', state: 'eco' },
            '2171': { name: 'Ch 1', state: 'off' }
          })
          expect(oldValue).to.deep.equal({
            '965': { name: 'Ch 2', state: 'eco' },
            '2171': { name: 'Ch 1', state: 'eco' }
          })
      }
      listenerNotifications.push(label)
    }
    api.addStateListener('status', listener)
    api.addStateListener('alarm', listener)
    api.addStateListener('scenarii', listener)
    api.addStateListener('data', listener)
    api.addStateListener('heat', listener)

    let tr1 = homeParser(api)

    tr1.on('end', () => {
      let tr2 = homeParser(api)
      tr2.on('end', () => {
        expect(listenerNotifications).to.have.lengthOf(5)

        let tr3 = homeParser(api)
        tr3.on('end', () => {
          expect(listenerNotifications).to.have.lengthOf(5)
          done()
        })
        tr3.on('error', done)
        fs.createReadStream(path.join(__dirname, 'mock-home-2.html')).pipe(tr3)
      })
      tr2.on('error', done)
      fs.createReadStream(path.join(__dirname, 'mock-home-2.html')).pipe(tr2)
    })
    tr1.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-home-1.html')).pipe(tr1)
  })
})


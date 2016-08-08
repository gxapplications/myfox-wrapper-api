/* eslint-env mocha */
'use strict'

import { expect } from 'chai'

import CommonApi from '../../lib/common-api'

describe('Macro listener behavior', () => {
  it('is correct for adding-deleting listener', () => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let listener = (id, data, state, remaining, timestamp) => { }
    expect(api.addMacroListener(listener)).to.be.true
    expect(api.removeMacroListener(listener)).to.be.true
  })

  it('is correct for re-adding an already registered listener', () => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let listener = (id, data, state, remaining, timestamp) => { }
    expect(api.addMacroListener(listener)).to.be.true
    expect(api.addMacroListener(listener)).to.be.false
  })

  describe('triggers listeners when an event occurs', () => {
    beforeEach(function () {
      this.api = new CommonApi({'myfoxSiteIds': [1234]})
      this.valueToReturn = null
      this.values = []
      this.timestamps = []
      this.listener = function (id, data, state, remaining, timestamp) {
        this.values.push({id, data, state, remaining})
        this.timestamps.push(timestamp)
        return this.valueToReturn
      }
      this.api.addMacroListener(this.listener.bind(this))
    })

    it('contains the right data and is kept after one event', function () {
      this.valueToReturn = true
      this.api.notifyMacroListeners(null, {id: 123456, data: {test: 'hi!'}, state: 'progress', remaining: 2})
      expect(this.values[0]).to.deep.equal({id: 123456, data: {test: 'hi!'}, state: 'progress', remaining: 2})

      this.api.notifyMacroListeners(null, {id: 56789, data: {test: 'hello!'}, state: 'finished', remaining: 0})
      expect(this.values[1]).to.deep.equal({id: 56789, data: {test: 'hello!'}, state: 'finished', remaining: 0})
    })

    it('is removed after the event', function () {
      this.valueToReturn = false
      this.api.notifyMacroListeners(null, {id: 123456, data: {test: 'hi!'}, state: 'progress', remaining: 2})
      expect(this.values[0]).to.deep.equal({id: 123456, data: {test: 'hi!'}, state: 'progress', remaining: 2})

      this.api.notifyMacroListeners(null, {id: 56789, data: {test: 'hello!'}, state: 'finished', remaining: 0})
      expect(this.values).to.have.lengthOf(1)
    })

    it('received a consistent timestamp', function (done) {
      this.valueToReturn = true
      this.api.notifyMacroListeners(null, {id: 123456, data: {test: 'hi!'}, state: 'progress', remaining: 2})
      expect(this.timestamps[0]).to.be.defined

      setTimeout(() => {
        this.api.notifyMacroListeners(null, {id: 56789, data: {test: 'hello!'}, state: 'finished', remaining: 0})
        expect(this.timestamps[1]).to.be.defined

        expect(this.timestamps[1]).to.be.above(this.timestamps[0])
        done()
      }, 20)
    })
  })
})


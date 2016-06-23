/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import sinon from 'sinon'

import { Html as HtmlApi } from '../../lib/index'

const myfoxSiteIds = {myfoxSiteIds: [1234]}

describe('HTML-api library', () => {
  it('Instantiated directly with minimal parameters', () => {
    const api = HtmlApi(myfoxSiteIds)
    expect(api.options.apiStrategy).to.equal('custom')
  })

  describe('callScenarioAction isolated', () => {
    let api = null

    beforeEach(() => {
      api = HtmlApi(myfoxSiteIds)
      sinon.stub(api, '_callScenarioAction')
    })
    afterEach(() => {
      api._callScenarioAction.restore()
    })

    it('to test subcall for very simple case (1 step, no delay by default)', (done) => {
      const callback = () => {
        sinon.assert.calledOnce(api._callScenarioAction)
        sinon.assert.calledWithExactly(api._callScenarioAction, {id: 456, action: 'play', delay: 0}, callback)
        done()
      }
      api._callScenarioAction.callsArg(1) // the stub must call the callback just above in return
      api.callScenarioAction({id: 456, action: 'play'}, callback)
    })

    it('to test subcall for delayed case (1 step, with delay)', (done) => {
      const callback = () => {
        sinon.assert.calledOnce(api._callScenarioAction)
        sinon.assert.calledWith(api._callScenarioAction, {id: 456, action: 'play', delay: 20}, callback)
        done()
      }
      api._callScenarioAction.callsArg(1) // the stub must call the callback just above in return
      api.callScenarioAction({id: 456, action: 'play', delay: 20}, callback)
    })

    it('to test wrong input formats', (done) => {
      const callback = () => {
        sinon.assert.notCalled(api._callScenarioAction)
        done('Callback should not be called')
      }
      api._callScenarioAction.callsArg(1) // the stub must call the callback just above in return. But the stub should not be called...

      expect(api.callScenarioAction.bind(api, {id: 456, bad: 'key', falsy: 'argument'}, callback)).to.throw(Error, /missing/)
      expect(api.callScenarioAction.bind(api, {id: 456, action: 'bad action', delay: 0}, callback)).to.throw(Error, /must be one of/)
      expect(api.callScenarioAction.bind(api, {id: 456, action: 'on', delay: 'after midnight'}, callback)).to.throw(Error, /must be a number/)
      expect(api.callScenarioAction.bind(api, {id: 'id-not-integer', action: 'off'}, callback)).to.throw(Error, /must be a number/)
      expect(api.callScenarioAction.bind(api, {id: 42, action: 'play', delay: 0}, callback, {id: 42, action: 'fifi', delay: 0})).to.throw(Error, /must be one of/)

      done()
    })
  })

  describe('_callScenarioAction subcall isolated', () => {
    let api = null

    beforeEach(() => {
      api = HtmlApi(myfoxSiteIds)
      sinon.stub(api, 'callApi')
      sinon.stub(api, 'notifyMacroListeners')
    })
    afterEach(() => {
      api.callApi.restore()
      api.notifyMacroListeners.restore()
    })

    // TODO !0: tester, en specialisant les stubs a chaque besoin
    it('to test simple case (1 step, no delay)', () => {

    })
    it('to test delayed case (1 step, with delay)')
    it('to test complex macro (many steps, delays, ...)')
  })
})


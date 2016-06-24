/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import sinon from 'sinon'

import CommonApi from '../../lib/common-api'
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
      sinon.stub(CommonApi.prototype, 'callApi') // Because the method is in the parent class
      sinon.stub(CommonApi.prototype, 'notifyMacroListeners') // Because the method is in the parent class
      sinon.spy(api, '_callScenarioAction') // and not here...
    })
    afterEach(() => {
      CommonApi.prototype.callApi.restore()
      CommonApi.prototype.notifyMacroListeners.restore()
    })

    it('to test simple case (1 step, no delay)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/scenario\/play\/456\?_=/, /GET/)

        expect(a).to.be.null
        // The id is not scenario ID, but the macro ID! And null because no need to have one, if just 1 step without delay.
        expect(b).to.deep.equal({id: null, data: 'test', state: 'finished', remaining: 0})
        done()
      }

      api._callScenarioAction({id: 456, action: 'play', delay: 0}, callback)
    })

    it('to test delayed case (1 step, with delay)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        expect(a).to.be.null
        // The id is not scenario ID, but the macro ID! And null because no need to have one, if just 1 step without delay.
        expect(b).to.includes({state: 'delayed', remaining: 0})
        expect(b.id).to.equal(918283)

        setTimeout(() => {
          sinon.assert.calledTwice(api._callScenarioAction)
          sinon.assert.calledOnce(api.notifyMacroListeners)
          sinon.assert.calledOnce(api.callApi)
          sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/scenario\/play\/456\?_=/, /GET/)
          done()
        }, 100)
      }

      api._callScenarioAction({id: 456, action: 'play', delay: 10}, callback, 918283)
    })

    // TODO !0
    it('to test complex macro (many steps, delays, ...)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        // TODO
        
        setTimeout(() => {
          // TODO
          done()
        }, 100)
      }

      api._callScenarioAction(
        {id: 456, action: 'play', delay: 10},
        callback,
        54321,
        {id: 123, action: 'on', delay: 20},
        {id: 789, action: 'off', delay: 30}
      )
    })

    it('to test error during Myfox subcall')
  })
})


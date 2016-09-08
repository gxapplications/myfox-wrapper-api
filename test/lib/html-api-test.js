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
        done('Callback should not be called')
      }
      api._callScenarioAction.callsArg(1) // the stub must call the callback just above in return. But the stub should not be called...

      expect(api.callScenarioAction.bind(api, {id: 456, bad: 'key', falsy: 'argument'}, callback)).to.throw(Error, /missing/)
      expect(api.callScenarioAction.bind(api, {id: 456, action: 'bad action', delay: 0}, callback)).to.throw(Error, /must be one of/)
      expect(api.callScenarioAction.bind(api, {id: 'id-not-integer', action: 'off'}, callback)).to.throw(Error, /must be a number/)
      expect(api.callScenarioAction.bind(api, {id: 42, action: 'play', delay: 0}, callback, '42Z', {id: 42, action: 'fifi', delay: 0})).to.throw(Error, /must be one of/)
      sinon.assert.notCalled(api._callScenarioAction)

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
      api._callScenarioAction.restore()
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
        // The id is not scenario ID, but the macro ID!
        expect(b).to.includes({state: 'delayed', remaining: 0})
        expect(b.id).to.equal(918283)

        setTimeout(() => {
          sinon.assert.calledTwice(api._callScenarioAction)
          sinon.assert.alwaysCalledOn(api._callScenarioAction, api)
          sinon.assert.calledOnce(api.notifyMacroListeners)
          sinon.assert.calledOn(api.notifyMacroListeners, api)
          sinon.assert.calledOnce(api.callApi)
          sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/scenario\/play\/456\?_=/, /GET/)
          done()
        }, 100)
      }

      api._callScenarioAction({id: 456, action: 'play', delay: 10}, callback, 918283)
    })

    it('to test complex macro (many steps, delays, ...)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        expect(a).to.be.null
        // The id is not scenario ID, but the macro ID!
        expect(b).to.includes({state: 'delayed', remaining: 2})
        expect(b.id).to.equal(54321)

        setTimeout(() => {
          sinon.assert.callCount(api._callScenarioAction, 6)
          sinon.assert.callCount(api.notifyMacroListeners, 5)
          sinon.assert.callCount(api.callApi, 3)
          done()
        }, 130)
      }

      api._callScenarioAction(
        {id: 456, action: 'play', delay: 10},
        callback,
        54321,
        {id: 123, action: 'on', delay: 20},
        {id: 789, action: 'off', delay: 30}
      )
    })

    it('to test error during Myfox subcall', (done) => {
      api.callApi.returns(Promise.reject(new Error('error test')))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/scenario\/play\/456\?_=/, /GET/)

        expect(a).to.be.not.null
        done()
      }

      api._callScenarioAction({id: 456, action: 'play', delay: 0}, callback)
    })
  })

  describe('callDomoticAction isolated', () => {
    let api = null

    beforeEach(() => {
      api = HtmlApi(myfoxSiteIds)
      sinon.stub(api, '_callDomoticAction')
    })
    afterEach(() => {
      api._callDomoticAction.restore()
    })

    it('to test subcall for very simple case (1 step, no delay by default)', (done) => {
      const callback = () => {
        sinon.assert.calledOnce(api._callDomoticAction)
        sinon.assert.calledWithExactly(api._callDomoticAction, {id: 456, action: 'on', delay: 0}, callback)
        done()
      }
      api._callDomoticAction.callsArg(1) // the stub must call the callback just above in return
      api.callDomoticAction({id: 456, action: 'on'}, callback)
    })

    it('to test subcall for delayed case (1 step, with delay)', (done) => {
      const callback = () => {
        sinon.assert.calledOnce(api._callDomoticAction)
        sinon.assert.calledWith(api._callDomoticAction, {id: 456, action: 'off', delay: 20}, callback)
        done()
      }
      api._callDomoticAction.callsArg(1) // the stub must call the callback just above in return
      api.callDomoticAction({id: 456, action: 'off', delay: 20}, callback)
    })

    it('to test wrong input formats', (done) => {
      const callback = () => {
        done('Callback should not be called')
      }
      api._callDomoticAction.callsArg(1) // the stub must call the callback just above in return. But the stub should not be called...

      expect(api.callDomoticAction.bind(api, {id: 456, bad: 'key', falsy: 'argument'}, callback)).to.throw(Error, /missing/)
      expect(api.callDomoticAction.bind(api, {id: 456, action: 'play', delay: 0}, callback)).to.throw(Error, /must be one of/)
      expect(api.callDomoticAction.bind(api, {id: 'id-not-integer', action: 'off'}, callback)).to.throw(Error, /must be a number/)
      expect(api.callDomoticAction.bind(api, {id: 42, action: 'on', delay: 0}, callback, '42Z', {id: 42, action: 'play', delay: 0})).to.throw(Error, /must be one of/)
      sinon.assert.notCalled(api._callDomoticAction)

      done()
    })
  })

  describe('_callDomoticAction subcall isolated', () => {
    let api = null

    beforeEach(() => {
      api = HtmlApi(myfoxSiteIds)
      sinon.stub(CommonApi.prototype, 'callApi') // Because the method is in the parent class
      sinon.stub(CommonApi.prototype, 'notifyMacroListeners') // Because the method is in the parent class
      sinon.spy(api, '_callDomoticAction') // and not here...
    })
    afterEach(() => {
      CommonApi.prototype.callApi.restore()
      CommonApi.prototype.notifyMacroListeners.restore()
      api._callDomoticAction.restore()
    })

    it('to test simple case (1 step, no delay)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/domotic\/on\/456/, /POST/)

        expect(a).to.be.null
        // The id is not domotic ID, but the macro ID! And null because no need to have one, if just 1 step without delay.
        expect(b).to.deep.equal({id: null, data: 'test', state: 'finished', remaining: 0})
        done()
      }

      api._callDomoticAction({id: 456, action: 'on', delay: 0}, callback)
    })

    it('to test delayed case (1 step, with delay)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        expect(a).to.be.null
        // The id is not scenario ID, but the macro ID!
        expect(b).to.includes({state: 'delayed', remaining: 0})
        expect(b.id).to.equal(918283)

        setTimeout(() => {
          sinon.assert.calledTwice(api._callDomoticAction)
          sinon.assert.alwaysCalledOn(api._callDomoticAction, api)
          sinon.assert.calledOnce(api.notifyMacroListeners)
          sinon.assert.calledOn(api.notifyMacroListeners, api)
          sinon.assert.calledOnce(api.callApi)
          sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/domotic\/on\/456/, /POST/)
          done()
        }, 100)
      }

      api._callDomoticAction({id: 456, action: 'on', delay: 10}, callback, 918283)
    })

    it('to test complex macro (many steps, delays, ...)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        expect(a).to.be.null
        // The id is not scenario ID, but the macro ID!
        expect(b).to.includes({state: 'delayed', remaining: 2})
        expect(b.id).to.equal(54321)

        setTimeout(() => {
          sinon.assert.callCount(api._callDomoticAction, 6)
          sinon.assert.callCount(api.notifyMacroListeners, 5)
          sinon.assert.callCount(api.callApi, 3)
          done()
        }, 130)
      }

      api._callDomoticAction(
        {id: 456, action: 'on', delay: 10},
        callback,
        54321,
        {id: 123, action: 'on', delay: 20},
        {id: 789, action: 'off', delay: 30}
      )
    })

    it('to test error during Myfox subcall', (done) => {
      api.callApi.returns(Promise.reject(new Error('error test')))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/domotic\/on\/456/, /POST/)

        expect(a).to.be.not.null
        done()
      }

      api._callDomoticAction({id: 456, action: 'on', delay: 0}, callback)
    })
  })

  describe('callHeatingAction isolated', () => {
    let api = null

    beforeEach(() => {
      api = HtmlApi(myfoxSiteIds)
      sinon.stub(api, '_callHeatingAction')
    })
    afterEach(() => {
      api._callHeatingAction.restore()
    })

    it('to test subcall for very simple case (1 step, no delay by default)', (done) => {
      const callback = () => {
        sinon.assert.calledOnce(api._callHeatingAction)
        sinon.assert.calledWithExactly(api._callHeatingAction, {id: 456, action: 'eco', delay: 0}, callback)
        done()
      }
      api._callHeatingAction.callsArg(1) // the stub must call the callback just above in return
      api.callHeatingAction({id: 456, action: 'eco'}, callback)
    })

    it('to test subcall for delayed case (1 step, with delay)', (done) => {
      const callback = () => {
        sinon.assert.calledOnce(api._callHeatingAction)
        sinon.assert.calledWith(api._callHeatingAction, {id: 456, action: 'frost', delay: 20}, callback)
        done()
      }
      api._callHeatingAction.callsArg(1) // the stub must call the callback just above in return
      api._callHeatingAction({id: 456, action: 'frost', delay: 20}, callback)
    })

    it('to test wrong input formats', (done) => {
      const callback = () => {
        done('Callback should not be called')
      }
      api._callHeatingAction.callsArg(1) // the stub must call the callback just above in return. But the stub should not be called...

      expect(api.callHeatingAction.bind(api, {id: 456, bad: 'key', falsy: 'argument'}, callback)).to.throw(Error, /missing/)
      expect(api.callHeatingAction.bind(api, {id: 456, action: 'play', delay: 0}, callback)).to.throw(Error, /must be one of/)
      expect(api.callHeatingAction.bind(api, {id: 'id-not-integer', action: 'off'}, callback)).to.throw(Error, /must be a number/)
      expect(api.callHeatingAction.bind(api, {id: 42, action: 'on', delay: 0}, callback, '42Z', {id: 42, action: 'play', delay: 0})).to.throw(Error, /must be one of/)
      sinon.assert.notCalled(api._callHeatingAction)

      done()
    })
  })

  describe('_callHeatingAction subcall isolated', () => {
    let api = null

    beforeEach(() => {
      api = HtmlApi(myfoxSiteIds)
      sinon.stub(CommonApi.prototype, 'callApi') // Because the method is in the parent class
      sinon.stub(CommonApi.prototype, 'notifyMacroListeners') // Because the method is in the parent class
      sinon.spy(api, '_callHeatingAction') // and not here...
    })
    afterEach(() => {
      CommonApi.prototype.callApi.restore()
      CommonApi.prototype.notifyMacroListeners.restore()
      api._callHeatingAction.restore()
    })

    it('to test simple case (1 step, no delay)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/heating\/on\/456/, /POST/)

        expect(a).to.be.null
        // The id is not domotic ID, but the macro ID! And null because no need to have one, if just 1 step without delay.
        expect(b).to.deep.equal({id: null, data: 'test', state: 'finished', remaining: 0})
        done()
      }

      api._callHeatingAction({id: 456, action: 'on', delay: 0}, callback)
    })

    it('to test delayed case (1 step, with delay)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        expect(a).to.be.null
        // The id is not scenario ID, but the macro ID!
        expect(b).to.includes({state: 'delayed', remaining: 0})
        expect(b.id).to.equal(918283)

        setTimeout(() => {
          sinon.assert.calledTwice(api._callHeatingAction)
          sinon.assert.alwaysCalledOn(api._callHeatingAction, api)
          sinon.assert.calledOnce(api.notifyMacroListeners)
          sinon.assert.calledOn(api.notifyMacroListeners, api)
          sinon.assert.calledOnce(api.callApi)
          sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/heating\/eco\/456/, /POST/)
          done()
        }, 100)
      }

      api._callHeatingAction({id: 456, action: 'eco', delay: 10}, callback, 918283)
    })

    it('to test complex macro (many steps, delays, ...)', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        expect(a).to.be.null
        // The id is not scenario ID, but the macro ID!
        expect(b).to.includes({state: 'delayed', remaining: 2})
        expect(b.id).to.equal(54321)

        setTimeout(() => {
          sinon.assert.callCount(api._callHeatingAction, 6)
          sinon.assert.callCount(api.notifyMacroListeners, 5)
          sinon.assert.callCount(api.callApi, 3)
          done()
        }, 130)
      }

      api._callHeatingAction(
        {id: 456, action: 'on', delay: 10},
        callback,
        54321,
        {id: 123, action: 'frost', delay: 20},
        {id: 789, action: 'off', delay: 30}
      )
    })

    it('to test error during Myfox subcall', (done) => {
      api.callApi.returns(Promise.reject(new Error('error test')))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/heating\/on\/456/, /POST/)

        expect(a).to.be.not.null
        done()
      }

      api._callHeatingAction({id: 456, action: 'on', delay: 0}, callback)
    })
  })

  describe('callAlarmLevelAction isolated', () => {
    let api = null

    beforeEach(() => {
      api = HtmlApi(myfoxSiteIds)
      sinon.stub(CommonApi.prototype, 'callApi') // Because the method is in the parent class
      sinon.stub(CommonApi.prototype, 'notifyMacroListeners') // Because the method is in the parent class
    })
    afterEach(() => {
      CommonApi.prototype.callApi.restore()
      CommonApi.prototype.notifyMacroListeners.restore()
    })

    it('to test simple nominative case OFF', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/protection\/seclev\/1/, /GET/)

        expect(a).to.be.null
        // The id is not domotic ID, but the macro ID! And null because no need to have one, if just 1 step without delay.
        expect(b).to.deep.equal({id: null, data: 'test', state: 'finished', remaining: 0})
        done()
      }

      api.callAlarmLevelAction({action: 'off'}, callback)
    })

    it('to test simple nominative case HALF', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/protection\/seclev\/2/, /GET/)

        expect(a).to.be.null
        // The id is not domotic ID, but the macro ID! And null because no need to have one, if just 1 step without delay.
        expect(b).to.deep.equal({id: null, data: 'test', state: 'finished', remaining: 0})
        done()
      }

      api.callAlarmLevelAction({action: 'half'}, callback)
    })

    it('to test simple nominative case ON', (done) => {
      api.callApi.returns(Promise.resolve({data: 'test'}))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/protection\/seclev\/4/, /GET/)

        expect(a).to.be.null
        // The id is not domotic ID, but the macro ID! And null because no need to have one, if just 1 step without delay.
        expect(b).to.deep.equal({id: null, data: 'test', state: 'finished', remaining: 0})
        done()
      }

      api.callAlarmLevelAction({action: 'on'}, callback)
    })

    it('to test error case (wrong level given)', (done) => {
      const callback = () => {
        done('Callback should not be called')
      }

      expect(api.callAlarmLevelAction.bind(api, {bad: 'key', falsy: 'argument'}, callback)).to.throw(Error, /missing/)
      expect(api.callAlarmLevelAction.bind(api, {action: 'falsy'}, callback)).to.throw(Error, /must be one of/)
      sinon.assert.notCalled(api.notifyMacroListeners)
      sinon.assert.notCalled(api.callApi)

      done()
    })

    it('to test error during Myfox subcall', (done) => {
      api.callApi.returns(Promise.reject(new Error('error test')))

      const callback = (a, b) => {
        sinon.assert.notCalled(api.notifyMacroListeners)
        sinon.assert.calledOnce(api.callApi)
        sinon.assert.calledWithMatch(api.callApi, /widget\/\{siteId\}\/protection\/seclev\/4/, /GET/)

        expect(a).to.be.not.null
        done()
      }

      api.callAlarmLevelAction({action: 'on'}, callback)
    })
  })
})

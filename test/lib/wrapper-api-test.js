/* eslint-env mocha */
'use strict'

import { expect } from 'chai'

import MyfoxWrapperApi, { Rest as RestApi } from '../../lib/index'
import MyfoxWrapperApiCommon from '../../lib/common-api'

const myfoxSiteIds = {myfoxSiteIds: [1]}

describe('wrapper-api library instantiation', () => {
  it('Default instance should have \'htmlFirst\' strategy', () => {
    const api = MyfoxWrapperApi(myfoxSiteIds)
    expect(api.options.apiStrategy).to.equal('htmlFirst')
  })

  it('Direct call to rest-api instance must have \'custom\' strategy', () => {
    const api = RestApi(myfoxSiteIds)
    expect(api.options.apiStrategy).to.equal('custom')
  })
  it('Direct call to html-api instance must have \'custom\' strategy', () => {
    const api = RestApi(myfoxSiteIds)
    expect(api.options.apiStrategy).to.equal('custom')
  })

  it('Indirect call to rest-api instance must have \'custom\' strategy', () => {
    const api = MyfoxWrapperApi.rest(myfoxSiteIds)
    expect(api.options.apiStrategy).to.equal('custom')
  })
  it('Indirect call to html-api instance must have \'custom\' strategy', () => {
    const api = MyfoxWrapperApi.html(myfoxSiteIds)
    expect(api.options.apiStrategy).to.equal('custom')
  })

  it('Instance with restFirst strategy must contains a Html fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'restFirst', myfoxSiteIds: [1]})
    expect(api.fallbackApi.constructor.name).to.equal('MyfoxWrapperApiHtml')
  })
  it('Instance with restOnly strategy must not contains a fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'restOnly', myfoxSiteIds: [1]})
    expect(api.fallbackApi).to.be.null
  })
  it('Instance with htmlFirst strategy must contains a Rest fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'htmlFirst', myfoxSiteIds: [1]})
    expect(api.fallbackApi.constructor.name).to.equal('MyfoxWrapperApiRest')
  })
  it('Instance with htmlOnly strategy must not contains a fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'htmlOnly', myfoxSiteIds: [1]})
    expect(api.fallbackApi).to.be.null
  })
})

describe('wrapper-api library options during instantiation', () => {
  it('Default options must be rejected with apiStrategy=\'custom\' from default factory', () => {
    expect(MyfoxWrapperApi.bind(null, MyfoxWrapperApiCommon.defaultOptions())).to.throw(Error)
  })
  it('Default options must be rejected with empty myfoxSiteIds array', () => {
    const options = MyfoxWrapperApiCommon.defaultOptions()
    options.apiStrategy = 'htmlFirst'
    expect(MyfoxWrapperApi.bind(null, options)).to.throw(Error)
  })
  it('Default options must be accepted with other valid apiStrategy from default factory', () => {
    const options = MyfoxWrapperApiCommon.defaultOptions()
    options.apiStrategy = 'htmlFirst'
    options.myfoxSiteIds = [1]
    expect(MyfoxWrapperApi.bind(null, options)).to.not.throw(Error)
  })
  it('Wrong options must be rejected', () => {
    const options = MyfoxWrapperApiCommon.defaultOptions()
    options.apiStrategy = 'unknown value'
    options.myfoxSiteIds = [1]
    expect(MyfoxWrapperApi.bind(null, options)).to.throw(Error)
  })
  it('Empty options must be rejected (will be merged with defaults)', () => {
    expect(MyfoxWrapperApi.bind(null, {})).to.throw(Error)
  })
  it('Empty options (except myfoxSiteIds) must be accepted (will be merged with defaults)', () => {
    expect(MyfoxWrapperApi.bind(null, myfoxSiteIds)).to.not.throw(Error)
  })
})

describe('wrapper-api library auto-authentication system', () => {
  // Build a mock class that extends common-api to test auto-authentication system.
  class MyfoxWrapperApiMock4failures extends MyfoxWrapperApiCommon {
    authenticate (authData, callback) {
      authData = authData || {}
      this.authenticateCounter = (this.authenticateCounter || 0) + 1
      authData.counter = this.authenticateCounter
      // will succeed only the 5th time
      callback((this.authenticateCounter > 4) ? null : 'Failed#' + this.authenticateCounter, authData)
    }
    callDistant (url, method, queryParams, headers, payload, streamParser, resolve, reject, reAuthenticate) {
      resolve(this.authenticateCounter)
    }
  }
  class MyfoxWrapperApiMockNofailure extends MyfoxWrapperApiCommon {
    authenticate (authData, callback) {
      authData = authData || {}
      this.authenticateCounter = (this.authenticateCounter || 0) + 1
      authData.counter = this.authenticateCounter
      // will succeed the first time
      callback(null, authData)
    }
    callDistant (url, method, queryParams, headers, payload, streamParser, resolve, reject, reAuthenticate) {
      resolve(this.authenticateCounter)
    }
  }

  it('Can be turned off from options at instantiation', (done) => {
    const apiMock = new MyfoxWrapperApiMock4failures({autoAuthentication: false, myfoxSiteIds: [1]})
    apiMock.callApi('/test/1', null, null, null, null, null).then((result) => {
      expect(result).to.equal(apiMock.authenticateCounter)
      expect(result).to.be.undefined
      done()
    }).catch((err) => {
      done(err)
    })
  })
  it('Will retry until autoAuthRetryCredits reached and then fails', (done) => {
    const apiMock = new MyfoxWrapperApiMock4failures({autoAuthRetryCredits: 3, myfoxSiteIds: [1]})
    apiMock.callApi('/test/2', null, null, null, null, null).then(() => {
      done('Should not reach this one')
    }).catch((err) => {
      expect(err.previous).to.equal('Failed#' + apiMock.authenticateCounter)
      done()
    })
  })
  it('Will succeed after many failures as the mock should do', (done) => {
    const apiMock = new MyfoxWrapperApiMock4failures({autoAuthRetryCredits: 8, myfoxSiteIds: [1]})
    apiMock.callApi('/test/3', null, null, null, null, null).then((result) => {
      expect(result).to.equal(apiMock.authenticateCounter)
      expect(result).to.equal(5)
      done()
    }).catch((err) => {
      done(err)
    })
  })

  it('Will not re-auth if authValidity is rightly true', (done) => {
    const apiMock = new MyfoxWrapperApiMockNofailure(myfoxSiteIds)
    apiMock.callApi('/test/4a', null, null, null, null).then((result) => {
      expect(result).to.equal(apiMock.authenticateCounter)
      expect(result).to.equal(1)

        // directly call again within validity period.
      apiMock.callApi('/test/4b', null, null, null, null).then((result) => {
        expect(result).to.equal(apiMock.authenticateCounter)
        expect(result).to.equal(1) // does not auth again.
        done()
      }).catch((err) => {
        done(err)
      })
    }).catch((err) => {
      done(err)
    })
  })
  it('Will directly re-auth if authValidity is false', (done) => {
    const apiMock = new MyfoxWrapperApiMockNofailure({authValidity: 1, myfoxSiteIds: [1]})
    apiMock.callApi('/test/5a', null, null, null, null).then((result) => {
      expect(result).to.equal(apiMock.authenticateCounter)
      expect(result).to.equal(1)

      // sleep just 1.1s, to ensure validity is false after first auth.
      setTimeout(() => {
        apiMock.callApi('/test/5b', null, null, null, null).then((result) => {
          expect(result).to.equal(apiMock.authenticateCounter)
          expect(result).to.equal(2) // auth one more time, because validity is just 1s here.
          done()
        }).catch((err) => {
          done(err)
        })
      }, 1100)
    }).catch((err) => {
      done(err)
    })
  })
})

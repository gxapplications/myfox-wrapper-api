/* eslint-env mocha */
'use strict'

import { expect } from 'chai'

import MyfoxWrapperApi, { Rest as RestApi } from '../../lib/index'
import MyfoxWrapperApiCommon from '../../lib/common-api'

describe('wrapper-api library instantiation', () => {
  it('Default instance should have \'htmlFirst\' strategy', () => {
    const api = MyfoxWrapperApi()
    expect(api.options.apiStrategy).to.equal('htmlFirst')
  })

  it('Direct call to rest-api instance must have \'custom\' strategy', () => {
    const api = RestApi()
    expect(api.options.apiStrategy).to.equal('custom')
  })
  it('Direct call to html-api instance must have \'custom\' strategy', () => {
    const api = RestApi()
    expect(api.options.apiStrategy).to.equal('custom')
  })

  it('Indirect call to rest-api instance must have \'custom\' strategy', () => {
    const api = MyfoxWrapperApi.rest()
    expect(api.options.apiStrategy).to.equal('custom')
  })
  it('Indirect call to html-api instance must have \'custom\' strategy', () => {
    const api = MyfoxWrapperApi.html()
    expect(api.options.apiStrategy).to.equal('custom')
  })

  it('Instance with restFirst strategy must contains a Html fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'restFirst'})
    expect(api.fallbackApi.constructor.name).to.equal('MyfoxWrapperApiHtml')
  })
  it('Instance with restOnly strategy must not contains a fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'restOnly'})
    expect(api.fallbackApi).to.be.null
  })
  it('Instance with htmlFirst strategy must contains a Rest fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'htmlFirst'})
    expect(api.fallbackApi.constructor.name).to.equal('MyfoxWrapperApiRest')
  })
  it('Instance with htmlOnly strategy must not contains a fallback strategy', () => {
    const api = MyfoxWrapperApi({apiStrategy: 'htmlOnly'})
    expect(api.fallbackApi).to.be.null
  })
})

describe('wrapper-api library options during instantiation', () => {
  it('Default options must be rejected with apiStrategy=\'custom\' from default factory', () => {
    expect(MyfoxWrapperApi.bind(null, MyfoxWrapperApiCommon.defaultOptions())).to.throw(Error)
  })
  it('Default options must be accepted with other valid apiStrategy from default factory', () => {
    const options = MyfoxWrapperApiCommon.defaultOptions()
    options.apiStrategy = 'htmlFirst'
    expect(MyfoxWrapperApi.bind(null, options)).to.not.throw(Error)
  })
  it('Wrong options must be rejected', () => {
    const options = MyfoxWrapperApiCommon.defaultOptions()
    options.apiStrategy = 'unknown value'
    expect(MyfoxWrapperApi.bind(null, options)).to.throw(Error)
  })
  it('Empty options must be accepted (will be merged with defaults)', () => {
    expect(MyfoxWrapperApi.bind(null, {})).to.not.throw(Error)
  })
})

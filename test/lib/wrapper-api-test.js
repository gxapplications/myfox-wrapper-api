/* eslint-env mocha */
'use strict'

import { expect } from 'chai'

import MyfoxWrapperApi, { Rest as RestApi } from '../../lib/index'

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

  it('Instance with restFirst strategy must contains a Html fallback strategy')
  it('Instance with restOnly strategy must not contains a fallback strategy')
  it('Instance with htmlFirst strategy must contains a Rest fallback strategy')
  it('Instance with htmlOnly strategy must not contains a fallback strategy')
})

describe('wrapper-api library options during instantiation', () => {
  it('Default options must be accepted')
  it('Wrong options must be rejected')
})

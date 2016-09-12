/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import CommonApi from '../../../lib/common-api'
import simpleCodeActionParser from '../../../lib/html-parsers/simple-code-action'

describe('HTML simple-code-action parser', () => {
  it('can parse a \'OK\' response and delivers \'ok\' state', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let parser = simpleCodeActionParser(api)
    parser.on('end', () => {
      expect(parser.status).to.equal('ok')
      done()
    })
    parser.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-action-ok.json')).pipe(parser)
  })

  it('can parse a \'KO\' response and delivers \'ko\' state', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let parser = simpleCodeActionParser(api)
    parser.on('end', () => {
      expect(parser.status).to.equal('ko')
      done()
    })
    parser.on('error', done)
    fs.createReadStream(path.join(__dirname, 'mock-scenario-action-ko.json')).pipe(parser)
  })

  it('can parse an unknown formatted response and triggers error', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let parser = simpleCodeActionParser(api)
    parser.on('end', () => {
      done('Should never be called')
    })
    parser.on('error', (err) => {
      expect(err).to.be.an.instanceof(Error)
      done()
    })
    fs.createReadStream(path.join(__dirname, 'mock-scenario-action-unknown.json')).pipe(parser)
  })

  it('cannot parse an non JSON response and throws error', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let parser = simpleCodeActionParser(api)
    parser.on('end', () => {
      done('Should never be called')
    })
    parser.on('error', (err) => {
      expect(err).to.be.an.instanceof(Error)
      expect(err.message).to.contain('Invalid JSON')
      done()
    })
    fs.createReadStream(path.join(__dirname, 'mock.html')).pipe(parser)
  })
})


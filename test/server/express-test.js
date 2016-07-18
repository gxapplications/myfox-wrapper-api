/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import { Router } from 'express'
import request from 'supertest'

import { default as expressController } from '../../server/controller-express-v1'
import { default as expressApp } from '../../server/application-express'

describe('Express controller', () => {
  it('Gives a Router function', () => {
    expect(expressController).to.be.an.instanceof(Router.constructor)
  })
  // need more tests on controller?
})

describe('Express application', () => {
  it('Has locals', () => {
    expect(expressApp.locals.settings.env).to.exist
  })
  it('Can call controller through a route', (done) => {
    const agent = request.agent(expressApp)
    agent.get('/v1')
      .expect(418) // the Tea pot test
      .end((err) => {
        done(err)
      })
  })
  it('Can call assets through the root route', (done) => {
    const agent = request.agent(expressApp)
    agent.get('/logo.png')
      .expect(200)
      .end((err) => {
        done(err)
      })
  })
  it('Returns 404 for unknown route', (done) => {
    const agent = request.agent(expressApp)
    agent.get('/yay!')
      .expect(404)
      .end((err) => {
        done(err)
      })
  })
})

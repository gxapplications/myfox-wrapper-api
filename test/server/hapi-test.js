/* eslint-env mocha */
'use strict'

import request from 'supertest'

import { default as HapiApp } from '../../server/application-hapi'

describe('Hapi controller', () => {
  it('Gives a register function')
  // need more tests on controller?
})

describe('Hapi application', () => {
  it('Can call controller through a route', (done) => {
    const agent = request.agent(new HapiApp().listener)
    agent.get('/v1')
      .expect(418) // the Tea pot test
      .end((err) => {
        done(err)
      })
  })
  it('Can call assets through the root route', (done) => {
    const agent = request.agent(new HapiApp().listener)
    agent.get('/logo.png')
      .expect(200)
      .end((err) => {
        done(err)
      })
  })
  it('Returns 404 for unknown route', (done) => {
    const agent = request.agent(new HapiApp().listener)
    agent.get('/yay!')
      .expect(404)
      .end((err) => {
        done(err)
      })
  })
})

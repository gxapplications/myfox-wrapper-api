/* eslint-env mocha */
'use strict'

import { expect } from 'chai'

import persistentState from '../../lib/persistent-state'

describe('Persistent state library', () => {
  describe('instantiation', () => {
    it('Is instantiated with a label', () => {
      let ps = persistentState('test1')
      expect(ps.label).to.equal('test1')
    })
    it('Can register listeners and avoid duplications', () => {
      let ps = persistentState('test2')
      expect(ps.listeners).to.be.empty
      let listener1 = (label, v, oldV, date) => {}
      let listener2 = (label, v, oldV, date) => {}

      expect(ps.addListener(listener1)).to.be.true
      expect(ps.listeners).to.have.lengthOf(1)
      expect(ps.listeners).to.include(listener1)

      expect(ps.addListener(listener1)).to.be.false
      expect(ps.listeners).to.have.lengthOf(1)
      expect(ps.listeners).to.include(listener1)

      expect(ps.addListener(listener2)).to.be.true
      expect(ps.listeners).to.have.lengthOf(2)
      expect(ps.listeners).to.include(listener1)
      expect(ps.listeners).to.include(listener2)
    })
    it('Can push a value and keep it', () => {
      let ps = persistentState('test3')
      expect(ps.value).to.be.undefined
      ps.push(42)
      expect(ps.value).to.equal(42)
      ps.push(21)
      expect(ps.value).to.equal(21)
    })
    it('Can push a value and trigger event if changed', (done) => {
      let ps = persistentState('test4')
      let listener3 = (label, v, oldV, date) => {
        done()
      }
      ps.addListener(listener3)
      ps.push(42, false)
    })
    it('Can push a value and does not trigger event if not changed', (done) => {
      let ps = persistentState('test5')
      let listener4 = (label, v, oldV, date) => {
        done('Should not be called')
      }

      ps.push(42, false)
      ps.addListener(listener4)
      ps.push(42, false)
      done()
    })
    it('Can push a value and does not trigger event the first time (undefined)', (done) => {
      let ps = persistentState('test6')
      let listener5 = (label, v, oldV, date) => {
        done('Should not be called')
      }

      ps.addListener(listener5)
      ps.push(42, true)
      done()
    })
  })
})

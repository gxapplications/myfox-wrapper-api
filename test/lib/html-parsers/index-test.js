/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import trumpet from 'trumpet'
import fs from 'fs'
import path from 'path'

import { trumpetInnerText, trumpetClasses, trumpetAttr } from '../../../lib/html-parsers/index'

describe('HTML parsers tools', () => {
  it('trumpetInnerText function  delivers a function', () => {
    const f = trumpetInnerText(() => {})
    expect(f).to.be.a.function
  })

  it('trumpetInnerText delivers a stream parser that calls callback with inner text', (done) => {
    const f = trumpetInnerText((innerText) => {
      expect(innerText).to.equal('my text')
      done()
    })

    const tr = trumpet()
    tr.select('#test1', f)
    fs.createReadStream(path.join(__dirname, 'mock.html')).pipe(tr)
  })

  it('trumpetInnerText delivers a stream parser that calls callback with trimmed text', (done) => {
    const f = trumpetInnerText((innerText) => {
      expect(innerText).to.equal('my text')
      done()
    })

    const tr = trumpet()
    tr.select('#test1b', f)
    fs.createReadStream(path.join(__dirname, 'mock.html')).pipe(tr)
  })

  it('trumpetInnerText delivers a stream parser that never callback for wrong stream format', (done) => {
    const f = trumpetInnerText(() => {
      done('Failed, should not call callback!')
    })

    const tr = trumpet()
    tr.select('#test1', f)
    fs.createReadStream(path.join(__dirname, 'mock.json')).pipe(tr)

    tr.on('end', done)
  })

  it('trumpetClasses function delivers a function', () => {
    const f = trumpetClasses(() => {})
    expect(f).to.be.a.function
  })

  it('trumpetClasses delivers a function that calls callback with classes', (done) => {
    const f = trumpetClasses((classes) => {
      expect(classes).to.include('class_test_1')
      expect(classes).to.include('class_test_2')
      expect(classes).to.have.lengthOf(2)
      done()
    })

    const tr = trumpet()
    tr.select('#test2', f)
    fs.createReadStream(path.join(__dirname, 'mock.html')).pipe(tr)
  })

  it('trumpetAttr function delivers a function', () => {
    const f = trumpetAttr('id', () => {})
    expect(f).to.be.a.function
  })

  it('trumpetAttr delivers a function that calls callback with an attribute value', (done) => {
    const f = trumpetAttr('class', (classes) => {
      expect(classes).to.equal('class_test_1 class_test_2')
      done()
    })

    const tr = trumpet()
    tr.select('#test2', f)
    fs.createReadStream(path.join(__dirname, 'mock.html')).pipe(tr)
  })
})


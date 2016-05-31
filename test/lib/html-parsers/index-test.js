/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import trumpet from 'trumpet'
import fs from 'fs'
import path from 'path'

import { trumpetInnerText } from '../../../lib/html-parsers/index'

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

  it('trumpetInnerText delivers a stream parser that never callback for wrong stream format', (done) => {
    const f = trumpetInnerText(() => {
      done('Failed, should not call callback!')
    })

    const tr = trumpet()
    tr.select('#test1', f)
    fs.createReadStream(path.join(__dirname, 'mock.json')).pipe(tr)

    tr.on('end', done)
  })
})


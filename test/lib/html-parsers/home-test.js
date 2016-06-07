/* eslint-env mocha */
'use strict'

import fs from 'fs'
import path from 'path'

import CommonApi from '../../../lib/common-api'
import homeParser from '../../../lib/html-parsers/home'

describe('HTML Home parser', () => {
  it('can parse a whole page and delivers data', (done) => {
    let api = new CommonApi({'myfoxSiteIds': [1234]})
    let tr = homeParser(api)
    tr.on('end', () => {
      done()
    })
    tr.on('error', done)
    // TODO !0: TU: maybe 3-4 tests with different cases...
    fs.createReadStream(path.join(__dirname, 'mock-home.html')).pipe(tr)
  })

  it('can parse a whole page, then a new one, and triggers persistentState changes', (done) => {
    // TODO !1: 2 mocks with specific differences. Test differences: if triggered in common-api.
    done()
  })
})


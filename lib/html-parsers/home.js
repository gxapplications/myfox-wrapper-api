'use strict'

import trumpet from 'trumpet'
import { trumpetInnerText } from './index'

// TODO !6: example to do

const trumpetParser = trumpet()
trumpetParser.selectAll('span.todo', trumpetInnerText((data) => {
  trumpetParser.myVar = data
}))

export default trumpetParser

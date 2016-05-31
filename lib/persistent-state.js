'use strict'

import deepEqual from 'deep-equal'

// TODO !0: doc et TU sur chaque func dans cette classe !
class PersistentState {
  constructor (label) {
    this.label = label
    this.listeners = []
    this.value = undefined
  }

  addListener (listener) {
    if (listener && this.listeners.indexOf(listener) === -1) {
      this.listeners.push(listener)
      return true
    }
    return false
  }

  push (value, skipUndefined = true) {
    if (!deepEqual(value, this.value)) {
      if (!skipUndefined || this.value !== undefined) {
        let now = new Date()
        this.listeners.forEach((listener) => {
          listener(this.label, value, this.value, now)
        })
      }
      this.value = value
    }
  }
}

// exports
export default function persistentState (label) {
  return new PersistentState(label)
}

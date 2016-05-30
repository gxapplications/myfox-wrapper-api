'use strict'

// exports
export default function baseEvent (label, listenerRegistry) {
  return function trigger (oldValue, newValue) {
      // TODO !1: call listenerRegistry and call every listener for the given label, with both values.
      // listenerRegistry.pouet(label) -> forEach, pouet(oldValue, newValue)
  }
}

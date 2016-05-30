'use strict'

class PersistentState {
  constructor(event) {
    this.event = event
    this.value = undefined
  }

  push(value) {
    // TODO !0 : si this.value va changer et n'etait pas undefined, declenche le this.event(oldValue, newValue), puis update this.value.
  }
}

// exports
export default function persistentState (event) {
  return new PersistentState(event)
}

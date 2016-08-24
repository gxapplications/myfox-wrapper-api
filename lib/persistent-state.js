'use strict'

import deepEqual from 'deep-equal'

/**
 * The persistentState is used to keep state of an element across API requests.
 * The instantiation of this class should be stateful!
 * The state of the element is identified by a unique label, and the comparison is made with a deepEqual.
 * When push() receives a different state of the element, then the listeners will be called.
 * @class PersistentState
 */
class PersistentState {
  constructor (label) {
    this.label = label
    this.listeners = []
    this.value = undefined
  }

  /**
   * Adds a listener to the persistentState.
   * The add will succeed if the listener is not yet registered.
   * The listener is a function, that will be called with the following arguments:
   * - state label
   * - new state value,
   * - previous state value,
   * - a timestamp (creation date of the event)
   *
   * @param  {function} listener  The listener function to call if the state changes.
   * @return {boolean}  True if the add succeed, false if the listener is null or already registered.
   */
  addListener (listener) {
    if (listener && this.listeners.indexOf(listener) === -1) {
      this.listeners.push(listener)
      return true
    }
    return false
  }

  /**
   * Pushes a new state of the element.
   * If the state changed, then listeners will be triggered.
   *
   * FIXME: issue #11, this.value should become immutable after push execution, to avoid this.value to be modified by ref.
   *
   * @param {Object}  value The new state to persist and to compare.
   * @param {boolean} skipUndefined True to avoid listeners to be triggered if the previous state of the element is undefined (often to avoid first push to trigger the event).
   */
  push (value, skipUndefined = true) {
    if (!deepEqual(value, this.value)) {
      if (!skipUndefined || this.value !== undefined) {
        let now = new Date()
        console.info(`Persistent state updated on ${this.label}, sending to ${this.listeners.length} listeners...`)
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

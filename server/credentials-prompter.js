'use strict'

import optimist from 'optimist'
import readlineSync from 'readline-sync'

export default function prompter() {
  let username = null, password = null

  if (optimist.argv.username !== null && optimist.argv.username !== undefined) {
    username = optimist.argv.username
  }
  if (optimist.argv.password !== null && optimist.argv.password !== undefined) {
    password = optimist.argv.password
  }

  // All data already given
  if (username !== null && username.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
        && password !== null) {
    return {username: username, password: password}
  }

  // The server needs credentials
  console.log('The server must know your Myfox credentials to connect to Myfox services. This data will be kept in memory only and will be lost at the server shutdown.'.yellow)

  if (username === null || username.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/) === null) {
    username = readlineSync.questionEMail('Myfox username ?: ', {
      limitMessage: 'Myfox username is the valid e-mail you type on the login screen of myfox.me'
    })
  }
  if (password === null) {
    password = readlineSync.question('Myfox password ?: ', {
      hideEchoBack: true
    })
  }

  console.log('To avoid manual input of these credentials at each startup, you can also pass them through the command line: --username XXX@XXX.XX --password XXX'.green)
  console.log('But be carefull if your shell keep history of your commands'.yellow)

  return {username: username, password: password}
}

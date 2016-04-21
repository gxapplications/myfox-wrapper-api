![myfox-wrapper-logo](https://raw.githubusercontent.com/gxapplications/myfox-wrapper-api/master/lib/assets/logo.png)

An API wrapper to MyFox API to add easy usable features & tools, written in NodeJS.

[![Build Status](https://secure.travis-ci.org/gxapplications/myfox-wrapper-api.png)](http://travis-ci.org/gxapplications/myfox-wrapper-api)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[npm versions and downloads from NPM - TODO]

## What
This API wrapper will serve you full control over a Myfox service (alarm and domotics), calling several features through official Rest APIs, and/or through official html website (parsing data retrieved by a curl robot), and will add many features (mainly precoded macro features).

#### Why to use Rest API?
Because it is the official one, and it's stable. But it does not allow everything... (like editing a scenario for example)

#### Why to use html robot/parser to use Myfox services?
Through the official HTML website, we can do really much more than from the existing rest API (editing scenarii). But this wrapper can be easily broken if the website evolves.

#### So, what to do if I want advantages from both ways?
Use both! This wrapper can switch from one to the other depending on:
- the availability of the Myfox service (website or Rest API up of down), 
- the stability of the website (evolutions will have to be reported here),
- the policy you indicate (HTML only, HTML first, Rest first, Rest only)

(Please see the Quick Start guide below, or the [Wiki Documentation](https://github.com/gxapplications/myfox-wrapper-api/wiki/Start-from-here!) to understand the strategy of the system)

#### And for the bonus, we add macro features!
To let you control Myfox services in time (e.g.: schedule a scenario call 60 minutes after another scenario call, with programmable conditions to cancel a scheduled task; planify changes in a scenario configuration depending on day time, like maximum and minimum temperatures in a complex scenario; ...)

## Quick Start guide
(For a full install guide, please go to the [Wiki home page](https://github.com/gxapplications/myfox-wrapper-api/wiki/Start-from-here!))
TODO: install and usage manual

This repository is for now empty. A first version will come in several weeks.

## License
[MIT license](LICENSE)

[npm-image]: https://img.shields.io/npm/v/express.svg
[npm-url]: https://npmjs.org/package/express

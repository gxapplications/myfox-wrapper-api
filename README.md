![myfox-wrapper-logo](https://raw.githubusercontent.com/gxapplications/myfox-wrapper-api/master/lib/assets/logo.png)

_An API layer to Myfox services to add easy usable features & tools, written in NodeJS._

**This repository is for now empty. A first version will come in several weeks.**


[![Build Status](https://secure.travis-ci.org/gxapplications/myfox-wrapper-api.png)](http://travis-ci.org/gxapplications/myfox-wrapper-api)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[npm versions and downloads from NPM - TODO]


## What
This API layer will serve you full control over a Myfox service (alarm and domotics), calling basic features through official html website (parsing data retrieved by a curl robot), and will add many features (mainly precoded macro features).

#### Why to not use Rest API?
Because the Myfox Rest API is the official one. If you want to use it, then, use it directly. But it does not allow everything (like editing a scenario for example!)...
And I cannot extend the official API due to license limitations from Myfox side.

#### Why to use html robot/parser to use Myfox services?
Through the official HTML website, we can do really much more than from the existing Rest API (editing scenarii, see much more information).
But this layer can be easily broken if the website evolves. This is the counter side of the idea.

#### So, what to do if I want advantages from both ways?
Well, for now, you cannot with this project. Maybe later, I will plan to have dual channel calls (a part through HTML website and another part through Rest API),
but I need the rights from Myfox to do it, to finally have:
- the availability of the Myfox service (website or Rest API up of down), 
- the stability of the website (evolutions will have to be reported here),
- the custom policy you indicate (HTML only, HTML first, Rest first, Rest only)

(Please see the Quick Start guide below, or the [Wiki Documentation](https://github.com/gxapplications/myfox-wrapper-api/wiki/Start-from-here!) to understand the strategy of the system)

#### And for the bonus, we add macro features!
To let you control Myfox services in time (e.g.: schedule a scenario call 60 minutes after another scenario call, with programmable conditions to cancel a scheduled task; planify changes in a scenario configuration depending on day time, like maximum and minimum temperatures in a complex scenario; ...)

_________
## Quick Start guide
(For a full install guide, please go to the [Wiki home page](https://github.com/gxapplications/myfox-wrapper-api/wiki/Start-from-here!))

###### To use myfox-wrapper-api as a library or stand-alone API server in your own project, just install it as dependency:
```bash
npm install --save myfox-wrapper-api
```

_To contribute to the myfox-wrapper-api project as a developer, you should clone the repository, and follow the [CONTRIBUTING.md](CONTRIBUTING.md) document._

###### To try the API with a built-in server, just change your current directory to the root of the dependency, and run:
```bash
npm start
```

At boot time, the server will ask you username and password that you want to use to connect to Myfox services.
This credentials are kept in memory only (not stored anywhere) and lost at server stop.
That means one server instance can serve only 1 Myfox account at runtime!

This instance will deliver a swagger.json file (auto-generated) to expose the API, that you can use with an external Swagger server, or via the built-in Swagger server:
``
TODO
``

TODO:
The default built-in server is made over hapi. There is an express server for example/test purpose only (do not use directly because the I/O data format is not checked and then not protected against attacks). 

_________
## Use the build-in server in production

`TODO` use the server for production purposes, how and what limitations (only one account per server!)

_________
## Use this project as a library

`TODO` direct use as library (not the included server, so how to dev)

_________
## License
[MIT license](LICENSE)

[npm-image]: https://img.shields.io/npm/v/express.svg
[npm-url]: https://npmjs.org/package/express



# myfox-wrapper-api
![myfox-wrapper-logo](https://raw.githubusercontent.com/gxapplications/myfox-wrapper-api/master/lib/assets/logo.png)

An API wrapper to MyFox API to add easy usable features & tools, written in NodeJS.
[Build status; coverage; others, like in https://raw.githubusercontent.com/expressjs/express/master/Readme.md TODO]

## What
This API wrapper will serve you full control over a Myfox service (alarm and domotics), calling several features through official Rest APIs, and/or through official html website (parsing data retrieved by a curl robot), and will add many features (mainly precoded macro features).

#### Why to use Rest API?
Because it is the official one, and its stable. But it does not allow everything... (like editing a scenario for example)

#### Why to use html robot/parser to use Myfox services?
Through the official HTML website, we can do really much more than from the existing rest API (editing scenarii). But this wrapper can be easily broken if the website evolves.

#### So, what to do if I want advantages from both ways?
Use both! This wrapper can switch from one to another depending on:
- the availability of the Myfox service (website or Rest API up of down), 
- the stability of the website (evolutions will have to be reported here),
- the policy you indicate (HTML only, HTML first, Rest first, Rest only)

(Please see the Quick Start guide and Documentation to understand the strategy of the system)

#### And for the bonus, we add macro features!
To let you control Myfox services in time (e.g.: schedule a scenario call 60 minutes after another scenario call, with programmable conditions to cancel a scheduled task; planify changes in a scenario configuration depending on day time, like maximum and minimum temperatures in a complex scenario; ...)

## Quick Start
TODO: install and usage manual

This repository is for now empty. A first version will come in several weeks.

## License
[MIT](LICENSE)
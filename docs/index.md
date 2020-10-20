# Installation & setup

[**Previous:** Contribution guidelines](../CONTRIBUTING.md) |
[**Next:** Releasing a new collection](./release.md)

---

## Prerequisites

This project has a few prerequisites.

* [`Git`](https://git-scm.com/) to download the source code
* When using Docker
  * A local installation of Docker. I'd recommend the
    [Docker Desktop](https://www.docker.com/products/docker-desktop)
    on Mac.
  * [Visual Studio Code]()
  * [The Remote Development Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) for VS Code which allows for development in a containerized Node environment.
* When not using Docker
  * [`Node.js`](https://nodejs.org/) for compilation and linting of the API
    specification. Ideally Node 12 or above.
  * [`Yarn`](https://yarnpkg.com/) is the Node package manager for this project.
    It can be installed with `npm i -g yarn` if Node is installed.

## Download the code

To setup this project, download the source code and install all the
dependencies.

```sh
git clone git@github.com:box/box-postman.git box-postman
cd box-postman
```

## Set up `.env` file

Next, copy the `.env.example` file to create your own environment settings.

```sh
cp .env.example .env
```

This `.env` is mostly ready to go, all that it needs is the API key for the
Postman API.

## Run with Node

To run with Node directly, make sure you have Node 14 or higher installed.

```sh
yarn install
yarn build:all
# or for each language
yarn build en
yarn build jp
```

This final `yarn release:all` command pulls in the English and Japanese OpenAPI
spec and builds a Postman Collection for both.

## Testing & Linting

With the dependencies installed, it is possible to run tests for the OpenAPI to
Postman converter as well as run some basic linters ofer the code.

```sh
yarn test
```

## Building without releasing

It is possible to build a Postman Collection without releasing it to the Postman
API.

```sh
yarn build:all
# or for each language
yarn build en
yarn build jp
```

---

[**Next:** Releasing a new collection](./release.md)

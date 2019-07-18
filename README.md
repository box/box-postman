# Box Postman Collection

[Postman](https://www.getpostman.com/) is a tool that lets you build and test HTTP requests in an easy-to-use interface without configuring a full development environment. Our official Postman Collection allows you to quicly get started with the [Box APIs](https://box.dev/) in Postman.

## The Collections

### Legacy Collection

A legacy, incomplete Postman Collection is available right now.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/768279fde466dffc5511)

### Auto-generated Collection

A updated, up-to-date Postman Collection is currently under development. It will be generated from the OpenAPI 3.0 Specification and automatically update when the specification changes.

A link to this collection will follow at a later date.

## Development

### Requirements

This project requires a [Node](https://nodejs.org/) environment, ideally with `yarn` installed.

### Building the collection

To create a new build of the English and Japanese Postman Collections.

```sh
# clone the repo
git clone https://github.com/box/box-postman.git
# enter the repo
cd box-postman
# install yarn
npm install -g yarn
# create the environment
cp .env.example .env
# install all dependencies
yarn install
# build a specific locale
yarn build en
# build all registered locales
yarn build:all
```

### Testing

Before submitting changes, run our tests to ensure everything still works as expected.

```sh
yarn test
# or listen to changes and run tests
yarn test --watch
```

## Usage & License

This project is provided under the [Apache License 2.0](LICENSE) license.

As this project is a work in progress no rights can be derived from 
this collection and it may change without warning.

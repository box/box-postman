# Box Postman Collection

![CI](https://github.com/box/box-postman/workflows/CI/badge.svg)

[Postman](https://www.getpostman.com/) is a tool that lets you build and test HTTP requests in an easy-to-use interface without configuring a full development environment. Our official Postman Collection allows you to quicly get started with the [Box APIs](https://developer.box.com/) in Postman.

## The Collections

### Auto-generated Collection

A updated, up-to-date Postman Collection is created every few weeks based on
the official Box [OpenAPI 3.0 Specification][openapi].

[![Run in Postman](https://run.pstmn.io/button.svg)][english]

### Japanese Collection.

Additionally a collection is available in Japanese.

[![Run in Postman (Japanese)](https://run.pstmn.io/button.svg)][japanese]

### Legacy Collection

A legacy, incomplete Postman Collection is available right now.

[![Run in Postman](https://run.pstmn.io/button.svg)][legacy]

## Development

### Requirements

This project requires a [Node](https://nodejs.org/) environment, ideally with
`yarn` installed.

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

Before submitting changes, run our tests to ensure everything still works as
expected.

```sh
yarn test
# or listen to changes and run tests
yarn test --watch
```

## Usage & License

Copyright 2020 Box, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

[legacy]: https://app.getpostman.com/run-collection/768279fde466dffc5511 
[openapi]: https://github.com/box/box-openapi
[english]: https://app.getpostman.com/run-collection/62d85bbca8bf7bd5a48b 
[japanese]: https://app.getpostman.com/run-collection/71097146282762048e55 

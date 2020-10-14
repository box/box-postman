# Release a new collection

[**Previous:** Installation & Setup](../index.md) |
[**Next:** Notes for Box employees](./boxers.md)

---

## Building without releasing

It is possible to build a Postman Collection without releasing it to the Postman
API.

```sh
yarn build:all
# or for each language
yarn build en
yarn build jp
```

This is especially useful during development, as this collection can now be
manually imported into the Postman app.

## Building and releasing

It is possible to build & release a postman collection with one command.

```sh
yarn release:all
# or for each language
yarn release en
yarn release jp
```

We recommend using this when the automatic release process can not be used.

**Note:** Publishing a new collection does not automatically make it available
to users via the developer console. To make an updated collection available to a
user, find the collection in the Postman app (`boxdev` user), expand the 3-dot
options menu, select **Share Collection**, switch to the **Embed** tab and
finally click the **Update Link** button.


## Automatic releases

When a new version of the English or Japanese OpenAPI spec if deployed to the
`en` or `jp` branches of the `@box/box-openapi` repository, a dispatch
notification is set to this repository an a GitHub action is triggered to
publish a new version of the `en` and `jp` Postman Collections to the Postman
API.

**Note:** Publishing a new collection does not automatically make it available
to users via the developer console. To make an updated collection available to a
user, find the collection in the Postman app (`boxdev` user), expand the 3-dot
options menu, select **Share Collection**, switch to the **Embed** tab and
finally click the **Update Link** button.

---

[**Next:** Notes for Box employees](./boxers.md)

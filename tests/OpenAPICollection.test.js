const OpenAPI = require('../src/OpenAPI')
const Collection = require('../src/Collection')

const treeFor = (entry) => {
  const result = {}
  if (entry.item === undefined) {
    result[entry.name] = null
  } else {
    result[entry.name] = entry.item.map(item => treeFor(item))
  }
  return result
}

describe('#constructor', () => {
  test('should accept a filename', () => {
    const filename = '/path/to/openapi.json'
    const openapi = new OpenAPI(filename, 'en')
    expect(openapi.filename).toBe(filename)
  })
})

describe('.convert', () => {
  test('should convert an openapi spec to a postman collection', async () => {
    const filename = './tests/examples/box-openapi.json'
    const locale = 'en'
    const openapi = new OpenAPI(filename, locale)
    const openAPISpec = await openapi.process()
    const collection = new Collection(openAPISpec, locale).process()
    expect(collection.item).toHaveLength(52)
    expect(collection.variable).toHaveLength(3)
    expect(collection.item[0].item[0].request.url.host).toBe('{{account.box.com}}')
  })

  test('should exclude items marked as excluded', async () => {
    const filename = './tests/examples/box-openapi-with-exclusions.json'
    const locale = 'en'
    const openapi = new OpenAPI(filename, locale)
    const openAPISpec = await openapi.process()
    const collection = new Collection(openAPISpec, locale).process()

    const tree = treeFor(collection)

    expect(tree).toEqual({
      undefined:
      [{
        Authorization:
           [{ 'Request an access token': null }]
      }]
    })
  })

  test('should sort items by tag', async () => {
    const filename = './tests/examples/box-openapi-with-tags.json'
    const locale = 'en'
    const openapi = new OpenAPI(filename, locale)
    const openAPISpec = await openapi.process()
    const collection = new Collection(openAPISpec, locale).process()

    const tree = treeFor(collection)

    expect(tree).toEqual({
      undefined: [
        {
          Authorization: [
            { 'Authorize a user': null },
            { 'Request an access token': null },
            { 'Revoke an access token': null }
          ]
        },
        { Downloads: [{ 'Download a file': null }] },
        {
          Files: [
            { 'Get a file': null },
            { 'Update a file': null },
            { 'Delete a file': null }
          ]
        },
        { 'Simple Uploads': [{ 'Upload a file version': null }] },
        { 'Trashed Files': [{ 'Restore file': null }] }
      ]
    })
  })

  test('should hard code the base URL', async () => {
    const filename = './tests/examples/box-openapi-with-tags.json'
    const locale = 'en'
    const openapi = new OpenAPI(filename, locale)
    const openAPISpec = await openapi.process()
    const collection = new Collection(openAPISpec, locale).process()

    expect(collection.item[1].item[0].request.url.protocol).toBe('https')
    expect(collection.item[1].item[0].request.url.path).toEqual('/2.0/files/:file_id/content')
    expect(collection.item[1].item[0].request.url.host).toEqual('{{api.box.com}}')
  })

  test('should resolve double slashes in item paths', async () => {
    const filename = './tests/examples/box-openapi.json'
    const locale = 'en'
    const openapi = new OpenAPI(filename, locale)
    const openAPISpec = await openapi.process()
    const collection = new Collection(openAPISpec, locale).process()
    expect(collection.item[0].item[1].request.url.path).toBe('/oauth2/token')
  })
})

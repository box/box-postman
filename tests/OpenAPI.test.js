// const util = require('util')
const OpenAPI = require('../src/OpenAPI')

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
    const openapi = new OpenAPI(filename)
    expect(openapi.filename).toBe(filename)
  })
})

describe('.convert', () => {
  test('should convert an openapi spec to a postman collection', async () => {
    const filename = './tests/examples/box-openapi.json'
    const openapi = new OpenAPI(filename)
    const collection = await openapi.convert()
    expect(collection.item).toHaveLength(31)
  })

  test('should exclude items marked as excluded', async () => {
    const filename = './tests/examples/box-openapi-with-exclusions.json'
    const openapi = new OpenAPI(filename)
    const collection = await openapi.convert()

    const tree = treeFor(collection)

    expect(tree).toEqual({ undefined: [
      { Authorization:
        [{ 'Request an access token': null }] }
    ] })
  })

  test('should sort items by tag', async () => {
    const filename = './tests/examples/box-openapi-with-tags.json'
    const openapi = new OpenAPI(filename)
    const collection = await openapi.convert()

    const tree = treeFor(collection)

    expect(tree).toEqual({ undefined: [
      { Authorization:
        [{ 'Authorize a user': null },
          { 'Request an access token': null },
          { 'Revoke an access token': null }] },
      { Files:
        [{ 'Get a file': null },
          { 'Update a file': null },
          { 'Delete a file': null },
          { 'Download a file': null }] },
      { Trash:
        [{ 'Restore file': null }] },
      { 'File Uploads':
        [{ 'Upload a file version': null }] }
    ] })
  })
})

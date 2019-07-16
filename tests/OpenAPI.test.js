// const util = require('util')
const OpenAPI = require('../src/OpenAPI')

const trie = (entry) => {
  const result = {}
  if (entry.item === undefined) {
    result[entry.name] = null
  } else {
    result[entry.name] = entry.item.map(item => trie(item))
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
    expect(collection.item).toHaveLength(36)
  })

  test('should exclude items marked as excluded', async () => {
    const filename = './tests/examples/box-openapi-with-exclusions.json'
    const openapi = new OpenAPI(filename)
    const collection = await openapi.convert()

    const tree = trie(collection.item[0])
    // console.dir(util.inspect(tree, false, null, true))

    expect(tree).toEqual({ 'Request an access token': null })
  })
})

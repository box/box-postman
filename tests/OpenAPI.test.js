const OpenAPI = require('../src/OpenAPI')

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
    expect(collection.item.length).toBeGreaterThan(30)
  })
})

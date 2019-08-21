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
    const openapi = new OpenAPI(filename, 'en')
    expect(openapi.filename).toBe(filename)
  })
})

describe('.convert', () => {
  test('should convert an openapi spec to a postman collection', async () => {
    const filename = './tests/examples/box-openapi.json'
    const openapi = new OpenAPI(filename, 'en')
    const collection = await openapi.convert()
    expect(collection.item).toHaveLength(11)
  })

  test('should exclude items marked as excluded', async () => {
    const filename = './tests/examples/box-openapi-with-exclusions.json'
    const openapi = new OpenAPI(filename, 'en')
    const collection = await openapi.convert()

    const tree = treeFor(collection)

    expect(tree).toEqual({
      undefined:
      [{
        Basics:
           [{ Authorization: [{ 'Request an access token': null }] }]
      }]
    })
  })

  test('should sort items by tag', async () => {
    const filename = './tests/examples/box-openapi-with-tags.json'
    const openapi = new OpenAPI(filename, 'en')
    const collection = await openapi.convert()

    const tree = treeFor(collection)

    expect(tree).toEqual({
      undefined:
      [{
        Basics:
           [{
             Authorization:
                [{ 'Authorize a user': null },
                  { 'Request an access token': null },
                  { 'Revoke an access token': null }]
           },
           {
             Files:
                [{ 'Get a file': null },
                  { 'Update a file': null },
                  { 'Delete a file': null }]
           }]
      },
      {
        'Downloads & Uploads':
           [{ Downloads: [{ 'Download a file': null }] },
             { 'Simple Uploads': [{ 'Upload a file version': null }] }]
      },
      { Trash: [{ 'Trashed Files': [{ 'Restore file': null }] }] }]
    })
  })

  test('should hard code the base URL', async () => {
    const filename = './tests/examples/box-openapi-with-tags.json'
    const openapi = new OpenAPI(filename, 'en')
    const collection = await openapi.convert()

    expect(collection.variable).toHaveLength(0)
    expect(collection.item[0].item[1].item[0].request.url.protocol).toBe('https')
    expect(collection.item[0].item[1].item[0].request.url.path).toEqual('/2.0/files/:file_id')
    expect(collection.item[0].item[1].item[0].request.url.host).toEqual('api.box.com')
  })
})

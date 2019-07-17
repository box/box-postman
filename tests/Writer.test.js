const Writer = require('../src/Writer')
const fs = require('fs')

jest.mock('fs')

describe('#constructor', () => {
  test('should accept a collection', () => {
    const collection = jest.mock()
    const writer = new Writer(collection)
    expect(writer.collection).toBe(collection)
  })
})

describe('.dump', () => {
  test('should write the collection to disk', () => {
    const collection = { items: [] }
    const writer = new Writer(collection, fs)
    writer.dump('path/to/file')
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'path/to/file',
      '{\n  "items": []\n}'
    )
  })
})

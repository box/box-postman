const { convert, convertAll } = require('../../src/scripts/convert')

const fs = require('fs')
const source = fs.readFileSync('./tests/examples/box-openapi.json')

describe('.convert', () => {
  afterEach(() => {
    delete process.env.LOCALES
    delete process.env.EN_OAS3_REPO
  })

  test('should convert a openapi spec to a collection', async () => {
    process.argv = ['/path/to/node', 'en']
    process.env.LOCALES = 'en'
    process.env.EN_OAS3_REPO = 'https://github.com/box/box-openapi.git#en'

    fs.readFileSync = () => source
    fs.writeFileSync = jest.fn()

    await convert()

    expect(fs.writeFileSync).toHaveBeenCalledWith('./build/collection.en.json', expect.any(String))
  })
})

describe('.convertAll', () => {
  afterEach(() => {
    delete process.env.LOCALES
    delete process.env.EN_OAS3_REPO
  })

  test('should convert all openapi spec to collections', async () => {
    process.env.LOCALES = 'en,jp'
    process.env.EN_OAS3_REPO = 'https://github.com/box/box-openapi.git#en'
    process.env.JP_OAS3_REPO = 'https://github.com/box/box-openapi.git#en'

    fs.readFileSync = () => source
    fs.writeFileSync = jest.fn()

    await convertAll()

    expect(fs.writeFileSync).toHaveBeenCalledWith('./build/collection.en.json', expect.any(String))
    expect(fs.writeFileSync).toHaveBeenCalledWith('./build/collection.jp.json', expect.any(String))
  })
})

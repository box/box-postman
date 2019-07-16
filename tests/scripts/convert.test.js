const convert = require('../../src/scripts/convert')
const OpenAPI = require('../../src/OpenAPI')
const Path = require('../../src/Path')

jest.mock('../../src/OpenAPI')
jest.mock('../../src/Path')

describe('.convert', () => {
  beforeEach(() => {
    OpenAPI.mockClear()
  })

  test('should call the converter with the translated path', () => {
    process.argv = ['/path/to/node', 'en']
    Path.mockImplementationOnce(() => ({
      translate: jest.fn(() => '.sources/68747470733a2f2')
    }))

    convert()

    const openapi = OpenAPI.mock.instances[0]
    expect(openapi.convert).toHaveBeenCalled()
    expect(openapi.constructor).toHaveBeenCalledWith('.sources/68747470733a2f2/openapi.json')

    const path = Path.mock.instances[0]
    expect(path.constructor).toHaveBeenCalledWith('OAS3', 'en')
  })
})

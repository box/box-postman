const Path = require('../src/Path')

describe('#constructor', () => {
  test('should accept a locale and type', () => {
    const path = new Path('OAS3', 'en')
    expect(path.locale).toBe('en')
    expect(path.type).toBe('OAS3')
  })

  test('should raise an error without a locale or prefix', () => {
    expect(() => new Path()).toThrowError(/No type found/)
    expect(() => new Path('')).toThrowError(/No type found/)
    expect(() => new Path('OAS3')).toThrowError(/No locale found/)
    expect(() => new Path('OAS3', '')).toThrowError(/No locale found/)
  })
})

describe('.translate', () => {
  afterEach(() => {
    delete process.env.LOCALES
    delete process.env.EN_OAS3_REPO
    delete process.env.ENEN_OAS3_PATH_OAS3_REPO
  })

  test('should translate a locale to a local path', () => {
    process.env.EN_OAS3_REPO = 'https://github.com/box/box-openapi.git#en'
    process.env.LOCALES = 'en'

    const path = new Path('OAS3', 'en')
    path.translate()
    expect(path.folder).toEqual('./.sources/68747470733a2f2f6769746875622e636f6d2f626f782f626f782d6f70656e6170692e67697423656e/')
  })

  it('should validate that the locale is registered', () => {
    process.env.LOCALES = 'en'

    const path = new Path('OAS3', 'jp')
    expect(() => path.translate()).toThrowError(/locale not found/)
  })

  it('should validate that the locale is registered even if no locales set', () => {
    const path = new Path('OAS3', 'jp')
    expect(() => path.translate()).toThrowError(/locale not found/)
  })

  it('should return a path if we have a registered path instead of a repo', () => {
    process.env.EN_OAS3_PATH = '/path/to/folder'
    process.env.LOCALES = 'en'

    const path = new Path('OAS3', 'en')
    path.translate()
    expect(path.folder).toEqual('/path/to/folder')
    expect(path.isLocal).toBeTruthy()
  })
})

const { pullAll } = require('../../src/scripts/pull')

const cp = require('child_process')
const fs = require('fs-extra')

jest.mock('child_process')
jest.mock('fs')

describe('.pullAll', () => {
  afterEach(() => {
    delete process.env.LOCALES
    delete process.env.EN_OAS3_REPO
    delete process.env.JP_OAS3_REPO
  })

  test('should clone specs', async () => {
    process.env.LOCALES = 'en,jp'
    process.env.EN_OAS3_REPO = 'https://github.com/box/box-openapi.git#en'
    process.env.JP_OAS3_PATH = '/Users/cbetta/code/box/box-openapi/dev/'

    console.log = jest.fn()
    fs.existsSync.mockReturnValue(false)
    cp.spawnSync.mockReturnValue({
      stderr: Buffer.alloc(0),
      stdout: Buffer.alloc(0)
    })

    await pullAll()

    expect(cp.spawnSync).toHaveBeenCalledWith('git', ['clone', '--depth', 1, '--branch', 'en', 'https://github.com/box/box-openapi.git', './.sources/68747470733a2f2f6769746875622e636f6d2f626f782f626f782d6f70656e6170692e67697423656e/'])
  })
})

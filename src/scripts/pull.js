require('dotenv').config()

const fs = require('fs')
const Path = require('../Path')
const Git = require('../Git')

const OPENAPI_TYPE = 'OAS3'

const pull = async (locale, _fs = fs) => {
  const path = new Path(OPENAPI_TYPE, locale)
  if (path.isLocal) { return }

  path.translate()
  const git = new Git(path, _fs)
  await git.pull()
}

const pullAll = async (_fs = fs) => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => pull(locale, _fs)))
}

module.exports = {
  pullAll,
  pull
}

require('dotenv').config()

const Path = require('../Path')
const Git = require('../Git')

const OPENAPI_TYPE = 'OAS3'

const pull = async (locale) => {
  const path = new Path(OPENAPI_TYPE, locale)
  if (path.isLocal) { return }

  path.translate()
  const git = new Git(path)
  await git.pull()
}

const pullAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => pull(locale)))
}

module.exports = {
  pullAll,
  pull
}

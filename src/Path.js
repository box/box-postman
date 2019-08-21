const SOURCES_PATH = '.sources'

class Path {
  constructor (type, locale) {
    if (!type) { throw Error('Missing parameter: No type found') }
    if (!locale) { throw Error('Missing parameter: No locale found') }

    this.type = type
    this.locale = locale

    this.LOCALE = locale.toUpperCase()

    this.folder = process.env[`${this.LOCALE}_${this.type}_PATH`]
    this.isLocal = !!this.folder
  }

  translate () {
    this.validate()

    if (this.isLocal) { return }

    const repo = process.env[`${this.LOCALE}_${this.type}_REPO`]
    const [source, branch] = repo.split('#')
    const id = Buffer.from(repo).toString('hex')

    this.folder = `./${SOURCES_PATH}/${id}/`
    this.source = source
    this.branch = branch
  }

  // PRIVATE

  validate () {
    const LOCALES = process.env.LOCALES || ''
    const locales = LOCALES.split(',')
    if (locales.includes(this.locale)) { return }
    throw Error('Invalid parameter: locale not found in registered environment variables')
  }
}

module.exports = Path

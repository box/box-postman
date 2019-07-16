const SOURCES_PATH = `.sources`

class Path {
  constructor(type, locale) {
    if (!type) { throw 'Missing parameter: No type found' }
    if (!locale) { throw 'Missing parameter: No locale found' }

    this.type = type
    this.locale = locale
  }

  translate() {
    this.validate()

    const LOCALE = this.locale.toUpperCase()
    const path = process.env[`${LOCALE}_${this.type}_PATH`]
    if (path) { return path }

    const repo = process.env[`${LOCALE}_${this.type}_REPO`]
    const id = Buffer.from(repo).toString('hex')
    return `./${SOURCES_PATH}/${id}/`
  }

  // PRIVATE 

  validate() {
    const LOCALES = process.env.LOCALES || ''
    const locales = LOCALES.split(',')
    if (locales.includes(this.locale)) { return }
    throw "Invalid parameter: locale not found in registered environment variables"
  }
}

module.exports = Path
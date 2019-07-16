require('dotenv').config()

const fs = require('fs-extra')
const { spawnSync } = require('child_process')

// define all locales
const locales = process.env.LOCALES.split(',')

// pull in all repos
const pull = async (type, list) => {
  list.forEach(async item => {
    const ITEM = item.toUpperCase()

    // skip if this is a path
    const path = process.env[`${ITEM}_${type}_PATH`]
    if (path) { return }

    // determine the repo name and destination
    const repo = process.env[`${ITEM}_${type}_REPO`]
    const [source, branch] = repo.split('#')
    const id = Buffer.from(repo).toString('hex')
    const destination = `./.sources/${id}/`

    // if the clone already exists, pull
    if (fs.existsSync(destination)) {
      const { stderr, stdout } = await spawnSync('git',
        ['pull'], { cwd: destination })

      // eslint-disable-next-line
      console.log(stderr.toString())
      // eslint-disable-next-line
      console.log(stdout.toString())

      // otherwise perform a new clone
    } else {
      const { stderr, stdout } = await spawnSync('git',
        ['clone', '--depth', 1, '--branch', branch, source, destination])

      // eslint-disable-next-line
      console.log(stderr.toString())
      // eslint-disable-next-line
      console.log(stdout.toString())
    }
  })
}

pull('OAS3', locales)

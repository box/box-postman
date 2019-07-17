const { spawnSync } = require('child_process')
const fs = require('fs')

class Git {
  constructor (path) {
    this.destination = path.folder
    this.branch = path.branch
    this.source = path.source
  }

  async pull () {
    // if the clone already exists, pull
    if (fs.existsSync(this.destination)) {
      const { stderr, stdout } =
        await spawnSync('git', ['pull'], { cwd: this.destination })

      console.log(stderr.toString())
      console.log(stdout.toString())

    // otherwise perform a new clone
    } else {
      const { stderr, stdout } =
        await spawnSync('git',
          ['clone', '--depth', 1, '--branch', this.branch, this.source, this.destination])

      console.log(stderr.toString())
      console.log(stdout.toString())
    }
  }
}

module.exports = Git

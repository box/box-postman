const fs = require('fs')

class Writer {
  constructor (collection) {
    this.collection = collection
  }

  dump (folder, filename) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder)
    }

    fs.writeFileSync(
      `${folder}/${filename}`,
      JSON.stringify(this.collection, null, 2)
    )
  }
}

module.exports = Writer

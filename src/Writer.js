const fs = require('fs')

class Writer {
  constructor(collection) {
    this.collection = collection
  }

  dump(filename) {
    fs.writeFileSync(
      filename,
      JSON.stringify(this.collection, null, 2)
    )
  }
}

module.exports = Writer
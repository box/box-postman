class Writer {
  constructor (collection, fs) {
    this.collection = collection
    this.fs = fs
  }

  dump (filename) {
    this.fs.writeFileSync(
      filename,
      JSON.stringify(this.collection, null, 2)
    )
  }
}

module.exports = Writer

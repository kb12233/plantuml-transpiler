class Enum {
  constructor(name, packageName = null) {
    this.name = name;
    this.packageName = packageName;
    this.values = []; // Array of strings representing enum values
  }
}

module.exports = Enum;
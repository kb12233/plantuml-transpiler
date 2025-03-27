class Interface {
  constructor(name, packageName = null) {
    this.name = name;
    this.packageName = packageName;
    this.methods = []; // Array of Method objects
    this.generics = []; // Array of strings representing generic type parameters
  }
}

module.exports = Interface;
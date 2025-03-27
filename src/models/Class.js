class Class {
  constructor(name, isAbstract = false, packageName = null) {
    this.name = name;
    this.isAbstract = isAbstract;
    this.packageName = packageName;
    this.attributes = []; // Array of Attribute objects
    this.methods = []; // Array of Method objects
    this.constructors = []; // Array of Method objects specifically for constructors
    this.generics = []; // Array of strings representing generic type parameters
  }
}

module.exports = Class;
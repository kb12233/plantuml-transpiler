class Method {
  constructor(name, returnType, parameters = [], visibility = 'public', isStatic = false, isAbstract = false) {
    this.name = name;
    this.returnType = returnType;
    this.parameters = parameters; // Array of Parameter objects
    this.visibility = visibility; // 'public', 'private', 'protected', 'package'
    this.isStatic = isStatic;
    this.isAbstract = isAbstract;
  }
}

module.exports = Method;
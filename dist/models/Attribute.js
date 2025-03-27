"use strict";

class Attribute {
  constructor(name, type, visibility = 'private', isStatic = false, isFinal = false) {
    this.name = name;
    this.type = type;
    this.visibility = visibility; // 'public', 'private', 'protected', 'package'
    this.isStatic = isStatic;
    this.isFinal = isFinal;
  }
}
module.exports = Attribute;
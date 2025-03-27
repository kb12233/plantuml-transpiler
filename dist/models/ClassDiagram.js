"use strict";

class ClassDiagram {
  constructor() {
    this.classes = [];
    this.interfaces = [];
    this.enums = [];
    this.relationships = [];
    this.packages = {};
  }
}
module.exports = ClassDiagram;
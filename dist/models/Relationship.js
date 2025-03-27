"use strict";

class Relationship {
  constructor(sourceClass, targetClass, type, label = '') {
    this.sourceClass = sourceClass;
    this.targetClass = targetClass;
    this.type = type; // 'inheritance', 'implementation', 'association', 'aggregation', 'composition', 'dependency'
    this.label = label; // Relationship description (e.g. multiplicity)
  }
}
module.exports = Relationship;
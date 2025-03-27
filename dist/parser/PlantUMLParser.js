"use strict";

const ClassDiagram = require('../models/ClassDiagram');
const Class = require('../models/Class');
const Interface = require('../models/Interface');
const Enum = require('../models/Enum');
const Attribute = require('../models/Attribute');
const Method = require('../models/Method');
const Parameter = require('../models/Parameter');
const Relationship = require('../models/Relationship');
class PlantUMLParser {
  constructor() {
    this.currentPackage = null;
  }
  parse(plantUmlCode) {
    const diagram = new ClassDiagram();

    // Remove comments and sanitize input
    plantUmlCode = this.sanitizeInput(plantUmlCode);

    // Process each line
    let currentEntity = null;
    let inEntityDefinition = false;
    let bracketCount = 0;
    const lines = plantUmlCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;

      // Check for package definition
      if (line.startsWith('package ')) {
        const packageMatch = line.match(/^package\s+"?([^"{}]+)"?\s*{?$/);
        if (packageMatch) {
          this.currentPackage = packageMatch[1].trim();
          if (line.endsWith('{')) bracketCount++;
          diagram.packages[this.currentPackage] = [];
        }
      }
      // Check for end of package
      else if (line === '}' && bracketCount > 0) {
        bracketCount--;
        if (bracketCount === 0) {
          this.currentPackage = null;
        }
      }
      // Class, Interface, or Enum definition
      else if (this.isEntityDefinitionStart(line)) {
        const {
          entityType,
          entity
        } = this.parseEntityStart(line, diagram);
        if (entity) {
          currentEntity = entity;
          inEntityDefinition = true;

          // Add to current package if applicable
          if (this.currentPackage && diagram.packages[this.currentPackage]) {
            diagram.packages[this.currentPackage].push(entity.name);
          }

          // Check if the definition continues on the same line
          if (line.includes('{')) {
            bracketCount++;
          }
        }
      }
      // Check for end of entity definition
      else if (inEntityDefinition && line === '}') {
        inEntityDefinition = false;
        currentEntity = null;
        bracketCount--;
      }
      // Check for attribute or method inside entity definition
      else if (inEntityDefinition && currentEntity) {
        // Check if it's a member (attribute or method)
        if (this.isMemberDefinition(line)) {
          this.parseMember(line, currentEntity);
        }
        // Check if it's an enum value
        else if (currentEntity.values !== undefined) {
          // This is an enum value
          const enumValue = line.replace(/,$/, '').trim();
          if (enumValue) {
            currentEntity.values.push(enumValue);
          }
        }
      }
      // Check for relationship
      else if (this.isRelationship(line)) {
        const relationship = this.parseRelationship(line);
        if (relationship) {
          diagram.relationships.push(relationship);
        }
      }
    }
    return diagram;
  }
  sanitizeInput(plantUmlCode) {
    // Remove @startuml and @enduml
    plantUmlCode = plantUmlCode.replace(/@startuml.*?(\r?\n|\r)/g, '');
    plantUmlCode = plantUmlCode.replace(/@enduml.*?(\r?\n|\r)?/g, '');

    // Remove single-line comments
    plantUmlCode = plantUmlCode.replace(/'.*?(\r?\n|\r)/g, '\n');

    // Remove multi-line comments
    plantUmlCode = plantUmlCode.replace(/\/\*[\s\S]*?\*\//g, '');
    return plantUmlCode;
  }
  isEntityDefinitionStart(line) {
    return line.match(/^(abstract\s+)?class\s+\w+/) || line.match(/^interface\s+\w+/) || line.match(/^enum\s+\w+/);
  }
  parseEntityStart(line, diagram) {
    // Class definition
    const classMatch = line.match(/^(abstract\s+)?class\s+(\w+)(?:<(\w+(?:,\s*\w+)*)>)?/);
    if (classMatch) {
      const isAbstract = !!classMatch[1];
      const className = classMatch[2];
      const generics = classMatch[3] ? classMatch[3].split(/,\s*/) : [];
      const newClass = new Class(className, isAbstract, this.currentPackage);
      newClass.generics = generics;
      diagram.classes.push(newClass);
      return {
        entityType: 'class',
        entity: newClass
      };
    }

    // Interface definition
    const interfaceMatch = line.match(/^interface\s+(\w+)(?:<(\w+(?:,\s*\w+)*)>)?/);
    if (interfaceMatch) {
      const interfaceName = interfaceMatch[1];
      const generics = interfaceMatch[2] ? interfaceMatch[2].split(/,\s*/) : [];
      const newInterface = new Interface(interfaceName, this.currentPackage);
      newInterface.generics = generics;
      diagram.interfaces.push(newInterface);
      return {
        entityType: 'interface',
        entity: newInterface
      };
    }

    // Enum definition
    const enumMatch = line.match(/^enum\s+(\w+)/);
    if (enumMatch) {
      const enumName = enumMatch[1];
      const newEnum = new Enum(enumName, this.currentPackage);
      diagram.enums.push(newEnum);
      return {
        entityType: 'enum',
        entity: newEnum
      };
    }
    return {
      entityType: null,
      entity: null
    };
  }
  isMemberDefinition(line) {
    // Check if line defines a member (attribute or method)
    return line.match(/^\s*[+\-#~]/) !== null;
  }
  parseMember(line, entity) {
    // Remove leading/trailing spaces and the opening/closing curly braces if present
    line = line.trim().replace(/\s*\{\s*$/, '');

    // Check if it's a constructor
    const constructorMatch = line.match(/^\s*([\+\-#~])\s*(\w+)\s*\((.*?)\)\s*$/);
    if (constructorMatch && constructorMatch[2] === entity.name) {
      const visibility = this.parseVisibility(constructorMatch[1]);
      const parameters = this.parseParameters(constructorMatch[3]);
      const constructor = new Method(entity.name, null, parameters, visibility);
      if (entity.constructors) {
        entity.constructors.push(constructor);
      }
      return;
    }

    // Check if it's a method
    const methodMatch = line.match(/^\s*([\+\-#~])(?:\s*\{(abstract|static)\})?\s*(\w+)\s*\((.*?)\)(?:\s*:\s*(\w+(?:<.*>)?))?/);
    if (methodMatch) {
      const visibility = this.parseVisibility(methodMatch[1]);
      const modifier = methodMatch[2] || '';
      const isAbstract = modifier === 'abstract';
      const isStatic = modifier === 'static';
      const name = methodMatch[3];
      const parameters = this.parseParameters(methodMatch[4]);
      const returnType = methodMatch[5] || 'void';
      const method = new Method(name, returnType, parameters, visibility, isStatic, isAbstract);
      entity.methods.push(method);
      return;
    }

    // Check if it's an attribute
    const attributeMatch = line.match(/^\s*([\+\-#~])(?:\s*\{(static|final)\})?\s*(\w+)(?:\s*:\s*(\w+(?:<.*>)?))?/);
    if (attributeMatch && entity.attributes) {
      const visibility = this.parseVisibility(attributeMatch[1]);
      const modifier = attributeMatch[2] || '';
      const isStatic = modifier === 'static';
      const isFinal = modifier === 'final';
      const name = attributeMatch[3];
      const type = attributeMatch[4] || 'Object';
      const attribute = new Attribute(name, type, visibility, isStatic, isFinal);
      entity.attributes.push(attribute);
    }
  }
  parseVisibility(symbol) {
    switch (symbol) {
      case '+':
        return 'public';
      case '-':
        return 'private';
      case '#':
        return 'protected';
      case '~':
        return 'package';
      default:
        return 'public';
    }
  }
  parseParameters(paramsStr) {
    if (!paramsStr || paramsStr.trim() === '') return [];

    // Split by commas, but not inside angle brackets (for generic types)
    const params = [];
    let buffer = '';
    let angleBracketCount = 0;
    for (let i = 0; i < paramsStr.length; i++) {
      const char = paramsStr[i];
      if (char === '<') {
        angleBracketCount++;
        buffer += char;
      } else if (char === '>') {
        angleBracketCount--;
        buffer += char;
      } else if (char === ',' && angleBracketCount === 0) {
        params.push(buffer.trim());
        buffer = '';
      } else {
        buffer += char;
      }
    }
    if (buffer.trim()) {
      params.push(buffer.trim());
    }
    return params.map(paramStr => {
      const [name, type] = paramStr.split(':').map(s => s.trim());
      return new Parameter(name, type || 'Object');
    });
  }
  isRelationship(line) {
    return line.includes('<|--') ||
    // inheritance
    line.includes('<|..') ||
    // implementation
    line.includes('-->') ||
    // association
    line.includes('o-->') ||
    // aggregation
    line.includes('*-->') ||
    // composition
    line.includes('..>') ||
    // dependency
    line.includes('-->') // simple association
    ;
  }
  parseRelationship(line) {
    // Extract relationship parts (handle labels too)
    const parts = line.split(/\s+/);
    let sourceClass,
      targetClass,
      type,
      label = '';

    // Extract label if present (in quotes)
    const labelMatch = line.match(/"([^"]+)"/);
    if (labelMatch) {
      label = labelMatch[1];
      // Remove the label part from the line for easier parsing
      line = line.replace(/"[^"]+"\s*/, '');
    }

    // Check relationship type
    if (line.includes('<|--')) {
      // Inheritance: Child <|-- Parent
      const match = line.match(/(\w+)\s+<\|--\s+(\w+)/);
      if (match) {
        sourceClass = match[1]; // Child
        targetClass = match[2]; // Parent
        type = 'inheritance';
      }
    } else if (line.includes('<|..')) {
      // Implementation: Class <|.. Interface
      const match = line.match(/(\w+)\s+<\|\.\.+\s+(\w+)/);
      if (match) {
        sourceClass = match[1]; // Class
        targetClass = match[2]; // Interface
        type = 'implementation';
      }
    } else if (line.includes('o-->')) {
      // Aggregation: Container o--> Element
      const match = line.match(/(\w+)\s+o-->\s+(\w+)/);
      if (match) {
        sourceClass = match[1]; // Container
        targetClass = match[2]; // Element
        type = 'aggregation';
      }
    } else if (line.includes('*-->')) {
      // Composition: Container *--> Element
      const match = line.match(/(\w+)\s+\*-->\s+(\w+)/);
      if (match) {
        sourceClass = match[1]; // Container
        targetClass = match[2]; // Element
        type = 'composition';
      }
    } else if (line.includes('..>')) {
      // Dependency: User ..> Service
      const match = line.match(/(\w+)\s+\.\.>\s+(\w+)/);
      if (match) {
        sourceClass = match[1]; // User
        targetClass = match[2]; // Service
        type = 'dependency';
      }
    } else if (line.includes('-->')) {
      // Association: Class --> OtherClass
      const match = line.match(/(\w+)\s+-->\s+(\w+)/);
      if (match) {
        sourceClass = match[1];
        targetClass = match[2];
        type = 'association';
      }
    }
    if (sourceClass && targetClass && type) {
      return new Relationship(sourceClass, targetClass, type, label);
    }
    return null;
  }
}
module.exports = PlantUMLParser;
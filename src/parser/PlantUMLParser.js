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
    let packageBracketCount = 0; // Track package nesting level
    let entityBracketCount = 0;  // Track entity nesting level separately
    
    const lines = plantUmlCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length === 0) continue;
      
      // Check for package definition
      if (line.startsWith('package ')) {
        const packageMatch = line.match(/^package\s+"?([^"{}]+)"?\s*{?$/);
        if (packageMatch) {
          this.currentPackage = packageMatch[1].trim();
          if (line.endsWith('{')) {
            packageBracketCount++;
          }
          diagram.packages[this.currentPackage] = [];
        }
      } 
      // Check for end of package - only if we're not inside an entity
      else if (line === '}' && !inEntityDefinition && packageBracketCount > 0) {
        packageBracketCount--;
        if (packageBracketCount === 0) {
          this.currentPackage = null;
        }
      }
      // Class, Interface, or Enum definition
      else if (this.isEntityDefinitionStart(line)) {
        const { entityType, entity } = this.parseEntityStart(line, diagram);
        
        if (entity) {
          currentEntity = entity;
          inEntityDefinition = true;
          
          // Add to current package if applicable
          if (this.currentPackage && diagram.packages[this.currentPackage]) {
            diagram.packages[this.currentPackage].push(entity.name);
          }
          
          // Check if the definition continues on the same line
          if (line.includes('{')) {
            entityBracketCount++;
          }
        }
      }
      // Check for end of entity definition
      else if (line === '}' && inEntityDefinition) {
        // Decrement entity bracket count
        if (entityBracketCount > 0) {
          entityBracketCount--;
        }
        
        // If entity bracket count reaches 0, we're done with the entity
        if (entityBracketCount === 0) {
          inEntityDefinition = false;
          currentEntity = null;
        }
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
      // Check for relationship - only if we're not inside an entity
      else if (!inEntityDefinition && this.isRelationship(line)) {
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
    return (
      line.match(/^(abstract\s+)?class\s+\w+/) ||
      line.match(/^interface\s+\w+/) ||
      line.match(/^enum\s+\w+/)
    );
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
      
      return { entityType: 'class', entity: newClass };
    }
    
    // Interface definition
    const interfaceMatch = line.match(/^interface\s+(\w+)(?:<(\w+(?:,\s*\w+)*)>)?/);
    if (interfaceMatch) {
      const interfaceName = interfaceMatch[1];
      const generics = interfaceMatch[2] ? interfaceMatch[2].split(/,\s*/) : [];
      
      const newInterface = new Interface(interfaceName, this.currentPackage);
      newInterface.generics = generics;
      diagram.interfaces.push(newInterface);
      
      return { entityType: 'interface', entity: newInterface };
    }
    
    // Enum definition
    const enumMatch = line.match(/^enum\s+(\w+)/);
    if (enumMatch) {
      const enumName = enumMatch[1];
      
      const newEnum = new Enum(enumName, this.currentPackage);
      diagram.enums.push(newEnum);
      
      return { entityType: 'enum', entity: newEnum };
    }
    
    return { entityType: null, entity: null };
  }
  
  isMemberDefinition(line) {
    // Check if line defines a member (attribute or method)
    // This matches members with visibility modifiers (+, -, #, ~)
    // or members without visibility modifiers, including those starting with modifiers
    return line.match(/^\s*([+\-#~]|\{[\w]+\}|\w+\s*:|\w+\s*\()/) !== null;
  }
  
  parseMember(line, entity) {
    // Remove leading/trailing spaces and the opening/closing curly braces if present
    line = line.trim().replace(/\s*\{\s*$/, '');
    
    // Get all modifiers from line - enhanced to support multiple modifiers
    const modifiers = this.extractModifiers(line);
    
    // Remove modifiers from line for cleaner parsing
    let cleanedLine = this.removeModifiers(line);
    
    // First, check if it's a constructor (with or without visibility modifier)
    const constructorWithVisibilityMatch = cleanedLine.match(/^\s*([\+\-#~])\s*(\w+)\s*\((.*?)\)\s*$/);
    if (constructorWithVisibilityMatch && constructorWithVisibilityMatch[2] === entity.name) {
      const visibility = this.parseVisibility(constructorWithVisibilityMatch[1]);
      const parameters = this.parseParameters(constructorWithVisibilityMatch[3]);
      
      const constructor = new Method(entity.name, null, parameters, visibility);
      if (entity.constructors) {
        entity.constructors.push(constructor);
      }
      return;
    }
    
    // Check for constructor without visibility modifier
    const constructorWithoutVisibilityMatch = cleanedLine.match(/^\s*(\w+)\s*\((.*?)\)\s*$/);
    if (constructorWithoutVisibilityMatch && constructorWithoutVisibilityMatch[1] === entity.name) {
      // Default visibility for constructors is public in many languages
      const visibility = 'public';
      const parameters = this.parseParameters(constructorWithoutVisibilityMatch[2]);
      
      const constructor = new Method(entity.name, null, parameters, visibility);
      if (entity.constructors) {
        entity.constructors.push(constructor);
      }
      return;
    }
    
    // Check if it's a method with visibility modifier
    const methodWithVisibilityMatch = cleanedLine.match(/^\s*([\+\-#~])\s*(\w+)\s*\((.*?)\)(?:\s*:\s*(\w+(?:<.*>)?))?/);
    if (methodWithVisibilityMatch) {
      const visibility = this.parseVisibility(methodWithVisibilityMatch[1]);
      const name = methodWithVisibilityMatch[2];
      const parameters = this.parseParameters(methodWithVisibilityMatch[3]);
      const returnType = methodWithVisibilityMatch[4] || 'void';
      
      // Apply modifiers
      const isAbstract = modifiers.includes('abstract');
      const isStatic = modifiers.includes('static');
      
      const method = new Method(name, returnType, parameters, visibility, isStatic, isAbstract);
      entity.methods.push(method);
      return;
    }
    
    // Check if it's a method without visibility modifier
    const methodWithoutVisibilityMatch = cleanedLine.match(/^\s*(\w+)\s*\((.*?)\)(?:\s*:\s*(\w+(?:<.*>)?))?/);
    if (methodWithoutVisibilityMatch && cleanedLine.trim() !== '') {
      // Default visibility for methods without modifiers is public in PlantUML
      const visibility = 'public';
      const name = methodWithoutVisibilityMatch[1];
      const parameters = this.parseParameters(methodWithoutVisibilityMatch[2]);
      const returnType = methodWithoutVisibilityMatch[3] || 'void';
      
      // Apply modifiers
      const isAbstract = modifiers.includes('abstract');
      const isStatic = modifiers.includes('static');
      
      const method = new Method(name, returnType, parameters, visibility, isStatic, isAbstract);
      entity.methods.push(method);
      return;
    }
    
    // Check if it's an attribute with visibility modifier
    const attributeWithVisibilityMatch = cleanedLine.match(/^\s*([\+\-#~])\s*(\w+)(?:\s*:\s*(\w+(?:<.*>)?))?/);
    if (attributeWithVisibilityMatch && entity.attributes) {
      const visibility = this.parseVisibility(attributeWithVisibilityMatch[1]);
      const name = attributeWithVisibilityMatch[2];
      const type = attributeWithVisibilityMatch[3] || 'Object';
      
      // Apply modifiers
      const isStatic = modifiers.includes('static');
      const isFinal = modifiers.includes('final');
      
      const attribute = new Attribute(name, type, visibility, isStatic, isFinal);
      entity.attributes.push(attribute);
      return;
    }
    
    // Check if it's an attribute without visibility modifier
    // This must be a non-empty line after removing modifiers
    const attributeWithoutVisibilityMatch = cleanedLine.match(/^\s*(\w+)(?:\s*:\s*(\w+(?:<.*>)?))?/);
    if (attributeWithoutVisibilityMatch && entity.attributes && cleanedLine.trim() !== '') {
      // Default visibility for attributes without modifiers is public in PlantUML
      const visibility = 'public';
      const name = attributeWithoutVisibilityMatch[1];
      const type = attributeWithoutVisibilityMatch[2] || 'Object';
      
      // Apply modifiers
      const isStatic = modifiers.includes('static');
      const isFinal = modifiers.includes('final');
      
      const attribute = new Attribute(name, type, visibility, isStatic, isFinal);
      entity.attributes.push(attribute);
      return;
    }
  }
  
  // New method to extract all modifiers from a line
  extractModifiers(line) {
    const modifiers = [];
    const modifierRegex = /\{(\w+)\}/g;
    let match;
    
    while ((match = modifierRegex.exec(line)) !== null) {
      modifiers.push(match[1]);
    }
    
    return modifiers;
  }
  
  // New method to remove all modifier blocks from a line
  removeModifiers(line) {
    return line.replace(/\{\w+\}/g, '');
  }
  
  parseVisibility(symbol) {
    switch (symbol) {
      case '+': return 'public';
      case '-': return 'private';
      case '#': return 'protected';
      case '~': return 'package';
      default: return 'public';
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
    return (
      line.includes('<|--') || // inheritance
      line.includes('--|>') || // inheritance (reverse)
      line.includes('<|..') || // implementation
      line.includes('..|>') || // implementation (reverse)
      line.includes('-->') ||  // association
      line.includes('<--') ||  // reverse association
      line.includes('o-->') || // aggregation
      line.includes('<--o') || // reverse aggregation
      line.includes('*-->') || // composition
      line.includes('<--*') || // reverse composition
      line.includes('..>') ||  // dependency
      line.includes('<..') ||  // reverse dependency
      line.includes('-->')     // simple association
    );
  }
  
  parseRelationship(line) {
    // Extract label if present (in quotes)
    let label = '';
    const labelMatch = line.match(/"([^"]+)"/);
    if (labelMatch) {
      label = labelMatch[1];
      // Remove the label part from the line for easier parsing
      line = line.replace(/"[^"]+"\s*/, '');
    }
    
    // Clean up the line
    line = line.trim();
    
    let sourceClass, targetClass, type;
    
    // Correctly handle PlantUML arrow notations:
    // Composition: '*-->' or '<--*'
    // Aggregation: 'o-->' or '<--o'
    // Note: In PlantUML, the * or o is adjacent to the class it belongs to
    
    // Composition: Container *--> Element
    if (line.match(/\s*(\w+)\s+\*-->\s+(\w+)\s*/)) {
      const match = line.match(/\s*(\w+)\s+\*-->\s+(\w+)\s*/);
      sourceClass = match[1];
      targetClass = match[2];
      type = 'composition';
    }
    // Reverse Composition: Element <--* Container
    else if (line.match(/\s*(\w+)\s+<--\*\s+(\w+)\s*/)) {
      const match = line.match(/\s*(\w+)\s+<--\*\s+(\w+)\s*/);
      sourceClass = match[2]; // Swap to maintain consistent source->target semantics
      targetClass = match[1];
      type = 'composition';
    }
    // Aggregation: Container o--> Element
    else if (line.match(/\s*(\w+)\s+o-->\s+(\w+)\s*/)) {
      const match = line.match(/\s*(\w+)\s+o-->\s+(\w+)\s*/);
      sourceClass = match[1];
      targetClass = match[2];
      type = 'aggregation';
    }
    // Reverse Aggregation: Element <--o Container
    else if (line.match(/\s*(\w+)\s+<--o\s+(\w+)\s*/)) {
      const match = line.match(/\s*(\w+)\s+<--o\s+(\w+)\s*/);
      sourceClass = match[2]; // Swap to maintain consistent source->target semantics
      targetClass = match[1];
      type = 'aggregation';
    }
    // Inheritance: Child --|> Parent
    else if (line.includes('--|>')) {
      const parts = line.split('--|>').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[0];
        targetClass = parts[1];
        type = 'inheritance';
      }
    }
    // Inheritance (reverse): Parent <|-- Child
    else if (line.includes('<|--')) {
      const parts = line.split('<|--').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[1]; // Swap to maintain consistent source->target semantics
        targetClass = parts[0];
        type = 'inheritance';
      }
    }
    // Implementation: Class ..|> Interface (using dashed line)
    else if (line.includes('..|>')) {
      const parts = line.split('..|>').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[0];
        targetClass = parts[1];
        type = 'implementation';
      }
    }
    // Implementation (reverse): Interface <|.. Class
    else if (line.includes('<|..')) {
      const parts = line.split('<|..').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[1]; // Swap to maintain consistent source->target semantics
        targetClass = parts[0];
        type = 'implementation';
      }
    }
    // Dependency: User ..> Service
    else if (line.includes('..>')) {
      const parts = line.split('..>').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[0];
        targetClass = parts[1];
        type = 'dependency';
      }
    }
    // Reverse Dependency: Service <.. User
    else if (line.includes('<..')) {
      const parts = line.split('<..').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[1]; // Swap to maintain consistent source->target semantics
        targetClass = parts[0];
        type = 'dependency';
      }
    }
    // Association: Class --> OtherClass
    else if (line.includes('-->')) {
      const parts = line.split('-->').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[0];
        targetClass = parts[1];
        type = 'association';
      }
    }
    // Reverse Association: OtherClass <-- Class
    else if (line.includes('<--')) {
      const parts = line.split('<--').map(part => part.trim());
      if (parts.length === 2) {
        sourceClass = parts[1]; // Swap to maintain consistent source->target semantics
        targetClass = parts[0];
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
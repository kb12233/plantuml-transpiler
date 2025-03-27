"use strict";

const BaseGenerator = require('./BaseGenerator');
class KotlinGenerator extends BaseGenerator {
  constructor() {
    super();
    this.indentSize = 4;
  }
  generateHeader(classDiagram) {
    return "// Generated Kotlin code from PlantUML class diagram\n\n";
  }
  supportsPackages() {
    return true;
  }
  generatePackageStart(packageName) {
    return `package ${packageName}\n\n`;
  }
  generatePackageEnd(packageName) {
    return '\n'; // No explicit package end in Kotlin
  }
  generateClass(classObj, classDiagram) {
    let code = '';

    // Class documentation
    code += `/**\n * ${classObj.name} class\n */\n`;

    // Class declaration
    if (classObj.isAbstract) {
      code += 'abstract class ';
    } else {
      code += 'class ';
    }
    code += classObj.name;

    // Generic parameters
    if (classObj.generics.length > 0) {
      code += '<' + classObj.generics.join(', ') + '>';
    }

    // Constructor parameters (properties)
    const constructorParams = [];
    if (classObj.constructors.length > 0) {
      const constructor = classObj.constructors[0]; // Use the first constructor
      for (const param of constructor.parameters) {
        // Find if there's a corresponding attribute
        const attr = classObj.attributes.find(a => a.name === param.name);
        if (attr) {
          // This is a property
          constructorParams.push(`${this.mapKotlinVisibility(attr.visibility)} ${attr.isVal ? 'val' : 'var'} ${param.name}: ${this.mapKotlinType(param.type)}`);
        } else {
          // This is just a constructor parameter
          constructorParams.push(`${param.name}: ${this.mapKotlinType(param.type)}`);
        }
      }
    } else {
      // If no constructor is specified, use primary attributes
      for (const attr of classObj.attributes.filter(a => !a.isStatic)) {
        constructorParams.push(`${this.mapKotlinVisibility(attr.visibility)} ${attr.isFinal ? 'val' : 'var'} ${attr.name}: ${this.mapKotlinType(attr.type)}`);
      }
    }
    if (constructorParams.length > 0) {
      code += '(' + constructorParams.join(', ') + ')';
    }

    // Inheritance
    const parentClass = this.findParentClass(classObj, classDiagram);
    if (parentClass) {
      code += ` : ${parentClass.name}()`;
    }

    // Implementations
    const interfaces = this.findImplementedInterfaces(classObj, classDiagram);
    if (interfaces.length > 0) {
      if (!parentClass) {
        code += ' :';
      }
      code += ' ' + interfaces.map(i => i.name).join(', ');
    }
    code += ' {\n';

    // Companion object for static members
    const staticAttrs = classObj.attributes.filter(a => a.isStatic);
    const staticMethods = classObj.methods.filter(m => m.isStatic);
    if (staticAttrs.length > 0 || staticMethods.length > 0) {
      code += this.indent('companion object {\n');

      // Static attributes
      for (const attr of staticAttrs) {
        code += this.indent(`${this.mapKotlinVisibility(attr.visibility)} ${attr.isFinal ? 'val' : 'var'} ${attr.name}: ${this.mapKotlinType(attr.type)}`, 2);
        code += '\n';
      }
      if (staticAttrs.length > 0 && staticMethods.length > 0) {
        code += '\n';
      }

      // Static methods
      for (const method of staticMethods) {
        // Method documentation
        code += this.indent('/**\n', 2);

        // Method parameters documentation
        for (const param of method.parameters) {
          code += this.indent(` * @param ${param.name} ${param.type} parameter\n`, 2);
        }

        // Return type documentation
        if (method.returnType !== 'void' && method.returnType !== 'Unit') {
          code += this.indent(` * @return ${method.returnType}\n`, 2);
        }
        code += this.indent(' */\n', 2);

        // Method signature
        code += this.indent(`${this.mapKotlinVisibility(method.visibility)} fun ${method.name}(`, 2);

        // Parameters
        code += method.parameters.map(param => `${param.name}: ${this.mapKotlinType(param.type)}`).join(', ');
        code += `): ${this.mapKotlinType(method.returnType)} {\n`;

        // Method body
        code += this.indent('// TODO: Implement method\n', 3);

        // Return statement for non-void methods
        if (method.returnType !== 'void' && method.returnType !== 'Unit') {
          if (method.returnType === 'Boolean') {
            code += this.indent('return false', 3) + '\n';
          } else if (method.returnType === 'Int' || method.returnType === 'Long' || method.returnType === 'Float' || method.returnType === 'Double') {
            code += this.indent('return 0', 3) + '\n';
          } else if (method.returnType === 'String') {
            code += this.indent('return ""', 3) + '\n';
          } else {
            code += this.indent('return null', 3) + '\n';
          }
        }
        code += this.indent('}\n\n', 2);
      }
      code += this.indent('}\n\n');
    }

    // Instance methods
    const instanceMethods = classObj.methods.filter(m => !m.isStatic);
    for (const method of instanceMethods) {
      // Method documentation
      code += this.indent('/**\n');

      // Method parameters documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param ${param.name} ${param.type} parameter\n`);
      }

      // Return type documentation
      if (method.returnType !== 'void' && method.returnType !== 'Unit') {
        code += this.indent(` * @return ${method.returnType}\n`);
      }
      code += this.indent(' */\n');

      // Method signature
      code += this.indent(`${this.mapKotlinVisibility(method.visibility)} `);
      if (method.isAbstract) {
        code += 'abstract ';
      }
      code += `fun ${method.name}(`;

      // Parameters
      code += method.parameters.map(param => `${param.name}: ${this.mapKotlinType(param.type)}`).join(', ');
      code += `): ${this.mapKotlinType(method.returnType)}`;

      // Method body or semicolon
      if (method.isAbstract) {
        code += '\n\n';
      } else {
        code += ' {\n';
        code += this.indent('// TODO: Implement method\n', 2);

        // Return statement for non-void methods
        if (method.returnType !== 'void' && method.returnType !== 'Unit') {
          if (method.returnType === 'Boolean') {
            code += this.indent('return false', 2) + '\n';
          } else if (method.returnType === 'Int' || method.returnType === 'Long' || method.returnType === 'Float' || method.returnType === 'Double') {
            code += this.indent('return 0', 2) + '\n';
          } else if (method.returnType === 'String') {
            code += this.indent('return ""', 2) + '\n';
          } else {
            code += this.indent('return null', 2) + '\n';
          }
        }
        code += this.indent('}\n\n');
      }
    }
    code += '}\n\n';
    return code;
  }
  generateInterface(interfaceObj, classDiagram) {
    let code = '';

    // Interface documentation
    code += `/**\n * ${interfaceObj.name} interface\n */\n`;

    // Interface declaration
    code += 'interface ' + interfaceObj.name;

    // Generic parameters
    if (interfaceObj.generics.length > 0) {
      code += '<' + interfaceObj.generics.join(', ') + '>';
    }
    code += ' {\n';

    // Methods
    for (const method of interfaceObj.methods) {
      // Method documentation
      code += this.indent('/**\n');

      // Method parameters documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param ${param.name} ${param.type} parameter\n`);
      }

      // Return type documentation
      if (method.returnType !== 'void' && method.returnType !== 'Unit') {
        code += this.indent(` * @return ${method.returnType}\n`);
      }
      code += this.indent(' */\n');

      // Method signature
      code += this.indent(`fun ${method.name}(`);

      // Parameters
      code += method.parameters.map(param => `${param.name}: ${this.mapKotlinType(param.type)}`).join(', ');
      code += `): ${this.mapKotlinType(method.returnType)}\n\n`;
    }
    code += '}\n\n';
    return code;
  }
  generateEnum(enumObj, classDiagram) {
    let code = '';

    // Enum documentation
    code += `/**\n * ${enumObj.name} enum\n */\n`;

    // Enum declaration
    code += 'enum class ' + enumObj.name + ' {\n';

    // Enum values
    if (enumObj.values.length > 0) {
      code += this.indent(enumObj.values.join(',\n') + ';');
      code += '\n';
    }
    code += '}\n\n';
    return code;
  }
  mapKotlinVisibility(visibility) {
    switch (visibility) {
      case 'private':
        return 'private';
      case 'protected':
        return 'protected';
      case 'package':
        return 'internal';
      default:
        return 'public';
    }
  }
  mapKotlinType(type) {
    if (!type) return 'Unit';
    switch (type.toLowerCase()) {
      case 'boolean':
        return 'Boolean';
      case 'integer':
      case 'int':
        return 'Int';
      case 'long':
        return 'Long';
      case 'float':
        return 'Float';
      case 'double':
        return 'Double';
      case 'string':
        return 'String';
      case 'char':
        return 'Char';
      case 'byte':
        return 'Byte';
      case 'short':
        return 'Short';
      case 'void':
        return 'Unit';
      case 'object':
        return 'Any';
      case 'list':
        return 'List<Any>';
      case 'map':
      case 'hashmap':
        return 'Map<Any, Any>';
      case 'array':
        return 'Array<Any>';
      default:
        return type;
      // Keep custom types as is
    }
  }
}
module.exports = KotlinGenerator;
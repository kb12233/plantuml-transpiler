"use strict";

const BaseGenerator = require('./BaseGenerator');
class JavaGenerator extends BaseGenerator {
  generateHeader(classDiagram) {
    return '// Generated Java code from PlantUML class diagram\n\n';
  }
  generatePackageStart(packageName) {
    return `package ${packageName};\n\n`;
  }
  generatePackageEnd(packageName) {
    return '\n'; // No special end for Java packages
  }
  generateClass(classObj, classDiagram) {
    let code = '';

    // Class documentation
    code += `/**\n * ${classObj.name} class\n */\n`;

    // Class declaration
    if (classObj.isAbstract) {
      code += 'public abstract class ';
    } else {
      code += 'public class ';
    }
    code += classObj.name;

    // Generic parameters
    if (classObj.generics.length > 0) {
      code += '<' + classObj.generics.join(', ') + '>';
    }

    // Inheritance
    const parentClass = this.findParentClass(classObj, classDiagram);
    if (parentClass) {
      code += ` extends ${parentClass.name}`;
    }

    // Implementations
    const interfaces = this.findImplementedInterfaces(classObj, classDiagram);
    if (interfaces.length > 0) {
      code += ' implements ' + interfaces.map(i => i.name).join(', ');
    }
    code += ' {\n';

    // Attributes
    for (const attr of classObj.attributes) {
      code += this.indent(`${attr.visibility} `);
      if (attr.isStatic) {
        code += 'static ';
      }
      if (attr.isFinal) {
        code += 'final ';
      }
      code += `${attr.type} ${attr.name};\n`;
    }
    if (classObj.attributes.length > 0) {
      code += '\n';
    }

    // Constructors
    if (classObj.constructors.length > 0) {
      for (const constructor of classObj.constructors) {
        code += this.indent(`/**\n * Constructor for ${classObj.name}\n */\n`);
        code += this.indent(`${constructor.visibility} ${classObj.name}(`);

        // Parameters
        code += constructor.parameters.map(param => `${param.type} ${param.name}`).join(', ');
        code += ') {\n';

        // Constructor body - may call super() if there's a parent
        if (parentClass) {
          code += this.indent('super();', 2);
        }
        code += this.indent('\n// TODO: Implement constructor\n', 2);
        code += this.indent('}\n\n');
      }
    } else if (!classObj.isAbstract) {
      // Generate a default constructor if none specified
      code += this.indent(`/**\n * Default constructor for ${classObj.name}\n */\n`);
      code += this.indent(`public ${classObj.name}() {\n`);
      if (parentClass) {
        code += this.indent('super();', 2);
      }
      code += this.indent('\n// TODO: Implement constructor\n', 2);
      code += this.indent('}\n\n');
    }

    // Methods
    for (const method of classObj.methods) {
      code += this.indent('/**\n');

      // Method documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param ${param.name} ${param.type} parameter\n`);
      }
      if (method.returnType !== 'void') {
        code += this.indent(` * @return ${method.returnType}\n`);
      }
      code += this.indent(' */\n');

      // Method signature
      code += this.indent(`${method.visibility} `);
      if (method.isStatic) {
        code += 'static ';
      }
      if (method.isAbstract) {
        code += 'abstract ';
      }
      code += `${method.returnType} ${method.name}(`;

      // Parameters
      code += method.parameters.map(param => `${param.type} ${param.name}`).join(', ');
      code += ')';

      // Method body or semicolon
      if (method.isAbstract) {
        code += ';\n\n';
      } else {
        code += ' {\n';
        code += this.indent('// TODO: Implement method\n', 2);

        // Return statement for non-void methods
        if (method.returnType !== 'void') {
          if (method.returnType === 'boolean') {
            code += this.indent('return false;\n', 2);
          } else if (method.returnType === 'int' || method.returnType === 'long' || method.returnType === 'float' || method.returnType === 'double') {
            code += this.indent('return 0;\n', 2);
          } else if (method.returnType === 'char') {
            code += this.indent("return ' ';\n", 2);
          } else if (method.returnType === 'byte' || method.returnType === 'short') {
            code += this.indent('return 0;\n', 2);
          } else {
            code += this.indent('return null;\n', 2);
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
    code += 'public interface ' + interfaceObj.name;

    // Generic parameters
    if (interfaceObj.generics.length > 0) {
      code += '<' + interfaceObj.generics.join(', ') + '>';
    }
    code += ' {\n';

    // Methods
    for (const method of interfaceObj.methods) {
      code += this.indent('/**\n');

      // Method documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param ${param.name} ${param.type} parameter\n`);
      }
      if (method.returnType !== 'void') {
        code += this.indent(` * @return ${method.returnType}\n`);
      }
      code += this.indent(' */\n');

      // Method signature - in Java interfaces, methods are implicitly public and abstract
      code += this.indent(`${method.returnType} ${method.name}(`);

      // Parameters
      code += method.parameters.map(param => `${param.type} ${param.name}`).join(', ');
      code += ');\n\n';
    }
    code += '}\n\n';
    return code;
  }
  generateEnum(enumObj, classDiagram) {
    let code = '';

    // Enum documentation
    code += `/**\n * ${enumObj.name} enum\n */\n`;

    // Enum declaration
    code += 'public enum ' + enumObj.name + ' {\n';

    // Enum values
    if (enumObj.values.length > 0) {
      code += this.indent(enumObj.values.join(',\n') + ';\n');
    }
    code += '}\n\n';
    return code;
  }
}
module.exports = JavaGenerator;
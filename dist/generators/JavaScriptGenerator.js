"use strict";

const BaseGenerator = require('./BaseGenerator');
class JavaScriptGenerator extends BaseGenerator {
  constructor() {
    super();
    this.indentSize = 2; // JavaScript conventionally uses 2 spaces
  }
  generateHeader(classDiagram) {
    return "// Generated JavaScript code from PlantUML class diagram\n\n";
  }
  supportsPackages() {
    return false; // JavaScript doesn't have built-in package system
  }
  generateClass(classObj, classDiagram) {
    let code = '';

    // Class documentation
    code += `/**\n * ${classObj.name} class\n */\n`;

    // Find inheritance
    const parentClass = this.findParentClass(classObj, classDiagram);

    // Class declaration
    code += 'class ' + classObj.name;

    // Inheritance
    if (parentClass) {
      code += ` extends ${parentClass.name}`;
    }
    code += ' {\n';

    // Constructor
    code += this.indent(`/**\n`);
    code += this.indent(` * Constructor for ${classObj.name}\n`);
    code += this.indent(` */\n`);
    if (classObj.constructors.length > 0) {
      const constructor = classObj.constructors[0]; // Use the first constructor

      code += this.indent('constructor(');

      // Parameters
      code += constructor.parameters.map(p => p.name).join(', ');
      code += ') {\n';

      // Call super if extending another class
      if (parentClass) {
        code += this.indent('super();', 2) + '\n';
      }

      // Initialize instance properties
      for (const param of constructor.parameters) {
        code += this.indent(`this.${param.name} = ${param.name};`, 2) + '\n';
      }
      code += this.indent('}\n\n');
    } else {
      // Default constructor
      code += this.indent('constructor() {\n');

      // Call super if extending another class
      if (parentClass) {
        code += this.indent('super();', 2) + '\n';
      }

      // Initialize instance properties from attributes
      for (const attr of classObj.attributes.filter(a => !a.isStatic)) {
        code += this.indent(`this.${attr.name} = null;`, 2) + '\n';
      }
      code += this.indent('}\n\n');
    }

    // Methods
    for (const method of classObj.methods) {
      // Method documentation
      code += this.indent(`/**\n`);
      code += this.indent(` * ${method.name} method\n`);

      // Method parameters documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param {*} ${param.name} - ${param.type} parameter\n`);
      }

      // Return type documentation
      if (method.returnType !== 'void') {
        code += this.indent(` * @returns {*} ${method.returnType}\n`);
      }
      code += this.indent(` */\n`);

      // Method signature
      if (method.isStatic) {
        code += this.indent(`static ${method.name}(`);
      } else {
        code += this.indent(`${method.name}(`);
      }

      // Parameters
      code += method.parameters.map(p => p.name).join(', ');
      code += ') {\n';

      // Method body
      code += this.indent('// TODO: Implement method', 2) + '\n';

      // Return statement for non-void methods
      if (method.returnType !== 'void') {
        if (method.returnType === 'boolean') {
          code += this.indent('return false;', 2) + '\n';
        } else if (method.returnType === 'int' || method.returnType === 'long' || method.returnType === 'float' || method.returnType === 'double') {
          code += this.indent('return 0;', 2) + '\n';
        } else if (method.returnType === 'string') {
          code += this.indent('return "";', 2) + '\n';
        } else {
          code += this.indent('return null;', 2) + '\n';
        }
      }
      code += this.indent('}\n\n');
    }

    // Static properties - in JS these are defined outside the class
    const staticAttrs = classObj.attributes.filter(a => a.isStatic);
    if (staticAttrs.length > 0) {
      code += '}\n\n';
      for (const attr of staticAttrs) {
        code += `// Static property\n`;
        code += `${classObj.name}.${attr.name} = null;\n`;
      }
      return code;
    }
    code += '}\n\n';
    return code;
  }
  generateInterface(interfaceObj, classDiagram) {
    let code = '';

    // Interface documentation
    code += `/**\n * ${interfaceObj.name} interface\n */\n`;

    // In JavaScript, interfaces don't exist, so we'll create a base class or comment
    code += `// Interface: ${interfaceObj.name}\n`;
    code += `// Note: JavaScript doesn't support interfaces natively.\n`;
    code += `// This is a base class with placeholder methods that should be overridden.\n\n`;
    code += 'class ' + interfaceObj.name + ' {\n';

    // Constructor
    code += this.indent('constructor() {\n');
    code += this.indent('// Check if this is directly instantiated', 2) + '\n';
    code += this.indent('if (this.constructor === ' + interfaceObj.name + ') {', 2) + '\n';
    code += this.indent("throw new Error('Interface cannot be instantiated directly');", 3) + '\n';
    code += this.indent('}', 2) + '\n';
    code += this.indent('}\n\n');

    // Methods
    for (const method of interfaceObj.methods) {
      // Method documentation
      code += this.indent(`/**\n`);
      code += this.indent(` * ${method.name} method - must be implemented by subclasses\n`);

      // Method parameters documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param {*} ${param.name} - ${param.type} parameter\n`);
      }

      // Return type documentation
      if (method.returnType !== 'void') {
        code += this.indent(` * @returns {*} ${method.returnType}\n`);
      }
      code += this.indent(` */\n`);

      // Method signature
      code += this.indent(`${method.name}(`);

      // Parameters
      code += method.parameters.map(p => p.name).join(', ');
      code += ') {\n';
      code += this.indent("throw new Error('Method must be implemented by subclass');", 2) + '\n';
      code += this.indent('}\n\n');
    }
    code += '}\n\n';
    return code;
  }
  generateEnum(enumObj, classDiagram) {
    let code = '';

    // Enum documentation
    code += `/**\n * ${enumObj.name} enum\n */\n`;

    // In JavaScript, enums can be implemented using objects with frozen values
    code += `const ${enumObj.name} = Object.freeze({\n`;

    // Enum values
    for (let i = 0; i < enumObj.values.length; i++) {
      code += this.indent(`${enumObj.values[i]}: '${enumObj.values[i]}'`);
      if (i < enumObj.values.length - 1) {
        code += ',';
      }
      code += '\n';
    }
    code += '});\n\n';
    return code;
  }
}
module.exports = JavaScriptGenerator;
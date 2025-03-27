const BaseGenerator = require('./BaseGenerator');

class TypeScriptGenerator extends BaseGenerator {
  constructor() {
    super();
    this.indentSize = 2; // TypeScript conventionally uses 2 spaces
  }
  
  generateHeader(classDiagram) {
    return "// Generated TypeScript code from PlantUML class diagram\n\n";
  }
  
  supportsPackages() {
    return true; // TypeScript can use modules and namespaces
  }
  
  generatePackageStart(packageName) {
    // In TypeScript, packages can be represented as namespaces
    return `namespace ${packageName} {\n`;
  }
  
  generatePackageEnd(packageName) {
    return `}\n\n`;
  }
  
  generateClass(classObj, classDiagram) {
    let code = '';
    
    // Class documentation
    code += this.indent(`/**\n`);
    code += this.indent(` * ${classObj.name} class\n`);
    code += this.indent(` */\n`);
    
    // Access modifier - in TypeScript we can add 'export'
    code += this.indent('export ');
    
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
    
    // Attributes/Properties
    for (const attr of classObj.attributes) {
      // Property documentation
      code += this.indent(`/**\n`, 2);
      code += this.indent(` * ${attr.name} property\n`, 2);
      code += this.indent(` */\n`, 2);
      
      // Property declaration
      code += this.indent(`${this.mapTsVisibility(attr.visibility)} `, 2);
      
      if (attr.isStatic) {
        code += 'static ';
      }
      
      if (attr.isFinal) {
        code += 'readonly ';
      }
      
      code += `${attr.name}: ${this.mapTsType(attr.type)};\n\n`;
    }
    
    // Constructor
    code += this.indent(`/**\n`, 2);
    code += this.indent(` * Constructor for ${classObj.name}\n`, 2);
    code += this.indent(` */\n`, 2);
    
    if (classObj.constructors.length > 0) {
      const constructor = classObj.constructors[0]; // Use the first constructor
      
      code += this.indent(`${this.mapTsVisibility(constructor.visibility)} constructor(`, 2);
      
      // Parameters
      code += constructor.parameters.map(
        param => `${param.name}: ${this.mapTsType(param.type)}`
      ).join(', ');
      
      code += ') {\n';
      
      // Call super if extending another class
      if (parentClass) {
        code += this.indent('super();', 3) + '\n';
      }
      
      // Initialize instance properties
      for (const param of constructor.parameters) {
        code += this.indent(`this.${param.name} = ${param.name};`, 3) + '\n';
      }
      
      code += this.indent('}\n\n', 2);
    } else if (!classObj.isAbstract) {
      // Default constructor
      code += this.indent('constructor() {\n', 2);
      
      // Call super if extending another class
      if (parentClass) {
        code += this.indent('super();', 3) + '\n';
      }
      
      code += this.indent('}\n\n', 2);
    }
    
    // Methods
    for (const method of classObj.methods) {
      // Method documentation
      code += this.indent(`/**\n`, 2);
      code += this.indent(` * ${method.name} method\n`, 2);
      
      // Method parameters documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param ${param.name} ${param.type} parameter\n`, 2);
      }
      
      // Return type documentation
      if (method.returnType !== 'void') {
        code += this.indent(` * @returns ${method.returnType}\n`, 2);
      }
      
      code += this.indent(` */\n`, 2);
      
      // Method signature
      code += this.indent(`${this.mapTsVisibility(method.visibility)} `, 2);
      
      if (method.isStatic) {
        code += 'static ';
      }
      
      if (method.isAbstract) {
        code += 'abstract ';
      }
      
      code += `${method.name}(`;
      
      // Parameters
      code += method.parameters.map(
        param => `${param.name}: ${this.mapTsType(param.type)}`
      ).join(', ');
      
      code += `): ${this.mapTsType(method.returnType)}`;
      
      // Method body or semicolon
      if (method.isAbstract) {
        code += ';\n\n';
      } else {
        code += ' {\n';
        code += this.indent('// TODO: Implement method', 3) + '\n';
        
        // Return statement for non-void methods
        if (method.returnType !== 'void') {
          if (method.returnType === 'boolean') {
            code += this.indent('return false;', 3) + '\n';
          } else if (method.returnType === 'number') {
            code += this.indent('return 0;', 3) + '\n';
          } else if (method.returnType === 'string') {
            code += this.indent('return "";', 3) + '\n';
          } else {
            code += this.indent('return null as any;', 3) + '\n';
          }
        }
        
        code += this.indent('}\n\n', 2);
      }
    }
    
    code += this.indent('}\n\n');
    
    return code;
  }
  
  generateInterface(interfaceObj, classDiagram) {
    let code = '';
    
    // Interface documentation
    code += this.indent(`/**\n`);
    code += this.indent(` * ${interfaceObj.name} interface\n`);
    code += this.indent(` */\n`);
    
    // Interface declaration
    code += this.indent('export interface ' + interfaceObj.name);
    
    // Generic parameters
    if (interfaceObj.generics.length > 0) {
      code += '<' + interfaceObj.generics.join(', ') + '>';
    }
    
    code += ' {\n';
    
    // Methods
    for (const method of interfaceObj.methods) {
      // Method documentation
      code += this.indent(`/**\n`, 2);
      code += this.indent(` * ${method.name} method\n`, 2);
      
      // Method parameters documentation
      for (const param of method.parameters) {
        code += this.indent(` * @param ${param.name} ${param.type} parameter\n`, 2);
      }
      
      // Return type documentation
      if (method.returnType !== 'void') {
        code += this.indent(` * @returns ${method.returnType}\n`, 2);
      }
      
      code += this.indent(` */\n`, 2);
      
      // Method signature
      code += this.indent(`${method.name}(`, 2);
      
      // Parameters
      code += method.parameters.map(
        param => `${param.name}: ${this.mapTsType(param.type)}`
      ).join(', ');
      
      code += `): ${this.mapTsType(method.returnType)};\n\n`;
    }
    
    code += this.indent('}\n\n');
    
    return code;
  }
  
  generateEnum(enumObj, classDiagram) {
    let code = '';
    
    // Enum documentation
    code += this.indent(`/**\n`);
    code += this.indent(` * ${enumObj.name} enum\n`);
    code += this.indent(` */\n`);
    
    // Enum declaration
    code += this.indent('export enum ' + enumObj.name + ' {\n');
    
    // Enum values
    for (let i = 0; i < enumObj.values.length; i++) {
      code += this.indent(`${enumObj.values[i]} = '${enumObj.values[i]}'`, 2);
      if (i < enumObj.values.length - 1) {
        code += ',';
      }
      code += '\n';
    }
    
    code += this.indent('}\n\n');
    
    return code;
  }
  
  mapTsVisibility(visibility) {
    switch (visibility) {
      case 'private': return 'private';
      case 'protected': return 'protected';
      case 'package': return 'protected'; // TypeScript doesn't have package visibility
      default: return 'public';
    }
  }
  
  mapTsType(type) {
    if (!type) return 'void';
    
    switch (type.toLowerCase()) {
      case 'boolean': return 'boolean';
      case 'integer': case 'int': case 'long': case 'float': case 'double': return 'number';
      case 'string': case 'char': return 'string';
      case 'byte': case 'short': return 'number';
      case 'void': return 'void';
      case 'object': return 'any';
      case 'list': return 'Array<any>';
      case 'map': case 'hashmap': return 'Map<any, any>';
      case 'array': return 'Array<any>';
      default: return type; // Keep custom types as is
    }
  }
}

module.exports = TypeScriptGenerator;
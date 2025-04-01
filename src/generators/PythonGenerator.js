const BaseGenerator = require('./BaseGenerator');

class PythonGenerator extends BaseGenerator {
  constructor() {
    super();
    this.indentSize = 4;
  }
  
  generateHeader(classDiagram) {
    return "# Generated Python code from PlantUML class diagram\n\nfrom abc import ABC, abstractmethod\nfrom typing import List, Dict, Optional, Any, Union\n\n";
  }
  
  supportsPackages() {
    return true;
  }
  
  generatePackageStart(packageName) {
    // In Python, packages are directories with __init__.py files
    // For simplicity, we'll just add a comment
    return `# Package: ${packageName}\n\n`;
  }
  
  generatePackageEnd(packageName) {
    return '\n';
  }
  
  generateClass(classObj, classDiagram) {
    let code = '';
    
    // Class declaration
    code += 'class ' + classObj.name;
    
    // Inheritance
    const parentClass = this.findParentClass(classObj, classDiagram);
    const interfaces = this.findImplementedInterfaces(classObj, classDiagram);
    
    const parents = [];
    if (parentClass) {
      parents.push(parentClass.name);
    }
    
    if (interfaces.length > 0) {
      parents.push(...interfaces.map(i => i.name));
    }
    
    if (classObj.isAbstract && parents.length === 0) {
      parents.push('ABC');
    }
    
    if (parents.length > 0) {
      code += '(' + parents.join(', ') + ')';
    }
    
    code += ':\n';
    
    // Class docstring
    code += this.indent('"""' + classObj.name + ' class"""') + '\n\n';
    
    // Static attributes (as class variables)
    const staticAttrs = classObj.attributes.filter(a => a.isStatic);
    if (staticAttrs.length > 0) {
      for (const attr of staticAttrs) {
        code += this.indent(`${attr.name}: ${this.mapPythonType(attr.type)} = None  # Static attribute`);
        code += '\n';
      }
      code += '\n';
    }
    
    // Initialize method with attributes
    const instanceAttrs = classObj.attributes.filter(a => !a.isStatic);
    if (instanceAttrs.length > 0 || classObj.constructors.length > 0) {
      code += this.indent('def __init__(self');
      
      // Add parameters for each attribute or constructor parameter
      if (classObj.constructors.length > 0) {
        const constructor = classObj.constructors[0]; // Use the first constructor
        for (const param of constructor.parameters) {
          code += ', ' + param.name + ': ' + this.mapPythonType(param.type) + ' = None';
        }
      } else {
        // Add parameters for each attribute
        for (const attr of instanceAttrs) {
          code += ', ' + attr.name + ': ' + this.mapPythonType(attr.type) + ' = None';
        }
      }
      
      code += '):\n';
      code += this.indent(`"""Initialize a new ${classObj.name} instance"""`, 2) + '\n';
      
      // Initialize attributes
      for (const attr of instanceAttrs) {
        code += this.indent('self.' + attr.name + ' = ' + attr.name, 2) + '\n';
      }
      
      code += '\n';
    }
    
    // Methods
    for (const method of classObj.methods) {
      // Add abstractmethod decorator before method definition if abstract
      if (method.isAbstract) {
        code += this.indent('@abstractmethod') + '\n';
      }
      
      // Add staticmethod decorator if static
      if (method.isStatic) {
        code += this.indent('@staticmethod') + '\n';
      }
      
      // Method definition
      code += this.indent('def ' + method.name + '(');
      
      // Parameters
      const params = [];
      // Only include 'self' parameter for instance methods (non-static)
      if (!method.isStatic) {
        params.push('self');
      }
      
      for (const param of method.parameters) {
        params.push(`${param.name}: ${this.mapPythonType(param.type)}`);
      }
      
      code += params.join(', ');
      
      code += ') -> ' + this.mapPythonType(method.returnType) + ':\n';
      
      // Method docstring
      code += this.indent('"""', 2) + '\n';
      
      // Method docstring parameters
      if (method.parameters.length > 0) {
        code += this.indent('Args:', 2) + '\n';
        for (const param of method.parameters) {
          const mappedType = this.mapPythonType(param.type);
          if (this.isComplexGenericType(param.type)) {
            code += this.indent(`    ${param.name}: A ${mappedType} (original type: ${param.type})`, 2) + '\n';
          } else {
            code += this.indent(`    ${param.name}: A ${param.type}`, 2) + '\n';
          }
        }
      }
      
      // Method docstring return value
      if (method.returnType !== 'void' && method.returnType !== 'None') {
        const mappedReturnType = this.mapPythonType(method.returnType);
        if (this.isComplexGenericType(method.returnType)) {
          code += this.indent('Returns:', 2) + '\n';
          code += this.indent(`    ${mappedReturnType} (original type: ${method.returnType})`, 2) + '\n';
        } else {
          code += this.indent('Returns:', 2) + '\n';
          code += this.indent(`    ${method.returnType}`, 2) + '\n';
        }
      }
      
      code += this.indent('"""', 2) + '\n';
      
      // Method body
      if (method.isAbstract) {
        code += this.indent('pass', 2) + '\n\n';
      } else {
        code += this.indent('# TODO: Implement method', 2) + '\n';
        
        // Return statement for non-void methods
        if (method.returnType !== 'void' && method.returnType !== 'None') {
          const mappedReturnType = this.mapPythonType(method.returnType);
          
          if (mappedReturnType === 'bool') {
            code += this.indent('return False', 2) + '\n\n';
          } else if (['int', 'float'].includes(mappedReturnType)) {
            code += this.indent('return 0', 2) + '\n\n';
          } else if (mappedReturnType === 'str') {
            code += this.indent('return ""', 2) + '\n\n';
          } else {
            code += this.indent('return None', 2) + '\n\n';
          }
        } else {
          code += '\n';
        }
      }
    }
    
    if (code.endsWith('\n\n')) {
      code = code.slice(0, -1);
    }
    
    return code + '\n\n';
  }
  
  generateInterface(interfaceObj, classDiagram) {
    let code = '';
    
    // In Python, interfaces are abstract classes
    code += 'class ' + interfaceObj.name + '(ABC):\n';
    
    // Interface docstring
    code += this.indent('"""' + interfaceObj.name + ' interface"""') + '\n\n';
    
    // Methods
    for (const method of interfaceObj.methods) {
      // Add abstractmethod decorator before method definition
      code += this.indent('@abstractmethod') + '\n';
      
      // Method definition
      code += this.indent('def ' + method.name + '(self');
      
      // Parameters
      for (const param of method.parameters) {
        code += ', ' + param.name + ': ' + this.mapPythonType(param.type);
      }
      
      code += `) -> ${this.mapPythonType(method.returnType)}:\n`;
      
      // Method docstring
      code += this.indent('"""', 2) + '\n';
      
      // Method docstring parameters
      if (method.parameters.length > 0) {
        code += this.indent('Args:', 2) + '\n';
        for (const param of method.parameters) {
          const mappedType = this.mapPythonType(param.type);
          if (this.isComplexGenericType(param.type)) {
            code += this.indent(`    ${param.name}: A ${mappedType} (original type: ${param.type})`, 2) + '\n';
          } else {
            code += this.indent(`    ${param.name}: A ${param.type}`, 2) + '\n';
          }
        }
      }
      
      // Method docstring return value
      if (method.returnType !== 'void' && method.returnType !== 'None') {
        const mappedReturnType = this.mapPythonType(method.returnType);
        if (this.isComplexGenericType(method.returnType)) {
          code += this.indent('Returns:', 2) + '\n';
          code += this.indent(`    ${mappedReturnType} (original type: ${method.returnType})`, 2) + '\n';
        } else {
          code += this.indent('Returns:', 2) + '\n';
          code += this.indent(`    ${method.returnType}`, 2) + '\n';
        }
      }
      
      code += this.indent('"""', 2) + '\n';
      code += this.indent('pass', 2) + '\n\n';
    }
    
    if (code.endsWith('\n\n')) {
      code = code.slice(0, -1);
    }
    
    return code + '\n\n';
  }
  
  generateEnum(enumObj, classDiagram) {
    let code = '';
    
    // In Python, enums are created using the Enum class
    code += 'from enum import Enum\n\n';
    
    // Enum declaration
    code += 'class ' + enumObj.name + '(Enum):\n';
    
    // Enum docstring
    code += this.indent('"""' + enumObj.name + ' enumeration"""') + '\n\n';
    
    // Enum values
    for (let i = 0; i < enumObj.values.length; i++) {
      // In Python enums, we need to assign a value
      code += this.indent(enumObj.values[i] + ' = ' + (i + 1)) + '\n';
    }
    
    return code + '\n\n';
  }
  
  mapPythonType(type) {
    if (!type) return 'None';
    
    // Handle complex generic types
    if (this.isComplexGenericType(type)) {
      // Extract the base type (e.g., "Map" from "Map<String, Integer>")
      const baseType = this.extractBaseGenericType(type).toLowerCase();
      
      // Map common collection types
      switch (baseType) {
        case 'list': return 'List[Any]';
        case 'arraylist': return 'List[Any]';
        case 'map': case 'hashmap': return 'Dict[Any, Any]';
        case 'set': case 'hashset': return 'Set[Any]';
        case 'collection': return 'List[Any]';
        case 'iterable': return 'Iterable[Any]';
        default: return 'Any';  // For unknown generic types
      }
    }
    
    // Regular mapping
    switch (type.toLowerCase()) {
      case 'boolean': return 'bool';
      case 'integer': case 'int': return 'int';
      case 'long': return 'int';
      case 'float': return 'float';
      case 'double': return 'float';
      case 'string': return 'str';
      case 'char': return 'str';
      case 'byte': case 'short': return 'int';
      case 'void': return 'None';
      case 'object': return 'Any';
      case 'list': return 'List';
      case 'map': case 'hashmap': return 'Dict';
      default: return type; // Keep custom types as is
    }
  }
}

module.exports = PythonGenerator;
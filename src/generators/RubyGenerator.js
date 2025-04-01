const BaseGenerator = require('./BaseGenerator');

class RubyGenerator extends BaseGenerator {
  constructor() {
    super();
    this.indentSize = 2; // Ruby conventionally uses 2 spaces
  }
  
  generateHeader(classDiagram) {
    return "# Generated Ruby code from PlantUML class diagram\n\n";
  }
  
  supportsPackages() {
    return true; // Ruby has modules which can be used for namespacing
  }
  
  generatePackageStart(packageName) {
    // In Ruby, packages are represented as modules
    const moduleName = this.rubyModuleName(packageName);
    return `module ${moduleName}\n`;
  }
  
  generatePackageEnd(packageName) {
    return "end # module " + this.rubyModuleName(packageName) + "\n\n";
  }
  
  rubyModuleName(name) {
    // Convert package name to CamelCase for Ruby module
    return name.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('::');
  }
  
  generateClass(classObj, classDiagram) {
    let code = '';
    
    // Class documentation
    code += "# #{classObj.name} class\n";
    
    // Class declaration
    if (classObj.isAbstract) {
      code += '# This is an abstract class\n';
    }
    
    code += 'class ' + classObj.name;
    
    // Inheritance
    const parentClass = this.findParentClass(classObj, classDiagram);
    if (parentClass) {
      code += ` < ${parentClass.name}`;
    }
    
    code += '\n';
    
    // Include modules for interfaces (Ruby's way of implementing interfaces)
    const interfaces = this.findImplementedInterfaces(classObj, classDiagram);
    if (interfaces.length > 0) {
      for (const interfaceObj of interfaces) {
        code += this.indent(`include ${interfaceObj.name}`) + '\n';
      }
      code += '\n';
    }
    
    // Attributes as attr_accessor
    if (classObj.attributes.length > 0) {
      const attrs = [];
      
      for (const attr of classObj.attributes) {
        // In Ruby, we use attr_accessor, attr_reader, and attr_writer
        if (attr.visibility === 'private') {
          // Private attributes
          attrs.push(`:${attr.name}`);
        } else {
          // Public attributes
          attrs.push(`:${attr.name}`);
        }
      }
      
      if (attrs.length > 0) {
        code += this.indent(`attr_accessor ${attrs.join(', ')}`) + '\n\n';
      }
    }
    
    // Constructor (initialize method)
    if (classObj.constructors.length > 0 || classObj.attributes.length > 0) {
      code += this.indent('def initialize(');
      
      // Parameters
      const params = [];
      if (classObj.constructors.length > 0) {
        const constructor = classObj.constructors[0]; // Use the first constructor
        params.push(...constructor.parameters.map(p => p.name));
      } else {
        // If no constructor is specified, use attributes
        params.push(...classObj.attributes.map(a => a.name));
      }
      
      // Add optional parameters with default values
      const paramStrings = params.map(p => `${p} = nil`);
      code += paramStrings.join(', ');
      
      code += ')' + '\n';
      
      // Initialize attributes in the constructor
      if (classObj.attributes.length > 0) {
        for (const attr of classObj.attributes) {
          if (!attr.isStatic) {
            code += this.indent(`@${attr.name} = ${attr.name}`, 2) + '\n';
          }
        }
      }
      
      code += this.indent('end') + '\n\n';
    }
    
    // Class methods (static methods)
    const staticMethods = classObj.methods.filter(m => m.isStatic);
    if (staticMethods.length > 0) {
      for (const method of staticMethods) {
        // Class method documentation
        code += this.indent(`# ${method.name} method \n`);
        
        // Method parameters documentation
        if (method.parameters.length > 0) {
          for (const param of method.parameters) {
            if (this.isComplexGenericType(param.type)) {
              const mappedType = this.mapRubyType(param.type);
              code += this.indent(`# @param ${param.name} [${mappedType}] ${param.type} (complex type) \n`);
            } else {
              code += this.indent(`# @param ${param.name} [${param.type}] \n`);
            }
          }
        }
        
        // Return type documentation
        if (method.returnType !== 'void') {
          if (this.isComplexGenericType(method.returnType)) {
            const mappedType = this.mapRubyType(method.returnType);
            code += this.indent(`# @return [${mappedType}] ${method.returnType} (complex type) \n`);
          } else {
            code += this.indent(`# @return [${method.returnType}] \n`);
          }
        }
        
        // Class method definition
        code += this.indent(`def self.${method.name}(${method.parameters.map(p => p.name).join(', ')})`) + '\n';
        
        // Method body
        code += this.indent('# TODO: Implement method', 2) + '\n';
        
        // Return statement for non-void methods
        if (method.returnType !== 'void') {
          if (method.returnType === 'boolean' || method.returnType === 'bool') {
            code += this.indent('return false', 2) + '\n';
          } else if (method.returnType === 'int' || method.returnType === 'long' || 
                    method.returnType === 'float' || method.returnType === 'double') {
            code += this.indent('return 0', 2) + '\n';
          } else if (method.returnType === 'string' || method.returnType === 'String') {
            code += this.indent('return ""', 2) + '\n';
          } else {
            code += this.indent('return nil', 2) + '\n';
          }
        }
        
        code += this.indent('end') + '\n\n';
      }
    }
    
    // Instance methods
    const instanceMethods = classObj.methods.filter(m => !m.isStatic);
    if (instanceMethods.length > 0) {
      for (const method of instanceMethods) {
        // Method documentation
        code += this.indent(`# ${method.name} method` + '\n');
        
        // Method parameters documentation
        if (method.parameters.length > 0) {
          for (const param of method.parameters) {
            if (this.isComplexGenericType(param.type)) {
              const mappedType = this.mapRubyType(param.type);
              code += this.indent(`# @param ${param.name} [${mappedType}] ${param.type} (complex type)`) + '\n';
            } else {
              code += this.indent(`# @param ${param.name} [${param.type}]`) + '\n';
            }
          }
        }
        
        // Return type documentation
        if (method.returnType !== 'void') {
          if (this.isComplexGenericType(method.returnType)) {
            const mappedType = this.mapRubyType(method.returnType);
            code += this.indent(`# @return [${mappedType}] ${method.returnType} (complex type)`) + '\n';
          } else {
            code += this.indent(`# @return [${method.returnType}]`) + '\n';
          }
        }
        
        // Method visibility
        if (method.visibility === 'private' || method.visibility === 'protected') {
          code += this.indent(`${method.visibility}`) + '\n';
        }
        
        // Method definition
        code += this.indent(`def ${method.name}(${method.parameters.map(p => p.name).join(', ')})`) + '\n';
        
        // Method body
        if (method.isAbstract) {
          code += this.indent('raise NotImplementedError, "Abstract method #{self.class.name}##{__method__} must be implemented"', 2) + '\n';
        } else {
          code += this.indent('# TODO: Implement method', 2) + '\n';
          
          // Return statement for non-void methods
          if (method.returnType !== 'void') {
            const mappedReturnType = this.mapRubyType(method.returnType);
            
            if (mappedReturnType === 'Boolean') {
              code += this.indent('return false', 2) + '\n';
            } else if (['Integer', 'Float'].includes(mappedReturnType)) {
              code += this.indent('return 0', 2) + '\n';
            } else if (mappedReturnType === 'String') {
              code += this.indent('return ""', 2) + '\n';
            } else {
              code += this.indent('return nil', 2) + '\n';
            }
          }
        }
        
        code += this.indent('end') + '\n\n';
      }
    }
    
    code += 'end # class ' + classObj.name + '\n\n';
    
    return code;
  }
  
  generateInterface(interfaceObj, classDiagram) {
    let code = '';
    
    // Interface documentation
    code += "# #{interfaceObj.name} module (interface)\n";
    
    // In Ruby, interfaces are modules
    code += 'module ' + interfaceObj.name + '\n';
    
    // Define required methods with NotImplementedError
    for (const method of interfaceObj.methods) {
      // Method documentation
      code += this.indent(`# ${method.name} method`) + '\n';
      
      // Method parameters documentation
      if (method.parameters.length > 0) {
        for (const param of method.parameters) {
          if (this.isComplexGenericType(param.type)) {
            const mappedType = this.mapRubyType(param.type);
            code += this.indent(`# @param ${param.name} [${mappedType}] ${param.type} (complex type)`) + '\n';
          } else {
            code += this.indent(`# @param ${param.name} [${param.type}]`) + '\n';
          }
        }
      }
      
      // Return type documentation
      if (method.returnType !== 'void') {
        if (this.isComplexGenericType(method.returnType)) {
          const mappedType = this.mapRubyType(method.returnType);
          code += this.indent(`# @return [${mappedType}] ${method.returnType} (complex type)`) + '\n';
        } else {
          code += this.indent(`# @return [${method.returnType}]`) + '\n';
        }
      }
      
      // Method definition
      code += this.indent(`def ${method.name}(${method.parameters.map(p => p.name).join(', ')})`) + '\n';
      code += this.indent('raise NotImplementedError, "Method #{self.class.name}##{__method__} must be implemented"', 2) + '\n';
      code += this.indent('end') + '\n\n';
    }
    
    code += 'end # module ' + interfaceObj.name + '\n\n';
    
    return code;
  }
  
  generateEnum(enumObj, classDiagram) {
    let code = '';
    
    // Enum documentation
    code += "# #{enumObj.name} module (enum)\n";
    
    // In Ruby, enums can be modeled as modules with constants
    code += 'module ' + enumObj.name + '\n';
    
    // Enum values
    for (let i = 0; i < enumObj.values.length; i++) {
      code += this.indent(`${enumObj.values[i]} = ${i + 1}`) + '\n';
    }
    
    // Helper methods for enum-like behavior
    code += '\n' + this.indent('# Get all values') + '\n';
    code += this.indent('def self.values') + '\n';
    code += this.indent('  [' + enumObj.values.join(', ') + ']', 2) + '\n';
    code += this.indent('end') + '\n';
    
    code += 'end # module ' + enumObj.name + '\n\n';
    
    return code;
  }
  
  mapRubyType(type) {
    if (!type) return 'nil';
    
    // Handle complex generic types
    if (this.isComplexGenericType(type)) {
      // Extract the base type (e.g., "Map" from "Map<String, Integer>")
      const baseType = this.extractBaseGenericType(type).toLowerCase();
      
      // Map common collection types to Ruby equivalents (for documentation)
      switch (baseType) {
        case 'list': case 'arraylist': return 'Array';
        case 'map': case 'hashmap': return 'Hash';
        case 'set': case 'hashset': return 'Set';
        case 'collection': return 'Array';
        case 'iterable': return 'Enumerable';
        default: return baseType.charAt(0).toUpperCase() + baseType.slice(1);
      }
    }
    
    // Map basic types
    switch (type.toLowerCase()) {
      case 'boolean': case 'bool': return 'Boolean';
      case 'integer': case 'int': case 'long': return 'Integer';
      case 'float': case 'double': return 'Float';
      case 'string': case 'char': return 'String';
      case 'void': return 'nil';
      case 'object': return 'Object';
      default: return type.charAt(0).toUpperCase() + type.slice(1); // Proper casing for Ruby
    }
  }
}

module.exports = RubyGenerator;
        
        //
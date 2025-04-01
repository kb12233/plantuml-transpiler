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
      
      code += `${this.mapJavaType(attr.type)} ${attr.name};\n`;
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
        code += constructor.parameters.map(
          param => `${this.mapJavaType(param.type)} ${param.name}`
        ).join(', ');
        
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
        const mappedType = this.mapJavaType(param.type);
        code += this.indent(this.generateEnhancedParamDoc(param.name, param.type, mappedType) + '\n');
      }
      
      if (method.returnType !== 'void') {
        const mappedReturnType = this.mapJavaType(method.returnType);
        code += this.indent(this.generateEnhancedReturnDoc(method.returnType, mappedReturnType) + '\n');
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
      
      code += `${this.mapJavaType(method.returnType)} ${method.name}(`;
      
      // Parameters
      code += method.parameters.map(
        param => `${this.mapJavaType(param.type)} ${param.name}`
      ).join(', ');
      
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
          } else if (method.returnType === 'int' || method.returnType === 'long' || 
                     method.returnType === 'float' || method.returnType === 'double') {
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
        const mappedType = this.mapJavaType(param.type);
        code += this.indent(this.generateEnhancedParamDoc(param.name, param.type, mappedType) + '\n');
      }
      
      if (method.returnType !== 'void') {
        const mappedReturnType = this.mapJavaType(method.returnType);
        code += this.indent(this.generateEnhancedReturnDoc(method.returnType, mappedReturnType) + '\n');
      }
      
      code += this.indent(' */\n');
      
      // Method signature - in Java interfaces, methods are implicitly public and abstract
      code += this.indent(`${this.mapJavaType(method.returnType)} ${method.name}(`);
      
      // Parameters
      code += method.parameters.map(
        param => `${this.mapJavaType(param.type)} ${param.name}`
      ).join(', ');
      
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
  
  mapJavaType(type) {
    if (!type) return 'void';
    
    // Handle complex generic types
    if (this.isComplexGenericType(type)) {
      // Extract the base type (e.g., "Map" from "Map<String, Integer>")
      const baseType = this.extractBaseGenericType(type);
      
      // Map common collection types
      switch (baseType.toLowerCase()) {
        case 'list': return 'List<Object>';
        case 'arraylist': return 'ArrayList<Object>';
        case 'map': case 'hashmap': return 'Map<Object, Object>';
        case 'set': case 'hashset': return 'Set<Object>';
        case 'collection': return 'Collection<Object>';
        case 'iterable': return 'Iterable<Object>';
        default: return `${baseType}<Object>`;
      }
    }
    
    // For simple types, return the type as is
    return type;
  }
}

module.exports = JavaGenerator;
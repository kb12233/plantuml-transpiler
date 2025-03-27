const BaseGenerator = require('./BaseGenerator');

class CSharpGenerator extends BaseGenerator {
  generateHeader(classDiagram) {
    return "// Generated C# code from PlantUML class diagram\nusing System;\n\n";
  }
  
  generatePackageStart(packageName) {
    return `namespace ${packageName}\n{\n`;
  }
  
  generatePackageEnd(packageName) {
    return '}\n\n';
  }
  
  generateClass(classObj, classDiagram) {
    let code = '';
    
    // Class documentation
    code += this.indent("/// <summary>\n");
    code += this.indent(`/// ${classObj.name} class\n`);
    code += this.indent("/// </summary>\n");
    
    // Class declaration
    if (classObj.isAbstract) {
      code += this.indent('public abstract class ');
    } else {
      code += this.indent('public class ');
    }
    
    code += classObj.name;
    
    // Generic parameters
    if (classObj.generics.length > 0) {
      code += '<' + classObj.generics.join(', ') + '>';
    }
    
    // Inheritance
    const parentClass = this.findParentClass(classObj, classDiagram);
    const interfaces = this.findImplementedInterfaces(classObj, classDiagram);
    
    const inheritance = [];
    if (parentClass) {
      inheritance.push(parentClass.name);
    }
    
    if (interfaces.length > 0) {
      inheritance.push(...interfaces.map(i => i.name));
    }
    
    if (inheritance.length > 0) {
      code += ' : ' + inheritance.join(', ');
    }
    
    code += '\n' + this.indent('{\n');
    
    // Attributes
    for (const attr of classObj.attributes) {
      code += this.indent("/// <summary>\n", 2);
      code += this.indent(`/// ${attr.name} property\n`, 2);
      code += this.indent("/// </summary>\n", 2);
      
      // In C#, attributes are typically properties
      code += this.indent(`${this.mapCSharpVisibility(attr.visibility)} `, 2);
      
      if (attr.isStatic) {
        code += 'static ';
      }
      
      if (attr.isFinal) {
        code += 'readonly ';
      }
      
      code += `${this.mapCSharpType(attr.type)} ${attr.name} { get; set; }\n\n`;
    }
    
    // Constructors
    if (classObj.constructors.length > 0) {
      for (const constructor of classObj.constructors) {
        code += this.indent("/// <summary>\n", 2);
        code += this.indent(`/// Constructor for ${classObj.name}\n`, 2);
        code += this.indent("/// </summary>\n", 2);
        
        code += this.indent(`${this.mapCSharpVisibility(constructor.visibility)} ${classObj.name}(`, 2);
        
        // Parameters
        code += constructor.parameters.map(
          param => `${this.mapCSharpType(param.type)} ${param.name}`
        ).join(', ');
        
        code += ')\n' + this.indent('{\n', 2);
        
        // Constructor body - may call base() if there's a parent
        if (parentClass) {
          code += this.indent('// Call base constructor\n', 3);
          code += this.indent('// base();\n\n', 3);
        }
        
        code += this.indent('// TODO: Implement constructor\n', 3);
        code += this.indent('}\n\n', 2);
      }
    } else if (!classObj.isAbstract) {
      // Generate a default constructor if none specified
      code += this.indent("/// <summary>\n", 2);
      code += this.indent(`/// Default constructor for ${classObj.name}\n`, 2);
      code += this.indent("/// </summary>\n", 2);
      
      code += this.indent(`public ${classObj.name}()\n`, 2);
      code += this.indent('{\n', 2);
      
      if (parentClass) {
        code += this.indent('// Call base constructor\n', 3);
        code += this.indent('// base();\n\n', 3);
      }
      
      code += this.indent('// TODO: Implement constructor\n', 3);
      code += this.indent('}\n\n', 2);
    }
    
    // Methods
    for (const method of classObj.methods) {
      code += this.indent("/// <summary>\n", 2);
      code += this.indent(`/// ${method.name} method\n`, 2);
      
      // Method documentation
      for (const param of method.parameters) {
        code += this.indent(`/// <param name="${param.name}">${param.type} parameter</param>\n`, 2);
      }
      
      if (method.returnType !== 'void') {
        code += this.indent(`/// <returns>${method.returnType}</returns>\n`, 2);
      }
      
      code += this.indent("/// </summary>\n", 2);
      
      // Method signature
      code += this.indent(`${this.mapCSharpVisibility(method.visibility)} `, 2);
      
      if (method.isStatic) {
        code += 'static ';
      }
      
      if (method.isAbstract) {
        code += 'abstract ';
      }
      
      code += `${this.mapCSharpType(method.returnType)} ${method.name}(`;
      
      // Parameters
      code += method.parameters.map(
        param => `${this.mapCSharpType(param.type)} ${param.name}`
      ).join(', ');
      
      code += ')';
      
      // Method body or semicolon
      if (method.isAbstract) {
        code += ';\n\n';
      } else {
        code += '\n' + this.indent('{\n', 2);
        code += this.indent('// TODO: Implement method\n', 3);
        
        // Return statement for non-void methods
        if (method.returnType !== 'void') {
          if (method.returnType === 'bool' || method.returnType === 'boolean') {
            code += this.indent('return false;\n', 3);
          } else if (method.returnType === 'int' || method.returnType === 'long' || 
                     method.returnType === 'float' || method.returnType === 'double') {
            code += this.indent('return 0;\n', 3);
          } else if (method.returnType === 'char') {
            code += this.indent("return ' ';\n", 3);
          } else if (method.returnType === 'byte' || method.returnType === 'short') {
            code += this.indent('return 0;\n', 3);
          } else {
            code += this.indent('return null;\n', 3);
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
    code += this.indent("/// <summary>\n");
    code += this.indent(`/// ${interfaceObj.name} interface\n`);
    code += this.indent("/// </summary>\n");
    
    // Interface declaration
    code += this.indent('public interface ' + interfaceObj.name);
    
    // Generic parameters
    if (interfaceObj.generics.length > 0) {
      code += '<' + interfaceObj.generics.join(', ') + '>';
    }
    
    code += '\n' + this.indent('{\n');
    
    // Methods
    for (const method of interfaceObj.methods) {
      code += this.indent("/// <summary>\n", 2);
      code += this.indent(`/// ${method.name} method\n`, 2);
      
      // Method documentation
      for (const param of method.parameters) {
        code += this.indent(`/// <param name="${param.name}">${param.type} parameter</param>\n`, 2);
      }
      
      if (method.returnType !== 'void') {
        code += this.indent(`/// <returns>${method.returnType}</returns>\n`, 2);
      }
      
      code += this.indent("/// </summary>\n", 2);
      
      // Method signature - in C# interfaces, methods are implicitly public and abstract
      code += this.indent(`${this.mapCSharpType(method.returnType)} ${method.name}(`, 2);
      
      // Parameters
      code += method.parameters.map(
        param => `${this.mapCSharpType(param.type)} ${param.name}`
      ).join(', ');
      
      code += ');\n\n';
    }
    
    code += this.indent('}\n\n');
    
    return code;
  }
  
  generateEnum(enumObj, classDiagram) {
    let code = '';
    
    // Enum documentation
    code += this.indent("/// <summary>\n");
    code += this.indent(`/// ${enumObj.name} enum\n`);
    code += this.indent("/// </summary>\n");
    
    // Enum declaration
    code += this.indent('public enum ' + enumObj.name + '\n');
    code += this.indent('{\n');
    
    // Enum values
    if (enumObj.values.length > 0) {
      code += this.indent(enumObj.values.join(',\n'), 2) + '\n';
    }
    
    code += this.indent('}\n\n');
    
    return code;
  }
  
  mapCSharpVisibility(visibility) {
    switch (visibility) {
      case 'private': return 'private';
      case 'protected': return 'protected';
      case 'package': return 'internal';
      default: return 'public';
    }
  }
  
  mapCSharpType(type) {
    if (!type) return 'void';
    
    switch (type.toLowerCase()) {
      case 'boolean': return 'bool';
      case 'integer': case 'int': return 'int';
      case 'long': return 'long';
      case 'float': return 'float';
      case 'double': return 'double';
      case 'string': return 'string';
      case 'char': return 'char';
      case 'byte': return 'byte';
      case 'short': return 'short';
      case 'void': return 'void';
      case 'object': return 'object';
      default: return type; // Keep custom types as is
    }
  }
}

module.exports = CSharpGenerator;
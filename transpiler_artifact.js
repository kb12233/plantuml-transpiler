/**
 * PlantUML to Code Transpiler
 * 
 * This transpiler converts PlantUML class diagram syntax to various programming languages:
 * - Java
 * - C#
 * - Python
 * - Ruby
 * - Kotlin
 * - JavaScript
 * - TypeScript
 */

// Intermediate Representation Classes
// These classes form the structure that holds the parsed PlantUML data before code generation

class ClassDiagram {
    constructor() {
      this.classes = []; // Array of Class objects
      this.interfaces = []; // Array of Interface objects
      this.enums = []; // Array of Enum objects
      this.relationships = []; // Array of Relationship objects
      this.packages = {}; // Map of package name to array of class/interface names
    }
  }
  
  class Class {
    constructor(name, isAbstract = false, packageName = null) {
      this.name = name;
      this.isAbstract = isAbstract;
      this.packageName = packageName;
      this.attributes = []; // Array of Attribute objects
      this.methods = []; // Array of Method objects
      this.constructors = []; // Array of Method objects specifically for constructors
      this.generics = []; // Array of strings representing generic type parameters
    }
  }
  
  class Interface {
    constructor(name, packageName = null) {
      this.name = name;
      this.packageName = packageName;
      this.methods = []; // Array of Method objects
      this.generics = []; // Array of strings representing generic type parameters
    }
  }
  
  class Enum {
    constructor(name, packageName = null) {
      this.name = name;
      this.packageName = packageName;
      this.values = []; // Array of strings representing enum values
    }
  }
  
  class Attribute {
    constructor(name, type, visibility = 'private', isStatic = false, isFinal = false) {
      this.name = name;
      this.type = type;
      this.visibility = visibility; // 'public', 'private', 'protected', 'package'
      this.isStatic = isStatic;
      this.isFinal = isFinal;
    }
  }
  
  class Method {
    constructor(name, returnType, parameters = [], visibility = 'public', isStatic = false, isAbstract = false) {
      this.name = name;
      this.returnType = returnType;
      this.parameters = parameters; // Array of Parameter objects
      this.visibility = visibility; // 'public', 'private', 'protected', 'package'
      this.isStatic = isStatic;
      this.isAbstract = isAbstract;
    }
  }
  
  class Parameter {
    constructor(name, type) {
      this.name = name;
      this.type = type;
    }
  }
  
  class Relationship {
    constructor(sourceClass, targetClass, type, label = '') {
      this.sourceClass = sourceClass;
      this.targetClass = targetClass;
      this.type = type; // 'inheritance', 'implementation', 'association', 'aggregation', 'composition', 'dependency'
      this.label = label; // Relationship description (e.g. multiplicity)
    }
  }
  
  // PlantUML Parser Class
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
        line.includes('<|..') || // implementation
        line.includes('-->') ||  // association
        line.includes('o-->') || // aggregation
        line.includes('*-->') || // composition
        line.includes('..>') ||  // dependency
        line.includes('-->')     // simple association
      );
    }
    
    parseRelationship(line) {
      // Extract relationship parts (handle labels too)
      const parts = line.split(/\s+/);
      let sourceClass, targetClass, type, label = '';
      
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
  
  // Base Generator Class - This is the abstract base class for all language generators
  class BaseGenerator {
    constructor() {
      this.indentSize = 4;
    }
    
    generate(classDiagram) {
      let code = this.generateHeader(classDiagram);
      
      // Generate code for each package if supported
      if (this.supportsPackages()) {
        for (const packageName in classDiagram.packages) {
          code += this.generatePackageStart(packageName);
          
          // Generate classes, interfaces, and enums in this package
          for (const className of classDiagram.packages[packageName]) {
            const classObj = classDiagram.classes.find(c => c.name === className);
            if (classObj) {
              code += this.generateClass(classObj, classDiagram);
              continue;
            }
            
            const interfaceObj = classDiagram.interfaces.find(i => i.name === className);
            if (interfaceObj) {
              code += this.generateInterface(interfaceObj, classDiagram);
              continue;
            }
            
            const enumObj = classDiagram.enums.find(e => e.name === className);
            if (enumObj) {
              code += this.generateEnum(enumObj, classDiagram);
            }
          }
          
          code += this.generatePackageEnd(packageName);
        }
        
        // Generate entities without a package
        this.generateEntitiesWithoutPackage(classDiagram, code);
      } else {
        // Generate all entities regardless of package
        for (const classObj of classDiagram.classes) {
          code += this.generateClass(classObj, classDiagram);
        }
        
        for (const interfaceObj of classDiagram.interfaces) {
          code += this.generateInterface(interfaceObj, classDiagram);
        }
        
        for (const enumObj of classDiagram.enums) {
          code += this.generateEnum(enumObj, classDiagram);
        }
      }
      
      code += this.generateFooter(classDiagram);
      
      return code;
    }
    
    generateEntitiesWithoutPackage(classDiagram, code) {
      const entitiesInPackages = new Set();
      
      for (const packageName in classDiagram.packages) {
        for (const entityName of classDiagram.packages[packageName]) {
          entitiesInPackages.add(entityName);
        }
      }
      
      // Generate classes without a package
      for (const classObj of classDiagram.classes) {
        if (!entitiesInPackages.has(classObj.name)) {
          code += this.generateClass(classObj, classDiagram);
        }
      }
      
      // Generate interfaces without a package
      for (const interfaceObj of classDiagram.interfaces) {
        if (!entitiesInPackages.has(interfaceObj.name)) {
          code += this.generateInterface(interfaceObj, classDiagram);
        }
      }
      
      // Generate enums without a package
      for (const enumObj of classDiagram.enums) {
        if (!entitiesInPackages.has(enumObj.name)) {
          code += this.generateEnum(enumObj, classDiagram);
        }
      }
      
      return code;
    }
    
    supportsPackages() {
      return true; // Override in language-specific generators if needed
    }
    
    generateHeader(classDiagram) {
      return ''; // To be overridden by language-specific generators
    }
    
    generateFooter(classDiagram) {
      return ''; // To be overridden by language-specific generators
    }
    
    generatePackageStart(packageName) {
      return ''; // To be overridden by language-specific generators
    }
    
    generatePackageEnd(packageName) {
      return ''; // To be overridden by language-specific generators
    }
    
    generateClass(classObj, classDiagram) {
      return ''; // To be overridden by language-specific generators
    }
    
    generateInterface(interfaceObj, classDiagram) {
      return ''; // To be overridden by language-specific generators
    }
    
    generateEnum(enumObj, classDiagram) {
      return ''; // To be overridden by language-specific generators
    }
    
    findParentClass(classObj, classDiagram) {
      const inheritance = classDiagram.relationships.find(
        r => r.type === 'inheritance' && r.sourceClass === classObj.name
      );
      
      if (inheritance) {
        return classDiagram.classes.find(c => c.name === inheritance.targetClass);
      }
      
      return null;
    }
    
    findImplementedInterfaces(classObj, classDiagram) {
      const implementations = classDiagram.relationships.filter(
        r => r.type === 'implementation' && r.sourceClass === classObj.name
      );
      
      return implementations.map(impl => 
        classDiagram.interfaces.find(i => i.name === impl.targetClass)
      ).filter(i => i);
    }
    
    findAssociations(classObj, classDiagram) {
      return classDiagram.relationships.filter(
        r => (r.type === 'association' || r.type === 'aggregation' || r.type === 'composition') &&
             r.sourceClass === classObj.name
      );
    }
    
    indent(code, level = 1) {
      const indent = ' '.repeat(this.indentSize * level);
      return code.split('\n').map(line => line ? indent + line : line).join('\n');
    }
  }
  
  // Java Generator Class
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
          code += constructor.parameters.map(
            param => `${param.type} ${param.name}`
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
        code += method.parameters.map(
          param => `${param.type} ${param.name}`
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
          code += this.indent(` * @param ${param.name} ${param.type} parameter\n`);
        }
        
        if (method.returnType !== 'void') {
          code += this.indent(` * @return ${method.returnType}\n`);
        }
        
        code += this.indent(' */\n');
        
        // Method signature - in Java interfaces, methods are implicitly public and abstract
        code += this.indent(`${method.returnType} ${method.name}(`);
        
        // Parameters
        code += method.parameters.map(
          param => `${param.type} ${param.name}`
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
  }
  
  // C# Generator Class
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
  
  // Python Generator Class
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
        // Method definition
        code += this.indent('@staticmethod') + '\n' + this.indent('def ' + method.name + '(');
        
        // Parameters
        const params = [];
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
            code += this.indent('    ' + param.name + ': A ' + param.type, 2) + '\n';
          }
        }
        
        // Method docstring return value
        if (method.returnType !== 'void' && method.returnType !== 'None') {
          code += this.indent('Returns:', 2) + '\n';
          code += this.indent('    ' + method.returnType, 2) + '\n';
        }
        
        code += this.indent('"""', 2) + '\n';
        
        // Method body
        if (method.isAbstract) {
          code += this.indent('@abstractmethod', 2) + '\n';
          code += this.indent('pass', 2) + '\n\n';
        } else {
          code += this.indent('# TODO: Implement method', 2) + '\n';
          
          // Return statement for non-void methods
          if (method.returnType !== 'void' && method.returnType !== 'None') {
            if (method.returnType === 'bool' || method.returnType === 'boolean') {
              code += this.indent('return False', 2) + '\n\n';
            } else if (method.returnType === 'int' || method.returnType === 'long' || 
                      method.returnType === 'float' || method.returnType === 'double') {
              code += this.indent('return 0', 2) + '\n\n';
            } else if (method.returnType === 'str' || method.returnType === 'string') {
              code += this.indent('return ""', 2) + '\n\n';
            } else {
              code += this.indent('return None', 2) + '\n\n';
            }
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
            code += this.indent(`    ${param.name}: A ${param.type}`, 2) + '\n';
          }
        }
        
        // Method docstring return value
        if (method.returnType !== 'void' && method.returnType !== 'None') {
          code += this.indent('Returns:', 2) + '\n';
          code += this.indent('    ' + method.returnType, 2) + '\n';
        }
        
        code += this.indent('"""', 2) + '\n';
        
        // Abstract method
        code += this.indent('@abstractmethod', 2) + '\n';
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
  
  // Ruby Generator Class
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
          code += this.indent(`# ${method.name} method`);
          
          // Method parameters documentation
          if (method.parameters.length > 0) {
            for (const param of method.parameters) {
              code += this.indent(`# @param ${param.name} [${param.type}]`);
            }
          }
          
          // Return type documentation
          if (method.returnType !== 'void') {
            code += this.indent(`# @return [${method.returnType}]`);
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
          code += this.indent(`# ${method.name} method`);
          
          // Method parameters documentation
          if (method.parameters.length > 0) {
            for (const param of method.parameters) {
              code += this.indent(`# @param ${param.name} [${param.type}]`);
            }
          }
          
          // Return type documentation
          if (method.returnType !== 'void') {
            code += this.indent(`# @return [${method.returnType}]`);
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
            code += this.indent(`# @param ${param.name} [${param.type}]`) + '\n';
          }
        }
        
        // Return type documentation
        if (method.returnType !== 'void') {
          code += this.indent(`# @return [${method.returnType}]`) + '\n';
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
  }
  
  // Kotlin Generator Class
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
          code += method.parameters.map(
            param => `${param.name}: ${this.mapKotlinType(param.type)}`
          ).join(', ');
          
          code += `): ${this.mapKotlinType(method.returnType)} {\n`;
          
          // Method body
          code += this.indent('// TODO: Implement method\n', 3);
          
          // Return statement for non-void methods
          if (method.returnType !== 'void' && method.returnType !== 'Unit') {
            if (method.returnType === 'Boolean') {
              code += this.indent('return false', 3) + '\n';
            } else if (method.returnType === 'Int' || method.returnType === 'Long' || 
                      method.returnType === 'Float' || method.returnType === 'Double') {
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
        code += method.parameters.map(
          param => `${param.name}: ${this.mapKotlinType(param.type)}`
        ).join(', ');
        
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
            } else if (method.returnType === 'Int' || method.returnType === 'Long' || 
                      method.returnType === 'Float' || method.returnType === 'Double') {
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
        code += method.parameters.map(
          param => `${param.name}: ${this.mapKotlinType(param.type)}`
        ).join(', ');
        
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
        case 'private': return 'private';
        case 'protected': return 'protected';
        case 'package': return 'internal';
        default: return 'public';
      }
    }
    
    mapKotlinType(type) {
      if (!type) return 'Unit';
      
      switch (type.toLowerCase()) {
        case 'boolean': return 'Boolean';
        case 'integer': case 'int': return 'Int';
        case 'long': return 'Long';
        case 'float': return 'Float';
        case 'double': return 'Double';
        case 'string': return 'String';
        case 'char': return 'Char';
        case 'byte': return 'Byte';
        case 'short': return 'Short';
        case 'void': return 'Unit';
        case 'object': return 'Any';
        case 'list': return 'List<Any>';
        case 'map': case 'hashmap': return 'Map<Any, Any>';
        case 'array': return 'Array<Any>';
        default: return type; // Keep custom types as is
      }
    }
  }
  
  // JavaScript Generator Class
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
          } else if (method.returnType === 'int' || method.returnType === 'long' || 
                     method.returnType === 'float' || method.returnType === 'double') {
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
  
  // TypeScript Generator Class
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
  
  // Main Transpiler Orchestration Class
  class PlantUMLTranspiler {
    constructor() {
      this.parser = new PlantUMLParser();
      this.generators = {
        'java': new JavaGenerator(),
        'csharp': new CSharpGenerator(),
        'python': new PythonGenerator(),
        'ruby': new RubyGenerator(),
        'kotlin': new KotlinGenerator(),
        'javascript': new JavaScriptGenerator(),
        'typescript': new TypeScriptGenerator()
      };
    }
    
    transpile(plantUmlCode, targetLanguage) {
      // Validate input
      if (!plantUmlCode || plantUmlCode.trim() === '') {
        throw new Error('PlantUML code cannot be empty');
      }
      
      // Normalize target language key
      const language = targetLanguage.toLowerCase();
      
      // Check if the target language is supported
      if (!this.generators[language]) {
        throw new Error(`Unsupported target language: ${targetLanguage}. Supported languages are: ${Object.keys(this.generators).join(', ')}`);
      }
      
      // Parse PlantUML code to intermediate representation
      const classDiagram = this.parser.parse(plantUmlCode);
      
      // Generate code for the target language
      return this.generators[language].generate(classDiagram);
    }
    
    getSupportedLanguages() {
      return Object.keys(this.generators);
    }
  }
  
  // Export the transpiler for use in other modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PlantUMLTranspiler,
      PlantUMLParser,
      // Intermediate Representation Classes
      ClassDiagram,
      Class,
      Interface,
      Enum,
      Attribute,
      Method,
      Parameter,
      Relationship,
      // Generator Classes
      BaseGenerator,
      JavaGenerator,
      CSharpGenerator,
      PythonGenerator,
      RubyGenerator,
      KotlinGenerator,
      JavaScriptGenerator,
      TypeScriptGenerator
    };
  }
  
  // Example usage
  /*
  const transpiler = new PlantUMLTranspiler();
  
  const plantUmlExample = `
  @startuml
  package "com.example.model" {
    class User {
      -id: int
      -name: String
      -email: String
      +User(id: int, name: String, email: String)
      +getId(): int
      +getName(): String
      +setName(name: String): void
      +getEmail(): String
      +setEmail(email: String): void
    }
    
    interface UserService {
      +findById(id: int): User
      +save(user: User): void
      +delete(id: int): boolean
    }
    
    class UserServiceImpl {
      -userRepository: UserRepository
      +UserServiceImpl(userRepository: UserRepository)
      +findById(id: int): User
      +save(user: User): void
      +delete(id: int): boolean
    }
    
    UserServiceImpl ..|> UserService
    UserServiceImpl --> UserRepository
  }
  
  package "com.example.repository" {
    interface UserRepository {
      +findById(id: int): User
      +save(user: User): User
      +delete(id: int): void
    }
  }
  
  User <.. UserService
  @enduml
  `;
  
  // Generate Java code
  const javaCode = transpiler.transpile(plantUmlExample, 'java');
  console.log(javaCode);
  
  // Generate Python code
  const pythonCode = transpiler.transpile(plantUmlExample, 'python');
  console.log(pythonCode);
  */
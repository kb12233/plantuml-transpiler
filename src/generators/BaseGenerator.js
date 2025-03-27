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
      // BUG FIX: We need to set code equal to the result of this function
      code = this.generateEntitiesWithoutPackage(classDiagram, code);
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

module.exports = BaseGenerator;
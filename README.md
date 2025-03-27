# PlantUML Transpiler

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Node.js library that converts PlantUML class diagrams into code in multiple programming languages. Generate clean, well-structured code from your UML diagrams with a single command.

> **Coming Soon**: This package will be published to npm soon! Watch this repository for updates on the official release.

## Features

- **Multi-language support**: Convert PlantUML to Java, C#, Python, Ruby, Kotlin, JavaScript, and TypeScript
- **Complete class modeling**: Handles classes, interfaces, enums, attributes, methods, relationships, and more
- **Package/namespace support**: Correctly implements package/module structures in supported languages
- **Inheritance**: Preserves inheritance and implementation relationships
- **Visibility modifiers**: Maintains public, private, protected, and package access modifiers
- **Language-specific idioms**: Generates code that follows the conventions of each target language

## Installation

Once published, you'll be able to install via npm:

```bash
npm install plantuml-transpiler
```

For now, you can clone this repository and link it locally for development and testing.

## Usage

### Basic Example

```javascript
const PlantUMLTranspiler = require('plantuml-transpiler');

// Create a new transpiler instance
const transpiler = new PlantUMLTranspiler();

// Your PlantUML class diagram
const plantUmlCode = `
@startuml
class User {
  -id: int
  -name: String
  +User(id: int, name: String)
  +getId(): int
  +getName(): String
}

interface UserService {
  +findById(id: int): User
  +save(user: User): void
}

class UserServiceImpl {
  -userRepository: UserRepository
  +UserServiceImpl(userRepository: UserRepository)
  +findById(id: int): User
  +save(user: User): void
}

UserServiceImpl ..|> UserService
UserServiceImpl --> UserRepository
@enduml
`;

// Generate Java code
const javaCode = transpiler.transpile(plantUmlCode, 'java');
console.log(javaCode);

// Generate TypeScript code
const tsCode = transpiler.transpile(plantUmlCode, 'typescript');
console.log(tsCode);
```

### CLI Usage

You can also use the transpiler from the command line:

```bash
npx plantuml-transpile diagram.puml java > User.java
```

## Supported Languages

The transpiler supports the following target languages:

- **Java**: Full support for classes, interfaces, enums, inheritance, etc.
- **C#**: Classes, interfaces, properties, enums, with C#-specific conventions
- **Python**: Classes with type hints, abstract methods, docstrings
- **Ruby**: Classes, modules, attr_accessors, and Ruby idioms
- **Kotlin**: Data classes, interfaces, companion objects
- **JavaScript**: ES6 classes with JSDoc comments
- **TypeScript**: Classes, interfaces, type annotations

## API Reference

### `PlantUMLTranspiler` Class

The main class for converting PlantUML diagrams to code.

#### Constructor

```javascript
const transpiler = new PlantUMLTranspiler();
```

#### Methods

##### `transpile(plantUmlCode, targetLanguage)`

Converts PlantUML code to the specified target language.

- **Parameters**:
  - `plantUmlCode` (string): The PlantUML class diagram code
  - `targetLanguage` (string): One of `'java'`, `'csharp'`, `'python'`, `'ruby'`, `'kotlin'`, `'javascript'`, or `'typescript'`
  
- **Returns**: String containing the generated code in the target language

##### `getSupportedLanguages()`

Returns an array of supported target languages.

- **Returns**: Array of strings representing supported language options

## PlantUML Syntax Support

The transpiler supports the following PlantUML features:

- **Class Definitions**: `class ClassName { ... }`
- **Abstract Classes**: `abstract class ClassName { ... }`
- **Interfaces**: `interface InterfaceName { ... }`
- **Enums**: `enum EnumName { ... }`
- **Attributes**: `+publicAttr: Type`, `-privateAttr: Type`
- **Methods**: `+publicMethod(param: Type): ReturnType`
- **Constructors**: `+ClassName(param: Type)`
- **Static Members**: `{static} +staticMethod()`
- **Inheritance**: `ChildClass --|> ParentClass`
- **Implementation**: `ConcreteClass ..|> InterfaceName`
- **Associations**: `ClassA --> ClassB`
- **Packages**: `package "com.example" { ... }`
- **Generic Types**: `class List<T>`

## Examples

### Input PlantUML

```
@startuml
package "com.example.model" {
  class User {
    -id: int
    -name: String
    +getId(): int
    +setName(name: String): void
  }
}
@enduml
```

### Output Java Code

```java
// Generated Java code from PlantUML class diagram

package com.example.model;

/**
 * User class
 */
public class User {
    private int id;
    private String name;

    /**
     * Default constructor for User
     */
    public User() {
        // TODO: Implement constructor
    }

    /**
     * @return int
     */
    public int getId() {
        // TODO: Implement method
        return 0;
    }

    /**
     * @param name String parameter
     */
    public void setName(String name) {
        // TODO: Implement method
    }
}
```

## Contributing

Contributions are welcome! Here are some ways you can contribute:

1. Report bugs and request features by opening an issue
2. Submit a pull request with bug fixes or new features
3. Improve documentation
4. Add support for more programming languages

Please make sure to update tests as appropriate.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Thanks to the creators of PlantUML for their great diagramming tool
- This project is not affiliated with or endorsed by PlantUML

---

## Advanced Usage

### Custom Transformations

You can access the transpiler's internal components for more specialized needs:

```javascript
const { PlantUMLParser, JavaGenerator } = require('plantuml-transpiler');

// Parse PlantUML to an intermediate representation
const parser = new PlantUMLParser();
const classDiagram = parser.parse(plantUmlCode);

// Modify the intermediate representation
classDiagram.classes.forEach(classObj => {
  // Add custom attributes or methods
});

// Generate code using a specific generator
const javaGenerator = new JavaGenerator();
const customJavaCode = javaGenerator.generate(classDiagram);
```

### React Integration

Here's a simple example of using the transpiler in a React application:

```jsx
import React, { useState } from 'react';
import PlantUMLTranspiler from 'plantuml-transpiler';

function PlantUMLEditor() {
  const [plantUml, setPlantUml] = useState('@startuml\nclass User {\n}\n@enduml');
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState('');
  
  const generateCode = () => {
    const transpiler = new PlantUMLTranspiler();
    const generated = transpiler.transpile(plantUml, language);
    setCode(generated);
  };
  
  return (
    <div>
      <textarea 
        value={plantUml} 
        onChange={(e) => setPlantUml(e.target.value)} 
      />
      
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="java">Java</option>
        <option value="python">Python</option>
        {/* Other languages */}
      </select>
      
      <button onClick={generateCode}>Generate</button>
      
      <pre>{code}</pre>
    </div>
  );
}
```
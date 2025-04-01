# PlantUML Transpiler

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Node.js library that converts PlantUML class diagrams into code in multiple programming languages. Generate clean, well-structured code from your UML diagrams with a single function call.

## Features

- **Multi-language support**: Convert PlantUML to Java, C#, Python, Ruby, Kotlin, JavaScript, and TypeScript
- **Complete class modeling**: Handles classes, interfaces, enums, attributes, methods, relationships, and more
- **Package/namespace support**: Correctly implements package/module structures in supported languages
- **Inheritance and implementation**: Preserves class hierarchies and interface implementations
- **Visibility modifiers**: Maintains public, private, protected, and package access modifiers
- **Language-specific idioms**: Generates code that follows the conventions of each target language
- **Static and final members**: Proper handling of static and final (readonly) attributes and methods
- **Abstract classes and methods**: Correctly implements abstract classes and methods for all languages
- **Generic types**: Support for generic type parameters in classes, interfaces, and methods

## Installation

```bash
npm install plantuml-transpiler
```

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



## Supported Languages

The transpiler supports the following target languages:

| Language | Description |
|----------|-------------|
| Java | Full support for classes, interfaces, enums, generics, visibility modifiers, etc. |
| C# | Classes, interfaces, properties, enums, with C#-specific conventions and documentation |
| Python | Classes with type hints (using typing module), abstract methods, docstrings |
| Ruby | Classes, modules, attr_accessors, and Ruby idioms with YARD-style documentation |
| Kotlin | Data classes, interfaces, companion objects with Kotlin-specific type mapping |
| JavaScript | ES6 classes with JSDoc comments, module exports, and proper inheritance |
| TypeScript | Classes, interfaces, type annotations with TypeScript-specific conventions |

## PlantUML Syntax Support

The transpiler supports the following PlantUML features:

### Class Definitions

```
class ClassName {
  +publicAttr: Type
  -privateAttr: Type
  #protectedAttr: Type
  ~packageAttr: Type
  +publicMethod(param: Type): ReturnType
  -privateMethod(param: Type): ReturnType
}

abstract class AbstractClass {
  {abstract} abstractMethod(param: Type): ReturnType
}
```

### Interfaces

```
interface InterfaceName {
  +method(param: Type): ReturnType
}
```

### Enums

```
enum EnumName {
  VALUE1
  VALUE2
  VALUE3
}
```

### Modifiers

```
class Example {
  {static} +staticAttribute: Type
  {final} -finalAttribute: Type
  {static} {final} #staticFinalAttribute: Type
  {abstract} +abstractMethod(): void
  {static} +staticMethod(): void
}
```

### Constructors

```
class User {
  +User(id: int, name: String)
}
```

### Relationships

```
// Inheritance
Child --|> Parent

// Implementation
Class ..|> Interface

// Association
ClassA --> ClassB

// Aggregation
Container o--> Element

// Composition
Container *--> Element

// Dependency
Client ..> Service
```

### Packages

```
package "com.example.model" {
  class User {
    -id: int
  }
}
```

### Generic Types

```
class List<T> {
  +add(item: T): void
  +get(index: int): T
}

interface Comparable<T> {
  +compareTo(other: T): int
}
```

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

## Example Input/Output

### Input PlantUML

```
@startuml
package "com.example.model" {
  class User {
    -id: int
    -name: String
    +User(id: int, name: String)
    +getId(): int
    +getName(): String
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
     * Constructor for User
     */
    public User(int id, String name) {
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
     * @return String
     */
    public String getName() {
        // TODO: Implement method
        return "";
    }

    /**
     * @param name String parameter
     */
    public void setName(String name) {
        // TODO: Implement method
    }
}
```

## Class Diagram

The library has a modular architecture:

- **PlantUMLTranspiler**: Main class that coordinates parsing and code generation
- **PlantUMLParser**: Parses PlantUML syntax into an intermediate object model
- **BaseGenerator**: Abstract base class for code generators
- **Language-specific generators**: Implement language-specific code generation

## Contributing

Contributions are welcome! Here are some ways you can contribute:

1. Report bugs and request features by opening an issue
2. Submit a pull request with bug fixes or new features
3. Improve documentation
4. Add support for more programming languages

Please make sure to update tests as appropriate.

## Development

To set up for development:

```bash
git clone https://github.com/yourusername/plantuml-transpiler.git
cd plantuml-transpiler
npm install
npm test
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Thanks to the creators of PlantUML for their great diagramming tool
- This project is not affiliated with or endorsed by PlantUML
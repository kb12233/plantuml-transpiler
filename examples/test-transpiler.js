const PlantUMLTranspiler = require('../src/index');

// Create sample PlantUML diagram
const plantUmlCode = `
@startuml
package packageName {
  class User<x, y> {
    {final} id: int
    name: String
    {static} {final} newMethod(newParam: Map<String, Map<String, List<Integer>>>, anotherParam: Map<String, List<Integer>>): Map<String, List<Integer>>
    {abstract} getId(): int
    + {static} setName(name: String): void
    +User(id: int, name: String)
  }

  class NormalUser {
    - {static} {final} email: String
    + {abstract} getEmail(): String
    +setEmail(email: String): void
    +NormalUser(id: int, name: String, email: String)
  }

  enum TimeUnit {
    DAYS
    HOURS
    MINUTES
  }
}

package anotherOne {
  interface UserService<E, F, G> {
    +findById(id: int): User
    +save(user: User): void
  }
}


UserService <|.. User
User ..|> UserService

UserService <.. User
User ..> UserService

User <-- NormalUser
NormalUser --> User

User <|-- NormalUser
NormalUser --|> User

User <--* NormalUser
NormalUser *--> User

User <--o NormalUser
NormalUser o--> User

@enduml
`;

// Debug the parsing step
const parser = new PlantUMLTranspiler().parser;
const classDiagram = parser.parse(plantUmlCode);
console.log("PARSED DIAGRAM:", JSON.stringify(classDiagram, null, 2));

// Initialize transpiler
const transpiler = new PlantUMLTranspiler();


// // Generate and display code for each language
// // Uncomment the following lines to test all supported languages
// console.log("Supported languages:", transpiler.getSupportedLanguages());
// transpiler.getSupportedLanguages().forEach(language => {
//   console.log(`\n\n---------- ${language.toUpperCase()} CODE ----------`);
//   try {
//     const code = transpiler.transpile(plantUmlCode, language);
//     console.log(code);
//   } catch (err) {
//     console.error(`Error generating ${language} code:`, err);
//   }
// });


// Test a specific language
// Supported languages: [
//   'java',
//   'csharp',
//   'python',
//   'ruby',
//   'kotlin',
//   'javascript',
//   'typescript'
// ]
console.log("Supported languages:", transpiler.getSupportedLanguages());
const language = 'ruby'; // Change this to test other languages
console.log(`\n\n---------- ${language.toUpperCase()} CODE ----------`);
try {
  const code = transpiler.transpile(plantUmlCode, language);
  console.log(code);
} catch (err) {
  console.error(`Error generating ${language} code:`, err);
}
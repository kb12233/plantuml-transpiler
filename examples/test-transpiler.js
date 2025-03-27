const PlantUMLTranspiler = require('../src/index');

// Create sample PlantUML diagram
const plantUmlCode = `
@startuml
class User {
  -id: int
  -name: String
  +getId(): int
  +setName(name: String): void
}

interface UserService {
  +findById(id: int): User
  +save(user: User): void
}

User <.. UserService
@enduml
`;

// Debug the parsing step
const parser = new PlantUMLTranspiler().parser;
const classDiagram = parser.parse(plantUmlCode);
console.log("PARSED DIAGRAM:", JSON.stringify(classDiagram, null, 2));

// Initialize transpiler
const transpiler = new PlantUMLTranspiler();

// Test each language
console.log("Supported languages:", transpiler.getSupportedLanguages());

// Generate and display code for each language
transpiler.getSupportedLanguages().forEach(language => {
  console.log(`\n\n---------- ${language.toUpperCase()} CODE ----------`);
  try {
    const code = transpiler.transpile(plantUmlCode, language);
    console.log(code);
  } catch (err) {
    console.error(`Error generating ${language} code:`, err);
  }
});
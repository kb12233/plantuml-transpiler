const PlantUMLParser = require('./parser/PlantUMLParser');
const JavaGenerator = require('./generators/JavaGenerator');
const CSharpGenerator = require('./generators/CSharpGenerator');
const PythonGenerator = require('./generators/PythonGenerator');
const RubyGenerator = require('./generators/RubyGenerator');
const KotlinGenerator = require('./generators/KotlinGenerator');
const JavaScriptGenerator = require('./generators/JavaScriptGenerator');
const TypeScriptGenerator = require('./generators/TypeScriptGenerator');

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
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }
    
    // Parse PlantUML code to intermediate representation
    const classDiagram = this.parser.parse(plantUmlCode);
    
    // DEBUGGING: Log what we found during parsing
    console.log(`Transpiling to ${language}`);
    console.log(`Found ${classDiagram.classes.length} classes`);
    console.log(`Found ${classDiagram.interfaces.length} interfaces`);
    console.log(`Found ${classDiagram.enums.length} enums`);
    console.log(`Found ${classDiagram.relationships.length} relationships`);
    
    // Generate code for the target language
    return this.generators[language].generate(classDiagram);
  }
  
  getSupportedLanguages() {
    return Object.keys(this.generators);
  }
}

// Export the main class for CommonJS
module.exports = PlantUMLTranspiler;

// Also export individual components for advanced usage
module.exports.PlantUMLParser = PlantUMLParser;
module.exports.JavaGenerator = JavaGenerator;
module.exports.CSharpGenerator = CSharpGenerator;
module.exports.PythonGenerator = PythonGenerator;
module.exports.RubyGenerator = RubyGenerator;
module.exports.KotlinGenerator = KotlinGenerator;
module.exports.JavaScriptGenerator = JavaScriptGenerator;
module.exports.TypeScriptGenerator = TypeScriptGenerator;
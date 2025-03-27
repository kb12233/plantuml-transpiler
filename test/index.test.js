const PlantUMLTranspiler = require('../src/index');

describe('PlantUMLTranspiler', () => {
  let transpiler;
  
  beforeEach(() => {
    transpiler = new PlantUMLTranspiler();
  });
  
  test('should return supported languages', () => {
    const languages = transpiler.getSupportedLanguages();
    expect(languages).toContain('java');
    expect(languages).toContain('python');
    // Add more assertions for other languages
  });
  
  test('should transpile a simple class to Java', () => {
    const plantUml = `
      @startuml
      class User {
        -id: int
        +getName(): String
      }
      @enduml
    `;
    
    const javaCode = transpiler.transpile(plantUml, 'java');
    expect(javaCode).toContain('public class User');
    expect(javaCode).toContain('private int id');
    expect(javaCode).toContain('public String getName()');
  });
  
  // Add more tests for different languages and features
});
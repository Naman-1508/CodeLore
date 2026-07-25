import { ParserAdapter } from './parser-interface';

export class JavaAdapter implements ParserAdapter {
  async parseFile(filePath: string, fileContent: string) {
    console.log(`[JavaAdapter] Parsing Java/Kotlin file: ${filePath}`);
    // MVP implementation: returning an empty structure
    return {
      functions: [],
      classes: [],
      dependencies: []
    };
  }

  getSupportedExtensions(): string[] {
    return ['.java', '.kt'];
  }
}

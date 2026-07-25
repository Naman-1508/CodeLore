export interface ParsedEntity {
  name: string;
  startLine: number;
  endLine: number;
}

export interface ParserAdapter {
  parseFile(filePath: string, fileContent: string): Promise<{
    functions: ParsedEntity[];
    classes: ParsedEntity[];
    dependencies: string[];
  }>;
  getSupportedExtensions(): string[];
}

import Parser from 'tree-sitter';
// @ts-ignore
import TypeScript from 'tree-sitter-typescript';

export interface ParsedFunction {
  name: string;
  signature: string;
  startLine: number;
  endLine: number;
}

export interface ParsedClass {
  name: string;
  startLine: number;
  endLine: number;
}

export class CodeParser {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.typescript);
  }

  parse(code: string) {
    const tree = this.parser.parse(code);
    return this.extractEntities(tree.rootNode);
  }

  private extractEntities(rootNode: Parser.SyntaxNode) {
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];

    const traverse = (node: Parser.SyntaxNode) => {
      if (node.type === 'function_declaration' || node.type === 'method_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push({
            name: nameNode.text,
            signature: node.text.split('{')[0].trim(),
            startLine: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
          });
        }
      } else if (node.type === 'class_declaration') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          classes.push({
            name: nameNode.text,
            startLine: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
          });
        }
      }
      
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(rootNode);

    return { functions, classes };
  }
}

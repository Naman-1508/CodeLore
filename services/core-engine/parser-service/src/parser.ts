import Parser from 'tree-sitter';
// @ts-ignore
import TypeScript from 'tree-sitter-typescript';

export interface ParsedFunction {
  name: string;
  signature: string;
  startLine: number;
  endLine: number;
  calls: string[]; // Names of functions this function calls
  isExported?: boolean;
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

    // Helper to find all function calls within a node
    const findCalls = (node: Parser.SyntaxNode): string[] => {
      const calls: string[] = [];
      const traverseCalls = (n: Parser.SyntaxNode) => {
        if (n.type === 'call_expression') {
          const fnNode = n.childForFieldName('function');
          if (fnNode) {
            // It could be an identifier or member_expression
            if (fnNode.type === 'identifier') {
              calls.push(fnNode.text);
            } else if (fnNode.type === 'member_expression') {
              const propNode = fnNode.childForFieldName('property');
              if (propNode) calls.push(propNode.text);
            }
          }
        }
        for (let i = 0; i < n.childCount; i++) {
          traverseCalls(n.child(i)!);
        }
      };
      traverseCalls(node);
      return [...new Set(calls)];
    };

    const traverse = (node: Parser.SyntaxNode) => {
      if (node.type === 'function_declaration' || node.type === 'method_definition' || node.type === 'arrow_function') {
        let nameNode = null;
        if (node.type === 'arrow_function') {
           // We might want to find if it's part of a variable_declarator
           if (node.parent && node.parent.type === 'variable_declarator') {
             nameNode = node.parent.childForFieldName('name');
           }
        } else {
           nameNode = node.childForFieldName('name');
        }

        if (nameNode) {
          const bodyNode = node.childForFieldName('body');
          const calls = bodyNode ? findCalls(bodyNode) : [];
          
          let isExported = false;
          let p = node.parent;
          while (p) {
            if (p.type === 'export_statement' || p.type === 'export_default_statement') {
              isExported = true;
              break;
            }
            p = p.parent;
          }

          functions.push({
            name: nameNode.text,
            signature: node.text.split('{')[0].trim(),
            startLine: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            calls,
            isExported
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

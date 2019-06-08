/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

import * as ts from 'typescript';

import { TypeAnnotation } from './resources';
import * as TypeAnnotations from './resources';

// Our Type Annotation values are often quoted strings
// and we don't generally want the quotes, so unquote the strings
function removeQuotes(str: string) {
  if (typeof str === 'string') {
    str = str.trim();
    const first = str[0], last = str[str.length - 1];
    if ((first === '\'' && last === '\'') || (first === '"' && last === '"')) {
      return str.substr(1,str.length-2);
    }
  }
  return str;
}

export function getInterfacesForFile(projectName, fileName, checker, sourceFile) {
  let templateEntries: TypeAnnotation[][] = [];
  // Visitor implementation
  function visit(node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }

    // If this is a named class...
    if (ts.isClassDeclaration(node) && node.name) {
      let symbol = checker.getSymbolAtLocation(node.name);
      const className = symbol.name;
      
      // Not a fan of this because it's so dense...
      // But this is where we're converting interface implemenetations
      // of Gamgee Type Annotations into things we can turn into
      // SAM template entries.
      // If we have a class and it extends or implements something
      if (node.heritageClauses && node.heritageClauses!.length > 0) {
        // Add a mapped list of those implements/extends clauses
        templateEntries.push(node.heritageClauses.flatMap<TypeAnnotation>((clause) => {
          // Where we only emit stuff for implements keywords
          if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
            // And based on the type of thing implemented
            return clause.types!.flatMap((interfaceType) => {
              const implementsType = checker.getTypeAtLocation(interfaceType.expression);
              const interfaceName = checker.getSymbolAtLocation(interfaceType.expression)!.name;
              // Get information about the type parameters of the implemented interface
              let interfaceParameters = {};
              if (implementsType.typeParameters !== undefined) {
                interfaceParameters = Object.assign({}, ...interfaceType.typeArguments.map((ta, i) => ({[implementsType.typeParameters[i].symbol.name]: removeQuotes(ta.getFullText())})));
              }
              // And if we have a TypeAnnotation class for that interface,
              // Create the value object.
              if (TypeAnnotations[interfaceName] !== undefined) {
                return (new TypeAnnotations[interfaceName](projectName, fileName, className, interfaceParameters)) as TypeAnnotation;
              }
            });
          }
          return [];
        }));
      }
    } else if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
      ts.forEachChild(node, visit);
    }
  }

  // Walk the tree to search for classes
  ts.forEachChild(sourceFile, visit);
  return templateEntries;
}

function isNodeExported(node: ts.Node): boolean {
  return (
    (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}
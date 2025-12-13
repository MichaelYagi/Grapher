// High-performance mathematical expression parser

import { Token, TokenType, ASTNode, ASTNodeType, CompiledFunction, ValidationResult } from '../types';

export class ExpressionParser {
  private cache = new Map<string, CompiledFunction>();
  private readonly cacheMaxSize = 200;

  // Built-in mathematical functions
  private readonly functions = new Map([
    ['sin', Math.sin],
    ['cos', Math.cos],
    ['tan', Math.tan],
    ['asin', Math.asin],
    ['acos', Math.acos],
    ['atan', Math.atan],
    ['sinh', Math.sinh],
    ['cosh', Math.cosh],
    ['tanh', Math.tanh],
    ['log', Math.log],
    ['log10', Math.log10],
    ['exp', Math.exp],
    ['sqrt', Math.sqrt],
    ['abs', Math.abs],
    ['floor', Math.floor],
    ['ceil', Math.ceil],
    ['round', Math.round],
    ['sign', Math.sign],
    ['cbrt', Math.cbrt],
    ['hypot', Math.hypot],
    ['max', Math.max],
    ['min', Math.min]
  ]);

  /**
   * Parse and compile a mathematical expression
   */
  public parse(expression: string): ValidationResult & { compiledFunction?: CompiledFunction } {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(expression);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          isValid: true,
          variables: this.extractVariables(expression),
          compiledFunction: cached
        };
      }

      // Parse and validate
      const tokens = this.tokenize(expression);
      const ast = this.parseTokens(tokens);
      const validation = this.validateAST(ast);
      
      if (!validation.isValid) {
        return validation;
      }

      // Compile to JavaScript function
      const compiledFunction = this.compile(ast);
      
      // Cache the result
      this.addToCache(cacheKey, compiledFunction);
      
      const parseTime = performance.now() - startTime;
      console.debug(`Expression parsed in ${parseTime.toFixed(2)}ms`);

      return {
        isValid: true,
        variables: this.extractVariables(expression),
        compiledFunction
      };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Tokenize the input expression
   */
  private tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expression.length) {
      const char = expression[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (including decimals)
      if (/[0-9.]/.test(char)) {
        let number = '';
        while (i < expression.length && /[0-9.]/.test(expression[i])) {
          number += expression[i++];
        }
        // Validate number format
        if (number.split('.').length > 2) {
          throw new Error(`Invalid number format: ${number}`);
        }
        tokens.push({
          type: TokenType.NUMBER,
          value: number,
          position: i - number.length
        });
        continue;
      }

      // Variables and functions
      if (/[a-zA-Z]/.test(char)) {
        let identifier = '';
        while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
          identifier += expression[i++];
        }

        // Check if it's a function (followed by parentheses)
        if (i < expression.length && expression[i] === '(') {
          if (!this.functions.has(identifier)) {
            throw new Error(`Unknown function: ${identifier}`);
          }
          tokens.push({
            type: TokenType.FUNCTION,
            value: identifier,
            position: i - identifier.length
          });
        } else {
          tokens.push({
            type: TokenType.VARIABLE,
            value: identifier,
            position: i - identifier.length
          });
        }
        continue;
      }

      // Operators
      if (/[+\-*/^]/.test(char)) {
        const operator = char;
        if (operator === '^') {
          tokens.push({
            type: TokenType.OPERATOR,
            value: '**', // Use JS exponentiation operator
            position: i++
          });
        } else {
          tokens.push({
            type: TokenType.OPERATOR,
            value: operator,
            position: i++
          });
        }
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: TokenType.LEFT_PAREN, value: char, position: i++ });
        continue;
      }

      if (char === ')') {
        tokens.push({ type: TokenType.RIGHT_PAREN, value: char, position: i++ });
        continue;
      }

      // Comma for function parameters
      if (char === ',') {
        tokens.push({ type: TokenType.COMMA, value: char, position: i++ });
        continue;
      }

      throw new Error(`Invalid character: ${char} at position ${i}`);
    }

    tokens.push({ type: TokenType.EOF, value: '', position: i });
    return tokens;
  }

  /**
   * Parse tokens into Abstract Syntax Tree using recursive descent
   */
  private parseTokens(tokens: Token[]): ASTNode {
    let current = 0;

    const parseExpression = (): ASTNode => {
      return parseAssignment();
    };

    const parseAssignment = (): ASTNode => {
      let node = parseAdditive();
      
      // Note: Assignment expressions could be added here if needed
      return node;
    };

    const parseAdditive = (): ASTNode => {
      let node = parseMultiplicative();

      while (current < tokens.length) {
        const token = tokens[current];
        if (token.type === TokenType.OPERATOR && (token.value === '+' || token.value === '-')) {
          current++;
          const right = parseMultiplicative();
          node = {
            type: ASTNodeType.BINARY_OPERATION,
            value: token.value,
            left: node,
            right: right
          };
        } else {
          break;
        }
      }

      return node;
    };

    const parseMultiplicative = (): ASTNode => {
      let node = parseExponential();

      while (current < tokens.length) {
        const token = tokens[current];
        if (token.type === TokenType.OPERATOR && (token.value === '*' || token.value === '/')) {
          current++;
          const right = parseExponential();
          node = {
            type: ASTNodeType.BINARY_OPERATION,
            value: token.value,
            left: node,
            right: right
          };
        } else {
          break;
        }
      }

      return node;
    };

    const parseExponential = (): ASTNode => {
      let node = parseUnary();

      while (current < tokens.length) {
        const token = tokens[current];
        if (token.type === TokenType.OPERATOR && token.value === '**') {
          current++;
          const right = parseUnary(); // Right-associative
          node = {
            type: ASTNodeType.BINARY_OPERATION,
            value: '**',
            left: node,
            right: right
          };
        } else {
          break;
        }
      }

      return node;
    };

    const parseUnary = (): ASTNode => {
      const token = tokens[current];
      
      if (token.type === TokenType.OPERATOR && (token.value === '+' || token.value === '-')) {
        current++;
        const right = parseUnary();
        return {
          type: ASTNodeType.UNARY_OPERATION,
          value: token.value,
          right: right
        };
      }

      return parsePrimary();
    };

    const parsePrimary = (): ASTNode => {
      const token = tokens[current];

      if (token.type === TokenType.NUMBER) {
        current++;
        return {
          type: ASTNodeType.NUMBER,
          value: parseFloat(token.value),
          position: token.position
        };
      }

      if (token.type === TokenType.VARIABLE) {
        current++;
        return {
          type: ASTNodeType.VARIABLE,
          value: token.value,
          position: token.position
        };
      }

      if (token.type === TokenType.LEFT_PAREN) {
        current++;
        const node = parseExpression();
        if (tokens[current].type !== TokenType.RIGHT_PAREN) {
          throw new Error(`Missing closing parenthesis at position ${token.position}`);
        }
        current++;
        return node;
      }

      if (token.type === TokenType.FUNCTION) {
        current++;
        if (tokens[current].type !== TokenType.LEFT_PAREN) {
          throw new Error(`Expected '(' after function ${token.value}`);
        }
        current++;

        const args: ASTNode[] = [];
        
        if (tokens[current].type !== TokenType.RIGHT_PAREN) {
          args.push(parseExpression());
          
          while (tokens[current].type === TokenType.COMMA) {
            current++;
            args.push(parseExpression());
          }
        }

        if (tokens[current].type !== TokenType.RIGHT_PAREN) {
          throw new Error(`Missing closing parenthesis for function ${token.value}`);
        }
        current++;

        return {
          type: ASTNodeType.FUNCTION_CALL,
          value: token.value,
          children: args
        };
      }

      throw new Error(`Unexpected token: ${token.value} at position ${token.position}`);
    };

    const result = parseExpression();
    
    if (current < tokens.length && tokens[current].type !== TokenType.EOF) {
      throw new Error(`Unexpected token after end of expression: ${tokens[current].value}`);
    }

    return result;
  }

  /**
   * Validate the AST for semantic correctness
   */
  private validateAST(ast: ASTNode): ValidationResult {
    try {
      this.extractVariablesFromAST(ast);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Validation error'
      };
    }
  }

  /**
   * Extract variables from AST
   */
  private extractVariablesFromAST(ast: ASTNode, variables = new Set<string>()): Set<string> {
    switch (ast.type) {
      case ASTNodeType.VARIABLE:
        variables.add(ast.value as string);
        break;
      case ASTNodeType.BINARY_OPERATION:
      case ASTNodeType.UNARY_OPERATION:
        if (ast.left) this.extractVariablesFromAST(ast.left, variables);
        if (ast.right) this.extractVariablesFromAST(ast.right, variables);
        break;
      case ASTNodeType.FUNCTION_CALL:
        if (ast.children) {
          ast.children.forEach(child => this.extractVariablesFromAST(child, variables));
        }
        break;
    }
    return variables;
  }

  /**
   * Extract variables from expression string (quick check)
   */
  private extractVariables(expression: string): string[] {
    const variables = new Set<string>();
    const variableRegex = /\b([a-zA-Z][a-zA-Z0-9_]*)\b(?!\s*\()/g;
    let match;
    
    while ((match = variableRegex.exec(expression)) !== null) {
      if (!this.functions.has(match[1]) && !/^[0-9.]+$/.test(match[1])) {
        variables.add(match[1]);
      }
    }
    
    return Array.from(variables);
  }

  /**
   * Compile AST to optimized JavaScript function
   */
  private compile(ast: ASTNode): CompiledFunction {
    const variables = Array.from(this.extractVariablesFromAST(ast));
    const jsCode = this.compileToJavaScript(ast);
    
    // Create optimized function with proper error handling
    const mathFunctions = Array.from(this.functions.keys()).join(', ');
    const evaluateFunction = new Function('x', 'params', `
      "use strict";
      const Math = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        log: Math.log,
        log10: Math.log10,
        exp: Math.exp,
        sqrt: Math.sqrt,
        abs: Math.abs,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        sign: Math.sign,
        cbrt: Math.cbrt,
        hypot: Math.hypot,
        max: Math.max,
        min: Math.min,
        PI: Math.PI,
        E: Math.E,
        pow: Math.pow
      };
      try {
        const vars = Object.assign({ x }, params || {});
        ${variables.map(v => `let ${v} = vars.${v} !== undefined ? vars.${v} : 0;`).join('\n        ')}
        return ${jsCode};
      } catch (error) {
        return NaN;
      }
    `) as (x: number, params?: Record<string, number>) => number;

    return {
      evaluate: (x: number, params = {}) => {
        try {
          return evaluateFunction(x, params);
        } catch (error) {
          console.warn('Evaluation error:', error);
          return NaN;
        }
      },
      variables,
      parameters: variables.filter(v => v !== 'x') // Assume x is the independent variable
    };
  }

  /**
   * Compile AST node to JavaScript expression string
   */
  private compileToJavaScript(node: ASTNode): string {
    switch (node.type) {
      case ASTNodeType.NUMBER:
        return String(node.value);
      
      case ASTNodeType.VARIABLE:
        return String(node.value || '');
      
      case ASTNodeType.BINARY_OPERATION:
        const left = this.compileToJavaScript(node.left!);
        const right = this.compileToJavaScript(node.right!);
        return `(${left} ${node.value} ${right})`;
      
      case ASTNodeType.UNARY_OPERATION:
        const operand = this.compileToJavaScript(node.right!);
        return `${node.value}${operand}`;
      
      case ASTNodeType.FUNCTION_CALL:
        const args = node.children!.map(child => this.compileToJavaScript(child)).join(', ');
        return `Math.${node.value}(${args})`;
      
      default:
        throw new Error(`Unknown AST node type: ${node.type}`);
    }
  }

  /**
   * Cache management
   */
  private getCacheKey(expression: string): string {
    return expression.trim().toLowerCase();
  }

  private addToCache(key: string, compiledFunction: CompiledFunction): void {
    if (this.cache.size >= this.cacheMaxSize) {
      // Remove oldest entry (simple LRU)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, compiledFunction);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize
    };
  }
}
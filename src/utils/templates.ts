/**
 * Template variable utilities for prompts
 * Supports {{variable}} syntax
 */

export interface TemplateVariable {
  name: string;
  value: string;
}

/**
 * Extract variable names from template string
 * Example: "Hello {{name}}, you are {{age}} years old" => ["name", "age"]
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Check if template contains variables
 */
export function hasVariables(template: string): boolean {
  return /\{\{(\w+)\}\}/.test(template);
}

/**
 * Replace variables in template with provided values
 */
export function replaceVariables(template: string, variables: TemplateVariable[]): string {
  let result = template;

  for (const variable of variables) {
    const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
    result = result.replace(regex, variable.value);
  }

  return result;
}

/**
 * Validate that all variables in template have been provided
 */
export function validateVariables(template: string, variables: TemplateVariable[]): {
  valid: boolean;
  missing: string[];
} {
  const required = extractVariables(template);
  const provided = variables.map(v => v.name);
  const missing = required.filter(name => !provided.includes(name));

  return {
    valid: missing.length === 0,
    missing,
  };
}

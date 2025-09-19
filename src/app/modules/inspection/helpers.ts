
export const evaluateConditionFn = (condition: string, context: any): boolean => {
  if (!condition) return false;

  // Replace variables in the condition with their values from context
  const expression = condition.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return context[key] !== undefined ? context[key] : `context.${key}`;
  });

  try {
    // Use Function constructor to safely evaluate the expression
    return new Function('context', `return ${expression};`)(context) === true;
  } catch (e) {
    console.error('Error evaluating condition:', e);
    return false;
  }
}

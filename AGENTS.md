# AI Agent Guidelines for vulcan-gui

This document provides guidance for AI agents making changes to this codebase.

## 📋 Key Principle: Maintainability with Schema Updates

This project is a GUI for editing JSON configuration files that conform to `input.schema.json`. The schema is maintained by an upstream team and **will change over time**.

### What This Means for Code Changes

When implementing features or making changes, you must consider:
1. **Will this work if the schema changes?**
2. **Does this introduce hardcoded values that depend on the schema?**

## ⚠️ Critical Rule: Update whenSchemaChanges.md

**WHENEVER you add code that will break or need updates when the schema changes, you MUST update `whenSchemaChanges.md`.**

### Examples That Require Documentation

#### ✅ DO update whenSchemaChanges.md when you:

1. **Add hardcoded arrays of enum values from the schema**
   ```typescript
   // BAD: This list needs manual updates if schema adds new types
   const VISUALIZATION_TYPES = ['point', 'line', 'plane', 'sphere']
   ```
   → Add a new section to whenSchemaChanges.md documenting this array

2. **Create type-specific conditional logic**
   ```typescript
   // BAD: This needs updates if new BC types are added
   if (bcType === 'dirichlet' || bcType === 'riemann') {
     // Show state field
   }
   ```
   → Document which conditionals exist and where

3. **Build wizards or dialogs with hardcoded form fields**
   ```typescript
   // BAD: If schema adds required fields, form is incomplete
   <input name="temperature" />
   <input name="pressure" />
   ```
   → Document the wizard/dialog and its field mapping to schema

4. **Create lists of types that require specific fields**
   ```typescript
   const BC_TYPES_REQUIRING_STATE = ['dirichlet', 'riemann']
   ```
   → Document this mapping in whenSchemaChanges.md

#### ❌ DON'T need to document when you:

1. **Use the schema parser to auto-generate UI**
   - Tree view rendering (automatic)
   - Enum dropdown population (automatic from schema)
   - Required field indicators (automatic)
   - Default values (automatic)

2. **Add generic utility functions**
   - Helper functions that work with any schema
   - Generic validation logic

3. **Make pure UI/styling changes**
   - CSS updates
   - Layout changes
   - Icon changes

## 📝 How to Update whenSchemaChanges.md

When you add schema-dependent code:

1. **Identify the schema dependency**
   - Which part of the schema does your code rely on?
   - What values are hardcoded that come from the schema?

2. **Add a new section or update existing section**
   - Use the existing format (numbered sections)
   - Include file paths and line numbers
   - Show code examples
   - Explain how to update when schema changes

3. **Update the Quick Checklist**
   - Add a checkbox item for testing your new feature

### Template for New Sections

```markdown
### N. [Feature Name]
**File:** `path/to/file.tsx` (lines ~X-Y)

**Hardcoded Array/Logic:**
```typescript
// Show the problematic code
```

**How to Update:**
1. Look in schema at: `[path to relevant schema location]`
2. [Step-by-step instructions]
3. [What to update in the code]

**Example from Schema:**
```json
{
  // Show relevant schema snippet
}
```
```

## 🎯 Decision Framework

Ask yourself these questions when adding new code:

### Question 1: Is this value in the schema?
- **YES** → Will it change if schema updates?
  - **YES** → Is it auto-loaded from schema at runtime?
    - **NO** → **Document it in whenSchemaChanges.md**
    - **YES** → No documentation needed
  - **NO** → No documentation needed
- **NO** → No documentation needed

### Question 2: Does this assume specific schema structure?
- **YES** → Will it break if schema structure changes?
  - **YES** → **Document it in whenSchemaChanges.md**
  - **NO** → No documentation needed
- **NO** → No documentation needed

## 📚 Examples from This Codebase

### Good: Auto-adapting code
```typescript
// This automatically works with any schema changes
const enumValues = schemaProperty.enum || []
return (
  <select>
    {enumValues.map(val => <option key={val} value={val}>{val}</option>)}
  </select>
)
```

### Bad: Schema-dependent code (needs documentation)
```typescript
// This breaks if schema adds new BC types
const BC_TYPES = [
  'dirichlet',
  'riemann',
  'no slip'
]
// ⚠️ Must be documented in whenSchemaChanges.md
```

### Good: Making it semi-automatic
```typescript
// Better: Load from schema at runtime
const bcTypes = loadBCTypesFromSchema(schema)

// But if you still hardcode for UX reasons, document it!
const BC_TYPES = ['dirichlet', 'riemann', 'no slip']
// ⚠️ Still needs documentation because it's not fully automatic
```

## 🔄 Workflow Summary

1. **Before implementing**: Consider schema change impact
2. **While implementing**: Note any schema dependencies
3. **After implementing**: Update whenSchemaChanges.md if needed
4. **Before committing**: Review your changes against this checklist

## 💡 Future Vision

The ultimate goal is to minimize manual schema tracking by:
- Auto-generating more UI from schema at runtime
- Creating schema-aware utilities that adapt automatically
- Using TypeScript code generation from schema

Until then, **whenSchemaChanges.md is our safety net** to ensure the project doesn't silently break when the upstream team updates the schema.

---

**Remember: If you hardcode it, document it. Future maintainers (human or AI) will thank you.**

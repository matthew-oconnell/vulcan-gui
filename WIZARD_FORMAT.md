# Declarative Wizard Format Specification

## Overview

This document defines a JSON-based declarative format for creating interactive configuration wizards that can be used in both graphical user interfaces (GUIs) and command-line interfaces (CLIs). The format supports conditional logic, form validation, and direct configuration file manipulation.

## Design Goals

1. **Platform Agnostic**: Same wizard definition works for GUI, CLI, and non-interactive modes
2. **Testable**: Wizard behavior can be verified through replay files
3. **Maintainable**: Configuration logic separated from UI code
4. **Versionable**: Wizard definitions can be versioned and migrated
5. **Reproducible**: Replay files create audit trail and enable automation

## Wizard Definition Format

### Root Structure

```json
{
  "wizard": "Wizard Name",
  "version": "1.0",
  "description": "Optional description of what this wizard configures",
  "steps": [
    // Array of step definitions
  ]
}
```

### Step Types

#### 1. Choice Step

Present user with mutually exclusive options.

```json
{
  "id": "unique_step_id",
  "question": "Display question text",
  "type": "choice",
  "description": "Optional longer description or help text",
  "condition": {
    "step": "previous_step_id",
    "equals": "value"
  },
  "options": [
    {
      "value": "internal_value",
      "label": "User-facing label",
      "description": "Help text for this option",
      "actions": [
        // Array of actions to execute when selected
      ]
    }
  ]
}
```

#### 2. File Input Step

Prompt user to provide a file path.

```json
{
  "id": "unique_step_id",
  "question": "Display question text",
  "type": "file",
  "description": "Optional description",
  "placeholder": "Example: /path/to/file.yaml",
  "hint": "Additional guidance text",
  "validation": {
    "required": true,
    "extensions": [".yaml", ".yml", ".dat"]
  },
  "actions": [
    // Actions to execute with the file path
  ]
}
```

#### 3. Form Step

Present multiple input fields together.

```json
{
  "id": "unique_step_id",
  "question": "Display question text",
  "type": "form",
  "description": "Optional description",
  "fields": [
    {
      "id": "field_id",
      "label": "Field label",
      "type": "number",
      "placeholder": "e.g., 0.001",
      "step": 0.0001,
      "min": 0.0,
      "max": 1.0,
      "required": false,
      "config_path": "path.to.config.value"
    },
    {
      "id": "field_id_2",
      "label": "Select field",
      "type": "select",
      "options": [
        { "value": "val1", "label": "Option 1" },
        { "value": "val2", "label": "Option 2" }
      ],
      "config_mapping": {
        "val1": { "scheme": "BDF", "order": 1 },
        "val2": { "scheme": "BDF", "order": 2 }
      }
    }
  ],
  "actions": [
    // Actions after form completion
  ]
}
```

#### 4. Text Input Step

Single text field input.

```json
{
  "id": "unique_step_id",
  "question": "Display question text",
  "type": "text",
  "description": "Optional description",
  "placeholder": "Example text",
  "default": "default value",
  "validation": {
    "required": true,
    "pattern": "^[a-zA-Z0-9_]+$",
    "minLength": 1,
    "maxLength": 100
  },
  "actions": [
    // Actions with input value
  ]
}
```

#### 5. Number Input Step

Single numeric input.

```json
{
  "id": "unique_step_id",
  "question": "Display question text",
  "type": "number",
  "description": "Optional description",
  "placeholder": "e.g., 1.4",
  "default": 1.4,
  "step": 0.1,
  "min": 1.0,
  "max": 2.0,
  "validation": {
    "required": true
  },
  "actions": [
    // Actions with numeric value
  ]
}
```

### Conditional Logic

Steps can be conditionally shown based on previous answers.

```json
{
  "condition": {
    "step": "gas_model",
    "equals": "multispecies"
  }
}
```

**Advanced conditions:**

```json
{
  "condition": {
    "and": [
      { "step": "gas_model", "equals": "multispecies" },
      { "step": "species_type", "equals": "reacting" }
    ]
  }
}
```

```json
{
  "condition": {
    "or": [
      { "step": "reaction_type", "equals": "edl" },
      { "step": "reaction_type", "equals": "combustion" }
    ]
  }
}
```

```json
{
  "condition": {
    "step": "time_mode",
    "not_equals": "steady"
  }
}
```

### Actions

Actions are executed when an option is selected or a step is completed.

#### set_config

Write a value to the configuration structure.

```json
{
  "type": "set_config",
  "path": "HyperSolve.thermodynamics.species",
  "value": ["N2", "O2", "NO", "N", "O"]
}
```

**Special value tokens:**
- `"{input}"` - Use the user's input value
- `"{field:field_id}"` - Use value from a specific form field
- `"{step:step_id}"` - Use value from a previous step

```json
{
  "type": "set_config",
  "path": "HyperSolve.thermodynamics.reaction model filename",
  "value": "{input}"
}
```

#### set_multiple

Set multiple config values at once.

```json
{
  "type": "set_multiple",
  "configs": [
    {
      "path": "HyperSolve.thermodynamics.chemical nonequilibrium",
      "value": true
    },
    {
      "path": "HyperSolve.thermodynamics.species",
      "value": ["N2", "O2"]
    }
  ]
}
```

#### goto

Navigate to another step.

```json
{
  "type": "goto",
  "step": "time_mode"
}
```

#### finish

Complete the wizard.

```json
{
  "type": "finish"
}
```

#### validate

Run custom validation logic.

```json
{
  "type": "validate",
  "validator": "check_file_exists",
  "error_message": "The specified file does not exist"
}
```

## Wizard Replay Format

### Replay File Structure

A replay file captures the user's journey through a wizard, including all answers and the resulting configuration.

```json
{
  "wizard": "New Project Wizard",
  "wizard_version": "1.0",
  "replay_version": "1.0",
  "timestamp": "2026-01-14T21:45:00Z",
  "description": "7-species Earth EDL with unsteady time accuracy",
  "answers": {
    "gas_model": "multispecies",
    "species_type": "reacting",
    "reaction_type": "edl",
    "planetary_body": "earth",
    "earth_species_model": "7-species",
    "time_mode": "unsteady",
    "time_accuracy": {
      "timestep": 0.001,
      "end_time": 1.0,
      "cfl": 0.9,
      "scheme": "bdf2"
    }
  },
  "steps_taken": [
    "gas_model",
    "species_type",
    "reaction_type",
    "planetary_body",
    "earth_species_model",
    "time_mode",
    "time_accuracy"
  ],
  "expected_config": {
    "HyperSolve": {
      "thermodynamics": {
        "chemical nonequilibrium": true,
        "species": ["N2", "O2", "NO", "N", "O", "NO+", "e-"]
      },
      "time accuracy": {
        "type": "fixed timestep",
        "timestep": 0.001,
        "cfl": 0.9,
        "scheme": "BDF",
        "order": 2
      }
    }
  },
  "metadata": {
    "user": "username",
    "hostname": "workstation",
    "platform": "GUI",
    "notes": "Testing 7-species air model for hypersonic flow"
  }
}
```

### Replay File Fields

- **wizard**: Name of the wizard (must match wizard definition)
- **wizard_version**: Version of wizard definition used
- **replay_version**: Version of replay format (for future compatibility)
- **timestamp**: ISO 8601 timestamp when replay was created
- **description**: Human-readable description of this configuration
- **answers**: Key-value pairs of step IDs and user responses
- **steps_taken**: Ordered list of steps traversed (for debugging conditional logic)
- **expected_config**: The configuration structure that should be produced
- **metadata**: Optional additional information

## Use Cases

### 1. Unit Testing

```typescript
import { runWizard, loadReplay } from 'wizard-engine'

test('EDL 7-species wizard produces correct config', () => {
  const wizardDef = loadWizard('new-project-wizard.json')
  const replay = loadReplay('tests/replays/edl-7species.json')
  
  const config = runWizard(wizardDef, replay.answers)
  
  expect(config).toEqual(replay.expected_config)
})
```

### 2. Regression Testing

```bash
# Run all saved replays and verify outputs
npm run test:wizard-replays

# Output:
# ✓ edl-5species.json - PASS
# ✓ edl-7species.json - PASS
# ✓ mars-park.json - PASS
# ✓ combustion-unsteady.json - PASS
# ✓ single-species-steady.json - PASS
```

### 3. Non-Interactive CLI Mode

```bash
# Replay a saved configuration
vulcan-setup --replay=my-project.replay.json --output=input.json

# Or provide answers directly
vulcan-setup --answers='{"gas_model":"single-species","time_mode":"steady"}' --output=input.json
```

### 4. Interactive CLI Mode

```bash
$ vulcan-setup --wizard=new-project

? Select Gas Model
  > Single Species Perfect Gas
    Multispecies

? Time Dependency
    Steady State
  > Time Dependent (Unsteady)

? Configure time accuracy
  Time Step (Δt): 0.001
  End Time: 1.0
  CFL Number: 0.9
  Temporal Scheme: [BDF2]

✓ Configuration saved to input.json
✓ Replay saved to new-project.replay.json
```

### 5. GUI Mode

The same wizard definition renders as a graphical wizard with:
- Visual step indicators
- Back/Next navigation
- Form validation
- Option cards with descriptions
- Progress tracking

### 6. Documentation and Examples

Replay files serve as examples:

```
examples/
  ├── earth-edl-5species-steady.replay.json
  ├── earth-edl-7species-unsteady.replay.json
  ├── mars-park-steady.replay.json
  ├── combustion-methane-air.replay.json
  └── single-species-supersonic.replay.json
```

### 7. Wizard Versioning and Migration

```json
{
  "wizard": "New Project Wizard",
  "wizard_version": "2.0",
  "replay_version": "1.0",
  "migration": {
    "from_version": "1.0",
    "changes": [
      "Renamed step 'gas_type' to 'gas_model'",
      "Split 'species_model' into separate steps for Earth and Mars",
      "Added validation for reaction model file existence"
    ],
    "backward_compatible": true
  }
}
```

### 8. Configuration Comparison

```bash
# Compare two replay files
vulcan-diff baseline.replay.json new-case.replay.json

# Output:
# Differences found:
#   time_accuracy.timestep: 0.001 → 0.0005
#   time_accuracy.scheme: bdf1 → bdf2
#   
# Config differences:
#   HyperSolve.time accuracy.timestep: 0.001 → 0.0005
#   HyperSolve.time accuracy.scheme: BDF → BDF
#   HyperSolve.time accuracy.order: 1 → 2
```

### 9. Continuous Integration

```yaml
# .github/workflows/test-wizards.yml
name: Test Wizards
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run wizard regression tests
        run: npm run test:wizard-replays
      - name: Validate wizard definitions
        run: npm run validate:wizards
```

## Implementation Guidelines

### Wizard Engine Interface

```typescript
interface WizardEngine {
  // Load wizard definition
  loadWizard(path: string): WizardDefinition
  
  // Run wizard interactively
  runInteractive(wizard: WizardDefinition): Promise<WizardResult>
  
  // Run wizard with pre-recorded answers
  runReplay(wizard: WizardDefinition, replay: ReplayFile): WizardResult
  
  // Validate wizard definition
  validateWizard(wizard: WizardDefinition): ValidationResult
  
  // Save replay file
  saveReplay(result: WizardResult, path: string): void
  
  // Compare two replay files
  compareReplays(replay1: ReplayFile, replay2: ReplayFile): Diff[]
}
```

### Platform Adapters

```typescript
// GUI Adapter (React)
class ReactWizardRenderer {
  render(wizard: WizardDefinition): JSX.Element
}

// CLI Adapter (inquirer/prompts)
class CLIWizardRenderer {
  render(wizard: WizardDefinition): Promise<Answers>
}

// Non-interactive Adapter
class HeadlessWizardRunner {
  run(wizard: WizardDefinition, answers: Answers): Config
}
```

### Validator Interface

```typescript
interface WizardValidator {
  validateStep(step: Step, answer: any): ValidationResult
  validateFile(path: string, constraints: FileValidation): boolean
  validatePattern(value: string, pattern: string): boolean
  validateRange(value: number, min: number, max: number): boolean
}
```

## Best Practices

### Wizard Design

1. **Keep steps focused**: Each step should ask one clear question
2. **Provide helpful descriptions**: Use description fields to guide users
3. **Use sensible defaults**: Pre-fill common values when possible
4. **Validate early**: Catch errors at input time, not after completion
5. **Show progress**: Let users know where they are in the process

### Replay Files

1. **Name descriptively**: `earth-edl-7species-unsteady.replay.json`
2. **Add descriptions**: Explain what scenario this represents
3. **Include metadata**: User, date, purpose
4. **Version control**: Commit replays as test fixtures
5. **Document expected behavior**: Use `expected_config` field

### Testing

1. **Test happy paths**: Common configurations should have replays
2. **Test edge cases**: Unusual but valid combinations
3. **Test validation**: Ensure invalid inputs are caught
4. **Test backwards compatibility**: Old replays should still work

### Versioning

1. **Semantic versioning**: Major.Minor.Patch for wizard definitions
2. **Breaking changes**: Increment major version if old replays won't work
3. **Migration paths**: Document how to upgrade old replays
4. **Deprecation warnings**: Give users time to migrate

## Example: Complete New Project Wizard

See `examples/new-project-wizard.json` for the complete wizard definition and `examples/replays/` directory for example replay files covering common scenarios.

## Future Enhancements

1. **Conditional actions**: Execute different actions based on runtime conditions
2. **External validators**: Plugin system for custom validation logic
3. **Dynamic options**: Load option lists from external sources
4. **Multi-step validation**: Cross-step validation rules
5. **Wizard composition**: Include sub-wizards within wizards
6. **Localization**: Multi-language support for wizard text
7. **Wizard analytics**: Track which paths users take most often
8. **Auto-migration**: Automatically upgrade old replay files

## License

This specification is released under MIT license and can be implemented in any programming language or framework.

# Boundary Condition Dialog

## Overview

The Boundary Condition Dialog is a new component that provides a comprehensive interface for creating boundary conditions in the Vulcan GUI. It replaces the previous simple BC creation that only set basic defaults.

## Features

### 1. **BC Type Selection**
- Dropdown list with all 38 BC types from the schema
- Types include: dirichlet, viscous wall, riemann, slip wall, extrapolation, and many more
- Each type has specific requirements that are conditionally shown

### 2. **Unassigned Surface Selection**
- Checkbox list showing all mesh surfaces that are NOT currently assigned to any BC
- Shows surface tag names and tag numbers
- Displays whether surfaces are lumped (multiple regions combined)
- "Select All" / "Deselect All" buttons for convenience
- Real-time counter showing how many surfaces are selected

### 3. **Conditional Fields Based on BC Type**

#### State Selection (for certain BC types)
Required for types like:
- `dirichlet`, `strong dirichlet`
- `riemann`
- `mass flux inflow`
- `subsonic inflow total`
- `fixed subsonic inflow`
- `engine inlet`

Shows a dropdown of available states from the configuration, or a warning if no states exist.

#### Wall Temperature (for viscous walls)
Required for types like:
- `no slip`
- `wall matching`
- `weak no slip`

Options:
- Adiabatic (default)
- Radiative Equilibrium
- Constant Temperature (with numeric input field)

### 4. **Smart Validation**
- Prevents creation if no surfaces are selected
- Checks that required state is selected for BC types that need it
- Provides clear error messages

## How to Use

### From Right-Click Context Menu
1. Right-click on any surface in the 3D viewport
2. Select "Create new BC from surface"
3. The dialog opens with that surface pre-selected
4. Configure the BC type and other options
5. Add more surfaces if desired
6. Click "Create Boundary Condition"

### From Editor Panel
1. Select "boundary conditions" in the tree panel
2. Click the "Add Boundary Condition" button in the editor panel
3. The dialog opens with no surfaces pre-selected
4. Select surfaces from the list
5. Configure BC type and options
6. Click "Create Boundary Condition"

## Implementation Details

### Files Created
- `/src/components/BoundaryConditionDialog/BoundaryConditionDialog.tsx` - Main component
- `/src/components/BoundaryConditionDialog/BoundaryConditionDialog.css` - Styling

### Files Modified
- `/src/components/Viewport3D/Viewport3D.tsx` - Integrated dialog into right-click workflow
- `/src/components/EditorPanel/EditorPanel.tsx` - Integrated dialog into add BC button

### Key Functions

**`getUnassignedSurfaces()`**
- Scans all existing BCs to find which surfaces are already assigned
- Returns only surfaces that are available for new BCs
- Handles various tag formats (number, string, arrays)

**`handleCreate()`**
- Validates required fields
- Builds BC object with appropriate properties
- Adds BC to store and selects it
- Closes dialog

## BC Properties Handled

The dialog automatically handles these properties:
- `id` - Auto-generated unique ID
- `name` - User-provided or auto-generated from type
- `type` - Selected from dropdown
- `mesh boundary tags` - Single number or array based on selections
- `state` - For BC types that require a state reference
- `wall temperature` - For viscous wall types

Additional type-specific properties can be added after creation via the editor panel.

## Future Enhancements

Potential improvements:
1. Add more type-specific fields (e.g., `blending factor` for riemann)
2. Allow editing existing BCs (not just creating new ones)
3. Surface preview/highlight when hovering in the list
4. Group surfaces by tag name pattern
5. Import BC definitions from templates
6. Validate that all required surfaces are assigned before allowing solve

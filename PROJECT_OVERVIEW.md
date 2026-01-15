# Vulcan CFD GUI - Project Overview

## Project Purpose

Vulcan CFD GUI is a web-based graphical user interface designed to streamline the setup and configuration of Computational Fluid Dynamics (CFD) simulations. The application bridges user-friendly visual interactions with a powerful C++ backend for mesh handling and computation.

## Core Objectives

1. **Interactive 3D Mesh Visualization**: Provide intuitive navigation and manipulation of CFD surface meshes
2. **Boundary Condition Configuration**: Enable users to visually select mesh surfaces and assign boundary conditions
3. **Comprehensive Simulation Setup**: Offer a complete interface for configuring all aspects of CFD simulations
4. **Schema-Driven Configuration**: Auto-generate UI elements based on existing JSON schemas and defaults

## Key Features

### 1. 3D Visualization Window (Primary Panel)

**Capabilities:**
- Render triangular and quadrilateral surface meshes
- Interactive camera controls:
  - Orbit/rotate around the mesh
  - Pan across the view
  - Zoom in/out
- Surface selection via mouse clicking
- Visual highlighting of selected surfaces
- Display of mesh sub-regions with distinct identification

**Mesh Data Structure:**
- Surface mesh geometry (vertices, normals, connectivity)
- Sub-region metadata:
  - Region name
  - Region ID number
  - Boundary condition assignments

### 2. Configuration Tree Panel (Left Panel)

**Capabilities:**
- Hierarchical tree view of the global CFD configuration JSON
- Expandable/collapsible nodes for nested structures
- Visual indicators for:
  - Required vs. optional fields
  - Modified vs. default values
  - Validation status
- Click-to-select navigation
- Search/filter functionality

**Data Model:**
- Global CFD simulation configuration
- Mesh-independent parameters
- Boundary condition definitions
- Solver settings
- Material properties
- Initial conditions

### 3. Configuration Editor Panel (Center/Right Panel)

**Capabilities:**
- Context-aware display of selected configuration section
- Dynamic form generation based on JSON schemas
- Input validation and error messaging
- Reset to defaults functionality
- Inline help/documentation tooltips
- Visual schema-driven wizards for complex entries

**Editor Types:**
- Text inputs (strings, numbers)
- Dropdown selectors (enums)
- Boolean toggles
- Array/list editors
- Nested object editors
- File path selectors
- Unit-aware numeric inputs

### 4. Boundary Condition Assignment

**Workflow:**
1. User selects a surface in the 3D viewer
2. Surface metadata displays in the editor panel
3. User assigns/modifies boundary condition type
4. User configures BC-specific parameters
5. Changes stored in surface metadata JSON
6. Visual feedback in 3D viewer (colors, labels)

**Data Flow:**
- Surface selection → Surface metadata retrieval
- BC configuration → Surface metadata update
- Metadata changes → C++ backend synchronization
- Backend updates → 3D visualization refresh

## Architecture Overview

### Component Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Application                         │
├──────────────┬──────────────────────┬───────────────────────┤
│  Tree Panel  │   Editor Panel       │   3D Viewer Panel     │
│              │                      │                       │
│  - JSON tree │   - Dynamic forms    │   - WebGL rendering   │
│  - Navigation│   - Schema-based UI  │   - Mesh interaction  │
│  - Search    │   - Validation       │   - Selection         │
└──────────────┴──────────────────────┴───────────────────────┘
                           │
                           ↓
                  ┌────────────────┐
                  │  Web Backend   │
                  │  (API Server)  │
                  └────────────────┘
                           │
                           ↓
                  ┌────────────────┐
                  │  C++ Library   │
                  ├────────────────┤
                  │ - Mesh I/O     │
                  │ - Geometry ops │
                  │ - Validation   │
                  └────────────────┘
```

### Data Management

**1. Global Configuration JSON**
- Single source of truth for simulation parameters
- Schema-validated structure
- Version controlled
- Exportable/importable

**2. Surface Metadata JSON**
- Per-surface boundary conditions
- Region identifiers and names
- Custom surface properties
- Synchronized with C++ backend

**3. Schema Files**
- JSON Schema definitions for all configuration sections
- Default values specification
- Validation rules
- UI hints (input types, ranges, descriptions)

## Technical Requirements

### Frontend Requirements

1. **3D Rendering Engine**
   - Hardware-accelerated graphics (WebGL/WebGPU)
   - Efficient handling of large meshes (100k+ triangles)
   - Smooth interaction (60 FPS target)
   - Selection and picking capabilities

2. **UI Framework**
   - Responsive layout with resizable panels
   - Tree view component
   - Dynamic form generation
   - Modal dialogs for wizards

3. **State Management**
   - Maintain application state
   - Undo/redo functionality
   - Dirty state tracking
   - Auto-save capabilities

### Backend Requirements

1. **C++ Integration Layer**
   - Mesh file parsing (multiple CFD formats)
   - Geometry operations (surface extraction, normals)
   - Mesh validation
   - Fast JSON serialization/deserialization

2. **API Design**
   - RESTful or RPC endpoints
   - Efficient data transfer (binary formats for meshes)
   - Real-time updates capability
   - Error handling and reporting

3. **Data Processing**
   - Mesh decimation/simplification for visualization
   - Region detection and labeling
   - Boundary extraction
   - Quality checks

### Integration Requirements

1. **C++ ↔ Web Communication**
   - Low-latency data exchange
   - Binary mesh data transfer
   - JSON metadata exchange
   - Bidirectional updates

2. **Schema Integration**
   - Automatic UI generation from schemas
   - Runtime schema validation
   - Default value population
   - Type safety enforcement

## User Workflows

### Workflow 1: Loading and Inspecting a Mesh

1. User loads a CFD mesh file via file dialog
2. C++ library parses mesh and extracts surface
3. Surface geometry sent to frontend
4. 3D viewer renders mesh
5. Tree panel populates with detected regions
6. User explores mesh via 3D controls

### Workflow 2: Setting Boundary Conditions

1. User clicks on a surface region in 3D viewer
2. Editor panel displays current BC metadata
3. User selects BC type from dropdown (e.g., "Wall", "Inlet", "Outlet")
4. BC-specific form appears based on schema
5. User fills in parameters (e.g., velocity, temperature)
6. Changes saved to surface metadata JSON
7. Surface updates visual appearance (color coding)

### Workflow 3: Configuring Simulation Parameters

1. User navigates tree panel to a configuration section
2. Section schema loaded from schema files
3. Editor panel generates form with current/default values
4. User modifies parameters
5. Validation occurs in real-time
6. Valid changes merged into global JSON
7. Invalid entries show error messages

### Workflow 4: Exporting Configuration

1. User triggers export action
2. Application validates entire configuration
3. Global JSON and surface metadata combined
4. C++ backend performs final validation
5. Configuration file(s) written to disk
6. Ready for CFD solver consumption

## Future Enhancements

### Immediate Roadmap

1. **Mesh Loading Integration (High Priority)**
   - Implement C++ mesh loader for .csm, .egads, and .meshb files
   - Create API interface between C++ backend and GUI frontend
   - Load actual surface mesh geometry and metadata
   - Replace mock surface data with real mesh-derived surfaces
   - Extract mesh boundary tags and names from loaded geometry
   - Populate availableSurfaces from mesh data instead of hardcoded array

2. **Dynamic Schema Parsing**
   - Auto-extract BC types from schema's Boundary Condition oneOf array
   - Auto-extract state modes from State oneOf definitions
   - Eliminate hardcoded BC_TYPES and state wizard modes
   - Generate type-specific field displays dynamically

3. **Configuration Persistence**
   - Implement Save functionality to export configuration as JSON
   - Implement Open functionality to load saved configurations
   - Add auto-save with dirty state tracking
   - Implement Validate against JSON schema

### Long-term Enhancements

- **Import existing configurations**: Load previous simulation setups
- **Configuration templates**: Pre-defined setups for common cases
- **Mesh quality visualization**: Color-coded quality metrics
- **Geometry editing**: Basic mesh modification tools
- **Multi-mesh support**: Handle multiple mesh domains
- **Collaborative features**: Multi-user editing sessions
- **Solver integration**: Direct job submission and monitoring
- **Results preview**: Basic post-processing visualization
- **Sketch-2-Solution Integration**: Adaptive mesh refinement workflow

## Success Criteria

1. **Usability**: Non-expert users can set up basic simulations
2. **Performance**: Smooth interaction with meshes up to 500k elements
3. **Reliability**: Zero data loss, robust error handling
4. **Extensibility**: Easy to add new BC types and parameters
5. **Maintainability**: Clean architecture, good documentation

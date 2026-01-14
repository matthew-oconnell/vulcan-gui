# Vulcan CFD GUI

A web-based graphical user interface for setting up Computational Fluid Dynamics (CFD) simulations.

## Features

✅ **Resizable 3-Panel Layout**
- Left panel with configuration tree (top) and property editor (bottom)
- Large right panel for 3D mesh visualization
- Click and drag resize handles to adjust panel sizes

✅ **Configuration Tree View**
- Hierarchical view of the CFD simulation configuration
- Expandable/collapsible nodes
- Click to select and edit properties

✅ **Property Editor**
- Dynamic forms for editing selected configuration
- Sample form controls (dropdowns, inputs, checkboxes)
- Action buttons for save/reset

✅ **3D Viewport**
- WebGL-powered 3D rendering using Three.js
- Interactive camera controls:
  - Left-click + drag to rotate
  - Right-click + drag to pan
  - Scroll to zoom
- Sample mesh geometry (placeholder for CFD meshes)
- Grid reference and lighting

## Tech Stack

- **React 18** with TypeScript
- **Three.js** via React Three Fiber for 3D rendering
- **Vite** for fast development and building
- **react-resizable-panels** for resizable layout
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will open at `http://localhost:3000/`

### Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
vulcan-gui/
├── src/
│   ├── components/
│   │   ├── TreePanel/          # Configuration tree view
│   │   ├── EditorPanel/        # Property editor
│   │   └── Viewport3D/         # 3D mesh viewer
│   ├── App.tsx                 # Main app with layout
│   ├── App.css                 # Layout styles
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Next Steps

### WebAssembly Integration
- [ ] Set up Emscripten for C++ compilation
- [ ] Create mesh reader module
- [ ] Integrate WASM with React app
- [ ] Load real CFD mesh files

### UI Enhancements
- [ ] Implement JSON schema-based form generation
- [ ] Add boundary condition assignment workflow
- [ ] Surface selection and highlighting
- [ ] Color-coded mesh regions

### Data Management
- [ ] State management with Zustand
- [ ] JSON schema validation
- [ ] Import/export configuration files
- [ ] Undo/redo functionality

## License

TBD

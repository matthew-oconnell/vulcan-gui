# Vulcan CFD GUI - Technology Stack Analysis

## Overview

This document analyzes different technology stack options for building the Vulcan CFD GUI, focusing on web technologies that integrate well with C++ and provide robust 3D rendering capabilities.

## Core Requirements Recap

1. **Web-based application** (runs in browser)
2. **C++ library integration** (mesh I/O, geometry operations)
3. **High-performance 3D rendering** (WebGL/WebGPU)
4. **Interactive mesh visualization** (rotate, pan, zoom, selection)
5. **Dynamic UI generation** from JSON schemas
6. **Bidirectional data flow** between frontend and C++ backend

---

## Recommended Technology Stack

### Option A: Modern JavaScript/TypeScript Stack (Recommended)

**Frontend:**
- **Framework**: React or Vue.js
- **Language**: TypeScript
- **3D Rendering**: Three.js (WebGL wrapper)
- **UI Components**: Ant Design, Material-UI, or Shadcn/ui
- **State Management**: Zustand or Redux Toolkit
- **Form Generation**: React-JSONSchema-Form or similar

**Backend/Bridge:**
- **Runtime**: Node.js
- **C++ Binding**: Node.js Native Addons (N-API) or WebAssembly
- **API Layer**: Express.js or Fastify
- **Communication**: WebSocket (Socket.io) for real-time + REST for operations

**C++ Integration:**
- **Approach 1**: WebAssembly (Emscripten)
  - Compile C++ directly to WASM
  - Run in browser (no server needed for mesh ops)
  - Excellent performance
  
- **Approach 2**: Node.js Native Module
  - Use N-API or node-addon-api
  - C++ runs server-side
  - Better for heavy computations

**Build Tools:**
- Vite or Webpack
- TypeScript compiler
- CMake for C++ builds
- Emscripten (if using WASM)

#### Pros:
✅ Excellent 3D rendering with Three.js (battle-tested, huge community)  
✅ TypeScript provides type safety and better IDE support  
✅ Rich ecosystem for UI components and form generation  
✅ WebAssembly allows C++ to run directly in browser  
✅ Node.js native modules enable server-side C++ integration  
✅ Hot reload and excellent developer experience  
✅ Easy deployment (static site or Node.js server)

#### Cons:
❌ WebAssembly has some limitations (file I/O, threading)  
❌ Native modules require compilation for different platforms  
❌ JavaScript/TypeScript learning curve if team is C++ focused

---

### Option B: Electron-Based Desktop App

**Frontend:**
- Same as Option A (React/Vue + Three.js + TypeScript)

**Backend:**
- **Runtime**: Electron (Chromium + Node.js)
- **C++ Integration**: Native Node.js modules (easier than pure web)
- **IPC**: Electron's IPC for renderer ↔ main process

**Deployment:**
- Packaged desktop application (.exe, .app, .deb)

#### Pros:
✅ Full access to filesystem and system resources  
✅ Easier C++ integration via native modules  
✅ No browser compatibility concerns  
✅ Can bundle everything (C++ libs, meshes, etc.)  
✅ Better performance for heavy operations

#### Cons:
❌ Not a true web app (requires installation)  
❌ Larger distribution size  
❌ Separate builds for each platform  
❌ More complex deployment process

---

### Option C: Python Backend + Modern Frontend

**Frontend:**
- React/Vue + Three.js (same as Option A)

**Backend:**
- **Language**: Python
- **Framework**: FastAPI or Flask
- **C++ Binding**: pybind11 or Boost.Python
- **Communication**: REST API + WebSockets

**C++ Integration:**
- Compile C++ as Python extension module
- Call from Python backend
- Serve data to frontend via API

#### Pros:
✅ Python is easier than raw C++ for web APIs  
✅ pybind11 makes C++ wrapping straightforward  
✅ FastAPI has excellent performance and documentation  
✅ Great for data science/engineering teams  
✅ Easy deployment (Docker, etc.)

#### Cons:
❌ Extra layer (Python) between C++ and frontend  
❌ Potential performance overhead  
❌ More complex stack (JS + Python + C++)

---

### Option D: Full C++ with WebAssembly + Lightweight Frontend

**Frontend:**
- Vanilla JavaScript/TypeScript + Three.js
- Minimal framework (or no framework)
- Direct WASM module integration

**Backend:**
- Pure WebAssembly compiled from C++
- All mesh operations in browser

**C++ Integration:**
- Emscripten compile entire C++ library to WASM
- Expose C++ functions to JavaScript
- Direct memory sharing

#### Pros:
✅ Maximum performance (C++ in browser)  
✅ No server needed for mesh operations  
✅ Single language team (mostly C++)  
✅ Smallest runtime dependencies

#### Cons:
❌ WASM limitations (no direct file access, limited threading)  
❌ More complex debugging  
❌ Need JavaScript glue code for UI  
❌ Larger initial download (WASM binary)

---

## 3D Rendering Library Comparison

### Three.js (Recommended)

**Pros:**
- Mature, stable, huge community
- Excellent documentation and examples
- High-level API (easy to use)
- Built-in geometry helpers
- Raycasting for selection
- Wide browser support

**Cons:**
- Abstraction layer adds some overhead
- Can be opinionated

**Use Case**: Perfect for this project

---

### Babylon.js

**Pros:**
- Similar to Three.js, very capable
- Great for complex scenes
- Built-in physics engines
- Excellent inspector/debugger

**Cons:**
- Slightly heavier than Three.js
- Smaller community

**Use Case**: Alternative to Three.js

---

### Raw WebGL

**Pros:**
- Maximum control and performance
- No dependencies
- Smallest bundle size

**Cons:**
- Very low-level, verbose
- Must implement camera, selection, etc.
- Longer development time

**Use Case**: Only if extreme performance needed

---

### WebGPU (Future)

**Pros:**
- Next-gen graphics API
- Better performance than WebGL
- Compute shader support

**Cons:**
- Still experimental (limited browser support)
- API is evolving
- Not production-ready yet

**Use Case**: Consider for future migration

---

## C++ Integration Options Detailed

### 1. WebAssembly (Emscripten)

**How it works:**
```bash
# Compile C++ to WASM
emcc mesh_reader.cpp -o mesh_reader.js -s WASM=1
```

**JavaScript usage:**
```javascript
import Module from './mesh_reader.js';
const mesh = Module.readMesh('model.cgns');
```

**Best for:**
- Compute-heavy operations in browser
- Offline-capable apps
- Mesh parsing and geometry operations

**Challenges:**
- File I/O requires workarounds (Emscripten FS)
- Limited threading (Workers)
- Memory management between JS and C++

---

### 2. Node.js Native Modules (N-API)

**How it works:**
```cpp
// C++ addon
napi_value ReadMesh(napi_env env, napi_callback_info info) {
    // Read mesh using C++ library
    // Return JSON to Node.js
}
```

**Node.js usage:**
```javascript
const meshReader = require('./build/Release/mesh_reader.node');
const mesh = meshReader.readMesh('model.cgns');
```

**Best for:**
- Server-side mesh processing
- Heavy I/O operations
- Large mesh files

**Challenges:**
- Requires compilation per platform
- Async operations need careful handling
- Must manage memory between C++ and V8

---

### 3. Hybrid Approach (WASM + Native Module)

**Strategy:**
- Light operations in WASM (browser)
- Heavy operations in Native Module (server)
- Frontend can work offline with cached data

**Example:**
- Small meshes: WASM parsing in browser
- Large meshes: Server-side native module
- Geometry operations: WASM
- File I/O: Server with native module

---

## Recommended Stack for Vulcan CFD GUI

### **Choice: WebAssembly-First Architecture**

**Frontend:**
- **React 18** with TypeScript
- **Three.js** for 3D rendering
- **React Three Fiber** (React wrapper for Three.js)
- **Zustand** for state management
- **Ant Design** or **Shadcn/ui** for UI components
- **react-jsonschema-form** for schema-driven forms

**C++ Layer (Compiled to WebAssembly):**
- **Emscripten** for C++ → WASM compilation
- Mesh reading library (your existing code)
- Surface extraction and geometry operations
- JSON serialization/deserialization
- All mesh processing in-browser

**Backend (Optional/Minimal):**
- **Static file server** (Vite dev server, nginx, or Vercel)
- Optional Node.js/Python API for:
  - File uploads (large meshes)
  - Computation offloading
  - Multi-user collaboration features

**Build & Dev Tools:**
- **Vite** for frontend bundling
- **Emscripten** (emcc) for C++ → WASM compilation
- **CMake** for C++ build configuration
- **TypeScript** throughout
- **GitHub Actions** or similar for CI/CD

### Why WebAssembly?

1. **True Web App**: No server required for mesh operations - deploy as static site
2. **Maximum Performance**: C++ runs at near-native speed in browser
3. **Offline Capable**: All mesh processing happens client-side
4. **Simple Deployment**: Host on Vercel, Netlify, GitHub Pages, or any static host
5. **Cost Effective**: No backend servers to maintain or scale
6. **Modern & Future-Proof**: WASM is the future of web performance
7. **Single Codebase**: C++ library works in browser and native tools
8. **Developer Experience**: Great debugging tools (Chrome DevTools, emscripten flags)

### Project Structure (WebAssembly-First)

```
vulcan-gui/
├── src/                      # React + TypeScript frontend
│   ├── components/
│   │   ├── TreePanel/
│   │   ├── EditorPanel/
│   │   └── Viewport3D/
│   ├── hooks/
│   ├── store/
│   ├── wasm/                # WASM module interface
│   │   ├── mesh-loader.ts  # TypeScript wrapper for WASM
│   │   └── types.ts        # WASM ↔ JS type definitions
│   └── types/
│
├── wasm/                     # C++ source (compiled to WASM)
│   ├── src/
│   │   ├── mesh_reader.cpp
│   │   ├── mesh_reader.h
│   │   ├── surface_extractor.cpp
│   │   ├── json_utils.cpp
│   │   └── bindings.cpp    # Emscripten bindings
│   ├── include/
│   ├── CMakeLists.txt
│   └── build.sh            # Emscripten build script
│
├── public/
│   ├── wasm/               # Built WASM files (output)
│   │   ├── mesh-module.wasm
│   │   └── mesh-module.js
│   └── schemas/            # JSON schemas
│       ├── boundary-conditions.schema.json
│       └── simulation-config.schema.json
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---WebAssembly Implementation Details

### Emscripten Setup

**Installation:**
```bash
# Install Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

**Basic Build Script (`wasm/build.sh`):**
```bash
#!/bin/bash
emcc src/*.cpp \
  -o ../public/wasm/mesh-module.js \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="MeshModule" \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
  --bind \
  -O3 \
  -I include
```

**C++ Bindings Example (`wasm/src/bindings.cpp`):**
```cpp
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "mesh_reader.h"

using namespace emscripten;

// Expose C++ functions to JavaScript
EMSCRIPTEN_BINDINGS(mesh_module) {
    class_<Mesh>("Mesh")
        .constructor<>()
        .function("getVertexCount", &Mesh::getVertexCount)
        .function("getVertices", &Mesh::getVertices)
        .function("getFaces", &Mesh::getFaces);
    
    function("loadMeshFromFile", &loadMeshFromFile);
    function("loadMeshFromBuffer", &loadMeshFromBuffer);
    function("extractSurface", &extractSurface);
}
```

**TypeScript Usage (`src/wasm/mesh-loader.ts`):**
```typescript
import MeshModuleFactory from '../../public/wasm/mesh-module.js';

let meshModule: any = null;

export async function initWasm() {
    meshModule = await MeshModuleFactory();
    return meshModule;
}

export function loadMesh(fileBuffer: ArrayBuffer) {
    const uint8Array = new Uint8Array(fileBuffer);
    const buffer = meshModule._malloc(uint8Array.length);
    meshModule.HEAPU8.set(uint8Array, buffer);
    
    const mesh = meshModule.loadMeshFromBuffer(buffer, uint8Array.length);
    meshModule._free(buffer);
    
    return mesh;
}
```

### File I/O with Emscripten

**Option 1: Browser File API** (Recommended)
```typescript
// User selects file
const input = document.createElement('input');
input.type = 'file';
input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files[0];
    const buffer = await file.arrayBuffer();
    const mesh = loadMesh(buffer);
};
```

**Option 2: Emscripten Virtual Filesystem**
```cpp
// Mount browser filesystem
EM_ASM(
    FS.mkdir('/data');
    FS.mount(IDBFS, {}, '/data');
);
```

### Memory Management

**Best Practices:**
- Use `_malloc` and `_free` for large data transfers
- Enable `ALLOW_MEMORY_GROWTH` for dynamic meshes
- Return typed arrays to JavaScript (Float32Array for vertices)
- Use `emscripten::val` for JSON objects

**Example:**
```cpp
emscripten::val getMeshData(const Mesh& mesh) {
    emscripten::val result = emscripten::val::object();
    
    // Convert vertices to typed array
    auto vertices = mesh.getVertices();
    emscripten::val vertexArray = emscripten::val::global("Float32Array")
        .new_(vertices.size());
    
    for (size_t i = 0; i < vertices.size(); i++) {
        vertexArray.set(i, vertices[i]);
    }
    
    result.set("vertices", vertexArray);
    result.set("vertexCount", mesh.getVertexCount());
    
    return result;
}
```

---

## Deployment Strategy

**Development:**
```bash
# Terminal 1: Build WASM on changes
cd wasm && ./build.sh --watch

# Terminal 2: Run Vite dev server
npm run dev
```

**Production:**
```bash
# Build WASM (optimized)
cd wasm && ./build.sh --release

# Build React app
npm run build

# Deploy to Vercel/Netlify
vercel deploy
# or
netlify deploy
```

**Static Hosting Options:**
- Vercel (best DX, automatic deployments)
- Netlify (great for static sites)
- GitHub Pages (free, simple)
- AWS S3 + CloudFront (scalable)
- Azure Static Web Apps

---

## Next Steps

1. **Set up Emscripten**: Install SDK and verify it works
2. **Create minimal WASM module**: Simple "hello world" C++ → WASM → JS
3. **Prototype mesh loading**: Read a simple mesh format (STL or OBJ)
4. **Initialize React + Three.js**: Render WASM-loaded mesh data
5. **Build the 3D viewer**: Camera controls, selection, surface highlighting
6. **Implement tree panel**: JSON schema-based tree view
7. **Create editor panel**: Dynamic forms from schemas
8. **Integrate BC workflow**: Click surface → edit metadata → update JSON

Ready to scaffold the initial project structure

Would you like me to set up a basic project structure with this recommended stack?

import { create } from 'zustand'
import { TreeNode } from '../utils/schemaParser'
import { Surface } from '../types/surface'
import { ConfigData, BoundaryCondition } from '../types/config'
import { MeshData } from '../utils/stlParser'

interface AppState {
  selectedNode: TreeNode | null
  setSelectedNode: (node: TreeNode | null) => void
  selectedSurface: Surface | null
  setSelectedSurface: (surface: Surface | null) => void
  selectedBC: BoundaryCondition | null
  setSelectedBC: (bc: BoundaryCondition | null) => void
  selectedState: State | null
  setSelectedState: (state: State | null) => void
  soloBC: BoundaryCondition | null
  setSoloBC: (bc: BoundaryCondition | null) => void
  configData: ConfigData
  availableSurfaces: Surface[]
  meshData: MeshData | null
  addBoundaryCondition: (bc: BoundaryCondition) => void
  updateBoundaryCondition: (id: string, updates: Partial<BoundaryCondition>) => void
  deleteBoundaryCondition: (id: string) => void
  addState: (state: State) => void
  updateState: (id: string, updates: Partial<State>) => void
  deleteState: (id: string) => void
  initializeConfig: (projectConfig: any) => void
  loadMesh: (meshData: MeshData, filename: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node, selectedSurface: null, selectedBC: null, selectedState: null }),
  selectedSurface: null,
  setSelectedSurface: (surface) => set({ selectedSurface: surface, selectedNode: null, selectedBC: null, selectedState: null }),
  selectedBC: null,
  setSelectedBC: (bc) => set({ selectedBC: bc, selectedNode: null, selectedSurface: null, selectedState: null }),
  selectedState: null,
  setSelectedState: (state) => set({ selectedState: state, selectedNode: null, selectedSurface: null, selectedBC: null }),
  soloBC: null,
  setSoloBC: (bc) => set({ soloBC: bc }),
  
  // Initialize with empty configuration
  configData: {
    HyperSolve: {
      'boundary conditions': [],
      states: {}
    }
  },
  
  availableSurfaces: [],
  meshData: null,
  
  addBoundaryCondition: (bc) => set((state) => ({
    configData: {
      ...state.configData,
      HyperSolve: {
        ...state.configData.HyperSolve,
        'boundary conditions': [
          ...(state.configData.HyperSolve?.['boundary conditions'] || []),
          bc
        ]
      }
    },
    selectedBC: bc,
    selectedNode: null,
    selectedSurface: null
  })),
  
  updateBoundaryCondition: (id, updates) => set((state) => ({
    configData: {
      ...state.configData,
      HyperSolve: {
        ...state.configData.HyperSolve,
        'boundary conditions': state.configData.HyperSolve?.['boundary conditions']?.map(bc =>
          bc.id === id ? { ...bc, ...updates } : bc
        ) || []
      }
    },
    // Update selectedBC if it's the one being modified
    selectedBC: state.selectedBC?.id === id 
      ? { ...state.selectedBC, ...updates }
      : state.selectedBC
  })),
  
  deleteBoundaryCondition: (id) => set((state) => ({
    configData: {
      ...state.configData,
      HyperSolve: {
        ...state.configData.HyperSolve,
        'boundary conditions': state.configData.HyperSolve?.['boundary conditions']?.filter(bc =>
          bc.id !== id
        ) || []
      }
    },
    selectedBC: state.selectedBC?.id === id ? null : state.selectedBC
  })),
  
  addState: (state) => set((s) => ({
    configData: {
      ...s.configData,
      HyperSolve: {
        ...s.configData.HyperSolve,
        states: {
          ...(s.configData.HyperSolve?.states || {}),
          [state.name]: state
        }
      }
    },
    selectedState: state,
    selectedNode: null,
    selectedSurface: null,
    selectedBC: null
  })),
  
  updateState: (id, updates) => set((s) => {
    const states = s.configData.HyperSolve?.states || {}
    const currentState = Object.values(states).find(st => st.id === id)
    if (!currentState) return s
    
    const oldName = currentState.name
    const updatedState = { ...currentState, ...updates }
    
    // If name changed, remove old key and add new one
    const newStates = { ...states }
    if (updates.name && updates.name !== oldName) {
      delete newStates[oldName]
      newStates[updates.name] = updatedState
    } else {
      newStates[oldName] = updatedState
    }
    
    return {
      configData: {
        ...s.configData,
        HyperSolve: {
          ...s.configData.HyperSolve,
          states: newStates
        }
      },
      selectedState: s.selectedState?.id === id ? updatedState : s.selectedState
    }
  }),
  
  deleteState: (id) => set((s) => {
    const states = s.configData.HyperSolve?.states || {}
    const stateToDelete = Object.values(states).find(st => st.id === id)
    if (!stateToDelete) return s
    
    const newStates = { ...states }
    delete newStates[stateToDelete.name]
    
    return {
      configData: {
        ...s.configData,
        HyperSolve: {
          ...s.configData.HyperSolve,
          states: newStates
        }
      },
      selectedState: s.selectedState?.id === id ? null : s.selectedState
    }
  }),
  
  initializeConfig: (projectConfig) => set((s) => {
    const newConfig: any = {
      HyperSolve: {
        'boundary conditions': [],
        states: {}
      }
    }
    
    // Set thermodynamics based on gas model
    if (projectConfig.gasModel === 'single-species') {
      newConfig.HyperSolve.thermodynamics = {
        species: ['perfect gas']
      }
    } else if (projectConfig.gasModel === 'multispecies') {
      // Multispecies configuration
      if (projectConfig.reactionType === 'edl') {
        // EDL chemistry
        newConfig.HyperSolve.thermodynamics = {
          'chemical nonequilibrium': true
        }
        
        if (projectConfig.planetaryBody === 'earth') {
          // Earth air models
          if (projectConfig.speciesModel === '5-species') {
            newConfig.HyperSolve.thermodynamics.species = ['N2', 'O2', 'NO', 'N', 'O']
          } else if (projectConfig.speciesModel === '7-species') {
            newConfig.HyperSolve.thermodynamics.species = ['N2', 'O2', 'NO', 'N', 'O', 'NO+', 'e-']
          } else if (projectConfig.speciesModel === '11-species') {
            newConfig.HyperSolve.thermodynamics.species = ['N2', 'O2', 'NO', 'N', 'O', 'NO+', 'N2+', 'O2+', 'N+', 'O+', 'e-']
          }
        } else if (projectConfig.planetaryBody === 'mars') {
          // Mars Park model (5 species)
          newConfig.HyperSolve.thermodynamics.species = ['CO2', 'CO', 'N2', 'O2', 'NO']
        }
      } else if (projectConfig.reactionType === 'combustion') {
        // Combustion chemistry
        newConfig.HyperSolve.thermodynamics = {
          'chemical nonequilibrium': true,
          'reaction model filename': projectConfig.reactionModelFile || 'kinetic_data'
        }
        // Species will be extracted from reaction model file later
        newConfig.HyperSolve.thermodynamics.species = []
      } else if (projectConfig.speciesType === 'non-reacting') {
        // Non-reacting multispecies
        newConfig.HyperSolve.thermodynamics = {
          'chemical nonequilibrium': false,
          species: [] // User will add species manually
        }
      }
    }
    
    // Set time accuracy based on time mode
    if (projectConfig.timeMode === 'unsteady' && projectConfig.timeAccuracy) {
      newConfig.HyperSolve['time accuracy'] = {
        type: 'fixed timestep'
      }
      
      if (projectConfig.timeAccuracy.timeStep) {
        newConfig.HyperSolve['time accuracy'].timestep = projectConfig.timeAccuracy.timeStep
      }
      
      if (projectConfig.timeAccuracy.cfl) {
        newConfig.HyperSolve['time accuracy'].cfl = projectConfig.timeAccuracy.cfl
      }
      
      if (projectConfig.timeAccuracy.scheme) {
        // Map scheme names to schema values
        const schemeMap: any = {
          'bdf1': 'BDF',
          'bdf2': 'BDF',
          'rk4': 'ESDIRK'
        }
        newConfig.HyperSolve['time accuracy'].scheme = schemeMap[projectConfig.timeAccuracy.scheme]
        
        if (projectConfig.timeAccuracy.scheme === 'bdf1') {
          newConfig.HyperSolve['time accuracy'].order = 1
        } else if (projectConfig.timeAccuracy.scheme === 'bdf2') {
          newConfig.HyperSolve['time accuracy'].order = 2
        } else if (projectConfig.timeAccuracy.scheme === 'rk4') {
          newConfig.HyperSolve['time accuracy'].order = 4
        }
      }
    } else {
      // Steady state - use local timestepping
      newConfig.HyperSolve['time accuracy'] = {
        type: 'local timestepping'
      }
    }
    
    return {
      ...s,
      configData: newConfig,
      selectedNode: null,
      selectedSurface: null,
      selectedBC: null,
      selectedState: null
    }
  }),
  
  loadMesh: (meshData, filename) => set((s) => {
    console.log('[App Store] Loading mesh:', filename)
    const surface: Surface = {
      id: 'mesh-surface-1',
      name: filename.replace('.stl', '') || 'Mesh',
      metadata: {
        id: 'mesh-surface-1',
        tag: 1,
        tagName: 'mesh'
      },
      geometry: {
        vertices: meshData.vertices,
        normals: meshData.normals
      }
    }
    console.log('[App Store] Surface created, updating store')
    return {
      ...s,
      meshData,
      availableSurfaces: [surface],
      selectedSurface: null
    }
  })
}))

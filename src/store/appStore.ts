import { create } from 'zustand'
import { TreeNode } from '../utils/schemaParser'
import { Surface } from '../types/surface'
import { ConfigData, BoundaryCondition } from '../types/config'

// Mock surfaces that will later be loaded from mesh file
const mockSurfaces: Surface[] = [
  { id: 'surface-1', name: 'Inlet', metadata: { id: 'surface-1', tag: 1, tagName: 'inlet' } },
  { id: 'surface-2', name: 'Outlet', metadata: { id: 'surface-2', tag: 2, tagName: 'outlet' } },
  { id: 'surface-3', name: 'Wall', metadata: { id: 'surface-3', tag: 3, tagName: 'wall' } }
]

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
  addBoundaryCondition: (bc: BoundaryCondition) => void
  updateBoundaryCondition: (id: string, updates: Partial<BoundaryCondition>) => void
  deleteBoundaryCondition: (id: string) => void
  addState: (state: State) => void
  updateState: (id: string, updates: Partial<State>) => void
  deleteState: (id: string) => void
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
  
  availableSurfaces: mockSurfaces,
  
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
  })
}))

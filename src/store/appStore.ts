import { create } from 'zustand'
import { TreeNode } from '../utils/schemaParser'

interface AppState {
  selectedNode: TreeNode | null
  setSelectedNode: (node: TreeNode | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node })
}))

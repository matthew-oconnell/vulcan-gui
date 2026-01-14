import { FolderTree, ChevronRight, ChevronDown, FileJson } from 'lucide-react'
import { useState } from 'react'
import './TreePanel.css'

interface TreeNode {
  id: string
  label: string
  type: 'object' | 'array' | 'value'
  children?: TreeNode[]
  expanded?: boolean
}

// Sample JSON tree data
const sampleTree: TreeNode[] = [
  {
    id: 'simulation',
    label: 'simulation',
    type: 'object',
    expanded: true,
    children: [
      { id: 'solver', label: 'solver', type: 'object', children: [
        { id: 'solver.type', label: 'type', type: 'value' },
        { id: 'solver.maxIterations', label: 'maxIterations', type: 'value' },
      ]},
      { id: 'mesh', label: 'mesh', type: 'object', children: [
        { id: 'mesh.file', label: 'file', type: 'value' },
        { id: 'mesh.scale', label: 'scale', type: 'value' },
      ]},
      { id: 'boundaryConditions', label: 'boundaryConditions', type: 'array', children: [
        { id: 'bc.0', label: '[0] inlet', type: 'object' },
        { id: 'bc.1', label: '[1] outlet', type: 'object' },
        { id: 'bc.2', label: '[2] wall', type: 'object' },
      ]},
      { id: 'physics', label: 'physics', type: 'object', children: [
        { id: 'physics.turbulence', label: 'turbulence', type: 'value' },
        { id: 'physics.temperature', label: 'temperature', type: 'value' },
      ]},
    ]
  }
]

function TreePanel() {
  const [treeData, setTreeData] = useState<TreeNode[]>(sampleTree)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const toggleNode = (id: string) => {
    const toggleRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded }
        }
        if (node.children) {
          return { ...node, children: toggleRecursive(node.children) }
        }
        return node
      })
    }
    setTreeData(toggleRecursive(treeData))
  }

  const renderTree = (nodes: TreeNode[], depth: number = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="tree-node">
        <div 
          className={`tree-node-content ${selectedId === node.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedId(node.id)}
        >
          {node.children && node.children.length > 0 && (
            <span className="tree-icon" onClick={(e) => { e.stopPropagation(); toggleNode(node.id) }}>
              {node.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          {(!node.children || node.children.length === 0) && (
            <span className="tree-icon tree-icon-spacer"></span>
          )}
          <FileJson size={14} className="tree-file-icon" />
          <span className="tree-label">{node.label}</span>
        </div>
        {node.expanded && node.children && (
          <div className="tree-children">
            {renderTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="panel tree-panel">
      <div className="panel-header">
        <FolderTree size={16} />
        <span>Configuration Tree</span>
      </div>
      <div className="panel-content">
        {renderTree(treeData)}
      </div>
    </div>
  )
}

export default TreePanel

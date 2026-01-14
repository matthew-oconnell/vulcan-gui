import { FolderTree, ChevronRight, ChevronDown, File, Folder, List } from 'lucide-react'
import { useState, useEffect } from 'react'
import { TreeNode, buildTreeFromSchema } from '../../utils/schemaParser'
import { useAppStore } from '../../store/appStore'
import './TreePanel.css'

function TreePanel() {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const { selectedNode, setSelectedNode } = useAppStore()
  const selectedId = selectedNode?.id || null

  useEffect(() => {
    // Fetch and build tree from schema on mount
    fetch('/input.schema.json')
      .then(response => response.json())
      .then(inputSchema => {
        const tree = buildTreeFromSchema(inputSchema, inputSchema.required || [])
        setTreeData(tree)
      })
      .catch(error => {
        console.error('Failed to load schema:', error)
      })
  }, [])

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

  const getIcon = (node: TreeNode) => {
    if (node.type === 'object') return <Folder size={14} className="tree-file-icon" />
    if (node.type === 'array') return <List size={14} className="tree-file-icon" />
    return <File size={14} className="tree-file-icon" />
  }

  const renderTree = (nodes: TreeNode[], depth: number = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="tree-node">
        <div 
          className={`tree-node-content ${selectedId === node.id ? 'selected' : ''} ${node.required ? 'required' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedNode(node)}
          title={node.description}
        >
          {node.children && node.children.length > 0 && (
            <span className="tree-icon" onClick={(e) => { e.stopPropagation(); toggleNode(node.id) }}>
              {node.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          {(!node.children || node.children.length === 0) && (
            <span className="tree-icon tree-icon-spacer"></span>
          )}
          {getIcon(node)}
          <span className="tree-label">
            {node.label}
            {node.required && <span className="required-indicator">*</span>}
          </span>
          <span className="tree-type-badge">{node.type}</span>
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

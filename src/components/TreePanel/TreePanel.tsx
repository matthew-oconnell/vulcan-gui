import { FolderTree, ChevronRight, ChevronDown, File, Folder, List, FileCode, Settings } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { TreeNode, buildTreeFromSchema } from '../../utils/schemaParser'
import { useAppStore } from '../../store/appStore'
import { expandPathInTree, findNodeByPath } from '../../utils/treeNavigation'
import { getFeatureFlags, updateFeatureFlags } from '../../utils/featureFlags'
import './TreePanel.css'

function TreePanel() {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [showAdvanced, setShowAdvanced] = useState<boolean>(getFeatureFlags().showAdvancedFeatures)
  const { selectedNode, setSelectedNode, selectedBC, setSelectedBC, selectedState, setSelectedState, configData } = useAppStore()
  const selectedId = selectedNode?.id || null
  const schemaRef = useRef<any>(null) // Store the schema for node lookup

  useEffect(() => {
    console.log('TreePanel - Current configData:', configData)
  }, [configData])

  // Load schema and build tree
  const loadSchemaAndBuildTree = () => {
    fetch('/input.schema.json')
      .then(response => response.json())
      .then(inputSchema => {
        schemaRef.current = inputSchema // Store schema for later use
        const tree = buildTreeFromSchema(inputSchema, inputSchema.required || [])
        setTreeData(tree)
      })
      .catch(error => {
        console.error('Failed to load schema:', error)
      })
  }
  
  // Initial load on mount
  useEffect(() => {
    loadSchemaAndBuildTree()
  }, [])
  
  // Toggle advanced features
  const handleToggleAdvanced = () => {
    const newValue = !showAdvanced
    setShowAdvanced(newValue)
    updateFeatureFlags({ showAdvancedFeatures: newValue })
    
    // Rebuild tree with new settings
    loadSchemaAndBuildTree()
  }
  
  // Expose a function to navigate to a path via the window object
  useEffect(() => {
    // Add a global function to navigate to a node by path
    const navigateToPath = (path: string) => {
      if (!path || !treeData.length) return
      
      console.log('Navigating to path:', path)
      
      // Expand all nodes along the path
      const expandedTree = expandPathInTree(treeData, path)
      setTreeData(expandedTree)
      
      // Find the target node
      const targetNode = findNodeByPath(expandedTree, path)
      if (targetNode) {
        console.log('Found target node:', targetNode)
        setSelectedNode(targetNode)
        
        // Scroll to the node (add a small delay to allow rendering)
        setTimeout(() => {
          const nodeElement = document.getElementById(`tree-node-${targetNode.id}`)
          if (nodeElement) {
            nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            nodeElement.classList.add('highlight-animate')
            setTimeout(() => {
              nodeElement.classList.remove('highlight-animate')
            }, 2000)
          }
        }, 100)
      }
    }
    
    // Expose the navigation function globally
    ;(window as any).navigateToTreePath = navigateToPath
    
    return () => {
      // Clean up when component unmounts
      delete (window as any).navigateToTreePath
    }
  }, [treeData, setSelectedNode])

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
    if (node.id.includes('[BC-')) return <FileCode size={14} className="tree-file-icon" />
    if (node.id.includes('[State-')) return <FileCode size={14} className="tree-file-icon" />
    return <File size={14} className="tree-file-icon" />
  }

  // Enhance tree nodes with actual data instances
  const enhanceTreeWithData = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      // Check if this is the boundary conditions array
      if (node.id === 'root.HyperSolve.boundary conditions' && node.type === 'array') {
        const bcs = configData.HyperSolve?.['boundary conditions'] || []
        
        // Create child nodes for each BC instance
        const bcNodes: TreeNode[] = bcs.map((bc, index) => ({
          id: `${node.id}[BC-${bc.id}]`,
          label: bc.name ? `BC: ${bc.name}` : `BC (${index})`,
          type: 'object' as const,
          description: `Boundary Condition: ${bc.type || 'not set'}`,
          bcData: bc, // Attach the actual BC data
          expanded: false
        }))
        
        return {
          ...node,
          children: bcNodes.length > 0 ? bcNodes : node.children,
          expanded: bcNodes.length > 0 ? true : node.expanded
        }
      }
      
      // Check if this is the states object
      if (node.id === 'root.HyperSolve.states' && node.type === 'object') {
        const states = configData.HyperSolve?.states || {}
        const stateEntries = Object.values(states)
        
        // Create child nodes for each state instance
        const stateNodes: TreeNode[] = stateEntries.map((state) => ({
          id: `${node.id}[State-${state.id}]`,
          label: `State: ${state.name}`,
          type: 'object' as const,
          description: `Physical state: ${state.name}`,
          stateData: state, // Attach the actual state data
          expanded: false
        }))
        
        return {
          ...node,
          children: stateNodes.length > 0 ? stateNodes : node.children,
          expanded: stateNodes.length > 0 ? true : node.expanded
        }
      }
      
      // Recursively enhance children
      if (node.children) {
        return { ...node, children: enhanceTreeWithData(node.children) }
      }
      
      return node
    })
  }

  const renderTree = (nodes: TreeNode[], depth: number = 0) => {
    const enhancedNodes = enhanceTreeWithData(nodes)
    
    return enhancedNodes.map(node => {
      const isBCNode = node.id.includes('[BC-')
      const isStateNode = node.id.includes('[State-')
      const isSelected = isBCNode 
        ? selectedBC && node.id.includes(selectedBC.id)
        : isStateNode
        ? selectedState && node.id.includes(selectedState.id)
        : selectedId === node.id
      
      return (
        <div key={node.id} className="tree-node">
          <div 
            id={`tree-node-${node.id}`}
            className={`tree-node-content ${isSelected ? 'selected' : ''} ${node.required ? 'required' : ''}`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              if (isBCNode && (node as any).bcData) {
                setSelectedBC((node as any).bcData)
              } else if (isStateNode && (node as any).stateData) {
                setSelectedState((node as any).stateData)
              } else {
                setSelectedNode(node)
              }
            }}
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
            {!isBCNode && !isStateNode && <span className="tree-type-badge">{node.type}</span>}
          </div>
          {node.expanded && node.children && (
            <div className="tree-children">
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="panel tree-panel">
      <div className="panel-header">
        <FolderTree size={16} />
        <span>Configuration Tree</span>
        <div className="panel-header-actions">
          <button 
            className={`advanced-toggle ${showAdvanced ? 'active' : ''}`} 
            onClick={handleToggleAdvanced}
            title={showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
          >
            <Settings size={14} />
            <span>Advanced</span>
          </button>
        </div>
      </div>
      <div className="panel-content">
        {renderTree(treeData)}
      </div>
    </div>
  )
}

export default TreePanel

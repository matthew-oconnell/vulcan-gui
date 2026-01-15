import { Edit3, Save, RotateCcw, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { BoundaryCondition } from '../../types/config'
import StateWizard from './StateWizard'
import './EditorPanel.css'

// List of BC types from the schema
const BC_TYPES = [
  'dirichlet',
  'strongly enforced dirichlet',
  'riemann',
  'extrapolation',
  'viscous wall',
  'symmetry',
  'slip wall',
  'tangent flow',
  'constant temperature',
  'subsonic inflow total conditions',
  'supersonic outflow (vacuum)',
  'fixed subsonic inflow',
  'axisymmetric pole',
  'back pressure'
]

function EditorPanel() {
  const [showStateWizard, setShowStateWizard] = useState(false)
  
  const { 
    selectedNode, 
    selectedSurface, 
    selectedBC,
    selectedState,
    soloBC,
    setSoloBC,
    configData,
    availableSurfaces,
    addBoundaryCondition, 
    updateBoundaryCondition,
    deleteBoundaryCondition,
    setSelectedBC,
    addState,
    updateState,
    deleteState
  } = useAppStore()

  const renderBCEditor = () => {
    if (!selectedBC) return null
    
    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">Boundary Condition</h3>
          <span className="property-type-badge">BC</span>
          <button 
            className="icon-button"
            onClick={() => setSoloBC(soloBC?.id === selectedBC.id ? null : selectedBC)}
            title={soloBC?.id === selectedBC.id ? "Show all surfaces" : "Solo this BC (hide others)"}
            style={{ color: soloBC?.id === selectedBC.id ? '#4da6ff' : '#cccccc' }}
          >
            {soloBC?.id === selectedBC.id ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button 
            className="icon-button delete-button"
            onClick={() => deleteBoundaryCondition(selectedBC.id)}
            title="Delete BC"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        <p className="property-description">
          Configure boundary condition type and mesh tags
        </p>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">BC Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={selectedBC.name || ''}
              onChange={(e) => updateBoundaryCondition(selectedBC.id, { name: e.target.value })}
              placeholder="Enter a name for this BC..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">BC Type</label>
            <select 
              className="form-input" 
              value={selectedBC.type || ''}
              onChange={(e) => updateBoundaryCondition(selectedBC.id, { type: e.target.value })}
            >
              <option value="">Select BC type...</option>
              {BC_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mesh Boundary Tags</label>
            <input 
              type="text" 
              className="form-input" 
              value={
                Array.isArray(selectedBC['mesh boundary tags'])
                  ? (selectedBC['mesh boundary tags'] as any[]).join(', ')
                  : String(selectedBC['mesh boundary tags'] || '')
              }
              onChange={(e) => {
                const val = e.target.value
                // Try to parse as comma-separated numbers
                if (val.includes(',')) {
                  const tags = val.split(',').map(s => s.trim()).filter(s => s).map(Number).filter(n => !isNaN(n))
                  updateBoundaryCondition(selectedBC.id, { 'mesh boundary tags': tags })
                } else if (val && !isNaN(Number(val))) {
                  updateBoundaryCondition(selectedBC.id, { 'mesh boundary tags': Number(val) })
                } else {
                  updateBoundaryCondition(selectedBC.id, { 'mesh boundary tags': val })
                }
              }}
              placeholder="Enter tag(s): 1 or 1,2,3 or 1:10"
            />
            <span className="default-hint">
              Can be a single number, comma-separated list, or range string (e.g., "1:10")
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Add Surface by Name</label>
            <select 
              className="form-input"
              onChange={(e) => {
                if (e.target.value) {
                  const tag = parseInt(e.target.value, 10)
                  const currentTags = selectedBC['mesh boundary tags']
                  let newTags: number[] = []
                  
                  // Convert current tags to array
                  if (Array.isArray(currentTags)) {
                    newTags = currentTags.map(t => typeof t === 'number' ? t : parseInt(t as string, 10))
                  } else if (typeof currentTags === 'number') {
                    newTags = [currentTags]
                  } else if (typeof currentTags === 'string') {
                    newTags = currentTags.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
                  }
                  
                  // Add tag if not already present
                  if (!newTags.includes(tag)) {
                    newTags.push(tag)
                    updateBoundaryCondition(selectedBC.id, { 'mesh boundary tags': newTags })
                  }
                  
                  e.target.value = '' // Reset selection
                }
              }}
              defaultValue=""
            >
              <option value="">Select surface to add...</option>
              {availableSurfaces.map((surf) => (
                <option key={surf.id} value={surf.metadata.tag}>
                  {surf.metadata.tagName} (tag {surf.metadata.tag})
                </option>
              ))}
            </select>
          </div>

          {(selectedBC.type === 'dirichlet' || 
            selectedBC.type === 'strongly enforced dirichlet' ||
            selectedBC.type === 'subsonic inflow total conditions') && (
            <div className="form-group">
              <label className="form-label">State Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={selectedBC.state || ''}
                onChange={(e) => updateBoundaryCondition(selectedBC.id, { state: e.target.value })}
                placeholder="Enter state name..."
              />
              <span className="default-hint">Reference to a defined state</span>
            </div>
          )}

          <div className="info-box">
            <strong>Current tags:</strong>{' '}
            {selectedBC['mesh boundary tags'] 
              ? JSON.stringify(selectedBC['mesh boundary tags'])
              : 'None'}
          </div>
        </div>
      </div>
    )
  }

  const renderBCArrayEditor = () => {
    const bcs = configData.HyperSolve?.['boundary conditions'] || []
    
    const handleAddBC = () => {
      const newBC: BoundaryCondition = {
        id: `bc-${Date.now()}`,
        type: '',
        'mesh boundary tags': []
      }
      addBoundaryCondition(newBC)
    }
    
    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">Boundary Conditions</h3>
          <span className="property-type-badge">array</span>
        </div>
        
        <p className="property-description">
          Spatial boundary conditions for the domain. Click to add a new boundary condition.
        </p>

        <div className="form-section">
          <button className="add-button" onClick={handleAddBC}>
            <Plus size={16} /> Add Boundary Condition
          </button>
          
          <div className="info-box">
            {bcs.length === 0 ? (
              'No boundary conditions defined. Click above to add one.'
            ) : (
              `${bcs.length} boundary condition(s) defined. Select one from the tree to edit.`
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStateEditor = () => {
    if (!selectedState) return null
    
    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">State</h3>
          <span className="property-type-badge">State</span>
          <button 
            className="icon-button delete-button"
            onClick={() => deleteState(selectedState.id)}
            title="Delete State"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        <p className="property-description">
          Configure physical state properties (all units must be MKS)
        </p>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">State Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={selectedState.name || ''}
              onChange={(e) => updateState(selectedState.id, { name: e.target.value })}
              placeholder="Enter state name..."
            />
            <span className="default-hint">Used to reference this state in BCs</span>
          </div>

          <div className="form-group">
            <label className="form-label">Mach Number</label>
            <input 
              type="number" 
              className="form-input" 
              value={selectedState['mach number'] || ''}
              onChange={(e) => updateState(selectedState.id, { 'mach number': parseFloat(e.target.value) })}
              placeholder="Enter mach number..."
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Temperature (K)</label>
            <input 
              type="number" 
              className="form-input" 
              value={selectedState.temperature || ''}
              onChange={(e) => updateState(selectedState.id, { temperature: parseFloat(e.target.value) })}
              placeholder="Enter temperature..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pressure (Pa)</label>
            <input 
              type="number" 
              className="form-input" 
              value={selectedState.pressure || ''}
              onChange={(e) => updateState(selectedState.id, { pressure: parseFloat(e.target.value) })}
              placeholder="Enter pressure..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Angle of Attack (deg)</label>
            <input 
              type="number" 
              className="form-input" 
              value={selectedState['angle of attack'] || 0}
              onChange={(e) => updateState(selectedState.id, { 'angle of attack': parseFloat(e.target.value) })}
              placeholder="0.0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Angle of Yaw (deg)</label>
            <input 
              type="number" 
              className="form-input" 
              value={selectedState['angle of yaw'] || 0}
              onChange={(e) => updateState(selectedState.id, { 'angle of yaw': parseFloat(e.target.value) })}
              placeholder="0.0"
              step="0.1"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderStatesObjectEditor = () => {
    const states = Object.values(configData.HyperSolve?.states || {})
    
    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">States</h3>
          <span className="property-type-badge">object</span>
        </div>
        
        <p className="property-description">
          Physical states to be used for boundary/initial conditions
        </p>

        <div className="form-section">
          <button className="add-button" onClick={() => setShowStateWizard(true)}>
            <Plus size={16} /> Add State
          </button>
          
          <div className="info-box">
            {states.length === 0 ? (
              'No states defined. Click above to add one.'
            ) : (
              `${states.length} state(s) defined. Select one from the tree to edit.`
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSurfaceEditor = () => {
    if (!selectedSurface) return null
    
    const bcs = configData.HyperSolve?.['boundary conditions'] || []
    const surfaceTag = selectedSurface.metadata.tag
    
    const handleAssignToBC = (bcId: string) => {
      const bc = bcs.find(b => b.id === bcId)
      if (!bc) return
      
      const currentTags = bc['mesh boundary tags']
      let newTags: number[] = []
      
      // Convert current tags to array
      if (Array.isArray(currentTags)) {
        newTags = currentTags.map(t => typeof t === 'number' ? t : parseInt(t as string, 10))
      } else if (typeof currentTags === 'number') {
        newTags = [currentTags]
      } else if (typeof currentTags === 'string') {
        // Try to parse comma-separated or range
        newTags = currentTags.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      }
      
      // Add surface tag if not already present
      if (!newTags.includes(surfaceTag)) {
        newTags.push(surfaceTag)
        updateBoundaryCondition(bcId, { 'mesh boundary tags': newTags })
      }
    }
    const handleRemoveFromBC = (bcId: string) => {
      const bc = bcs.find(b => b.id === bcId)
      if (!bc) return
      
      const currentTags = bc['mesh boundary tags']
      let newTags: number[] = []
      
      // Convert current tags to array
      if (Array.isArray(currentTags)) {
        newTags = currentTags.map(t => typeof t === 'number' ? t : parseInt(t as string, 10))
      } else if (typeof currentTags === 'number') {
        newTags = [currentTags]
      } else if (typeof currentTags === 'string') {
        newTags = currentTags.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      }
      
      // Remove surface tag
      newTags = newTags.filter(t => t !== surfaceTag)
      
      // Update BC with new tags
      updateBoundaryCondition(bcId, { 
        'mesh boundary tags': newTags.length === 0 ? [] : newTags 
      })
    }
    
    // Check which BCs contain this surface tag
    const assignedBCs = bcs.filter(bc => {
      const tags = bc['mesh boundary tags']
      if (Array.isArray(tags)) {
        return (tags as any[]).includes(surfaceTag) || (tags as any[]).includes(String(surfaceTag))
      } else if (typeof tags === 'number') {
        return tags === surfaceTag
      } else if (typeof tags === 'string') {
        return tags.split(',').map(s => parseInt(s.trim(), 10)).includes(surfaceTag)
      }
      return false
    })
    
    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">{selectedSurface.name}</h3>
          <span className="property-type-badge">Surface</span>
        </div>
        
        <p className="property-description">
          Configure boundary condition metadata for this surface region
        </p>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Tag (ID)</label>
            <input 
              type="number" 
              className="form-input" 
              defaultValue={selectedSurface.metadata.tag}
              placeholder="Enter tag number..."
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tag Name</label>
            <input 
              type="text" 
              className="form-input" 
              defaultValue={selectedSurface.metadata.tagName}
              placeholder="Enter tag name..."
              readOnly
            />
          </div>

          {bcs.length > 0 && (
            <div className="form-group">
              <label className="form-label">Assign to Boundary Condition</label>
              <select 
                className="form-input"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssignToBC(e.target.value)
                    e.target.value = '' // Reset selection
                  }
                }}
                defaultValue=""
              >
                <option value="">Select BC to add surface...</option>
                {bcs.map((bc, idx) => (
                  <option key={bc.id} value={bc.id}>
                    {bc.type || 'Unnamed BC'} ({idx})
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignedBCs.length > 0 && (
            <div className="info-box">
              <strong>Assigned to:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', listStyle: 'none' }}>
                {assignedBCs.map((bc) => (
                  <li 
                    key={bc.id}
                    style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span
                      style={{ cursor: 'pointer', color: '#4da6ff', flex: 1 }}
                      onClick={() => setSelectedBC(bc)}
                      title="Click to edit this BC"
                    >
                      {bc.name || bc.type || 'Unnamed BC'}
                    </span>
                    <button
                      className="icon-button"
                      style={{ fontSize: '11px', padding: '2px 6px', color: '#f48771' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFromBC(bc.id)
                      }}
                      title="Remove surface from this BC"
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bcs.length === 0 && (
            <div className="info-box">
              There are no BCs defined.{' '}
              <span 
                style={{ color: '#4da6ff', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  const newBC: BoundaryCondition = {
                    id: `bc-${Date.now()}`,
                    name: selectedSurface.metadata.tagName || selectedSurface.name || '',
                    type: '',
                    'mesh boundary tags': [selectedSurface.metadata.tag]
                  }
                  addBoundaryCondition(newBC)
                }}
              >
                Create a new one
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderEditor = () => {
    // Priority: State > BC > Surface > Node
    if (selectedState) {
      return renderStateEditor()
    }
    if (selectedBC) {
      return renderBCEditor()
    }
    if (selectedSurface) {
      return renderSurfaceEditor()
    }
    if (selectedNode) {
      // Check if this is the boundary conditions array node
      if (selectedNode.id === 'root.HyperSolve.boundary conditions') {
        return renderBCArrayEditor()
      }
      // Check if this is the states object node
      if (selectedNode.id === 'root.HyperSolve.states') {
        return renderStatesObjectEditor()
      }
      return renderNodeEditor()
    }
    return (
      <div className="editor-placeholder">
        <p className="placeholder-text">Select an item from the tree or a surface to edit</p>
      </div>
    )
  }

  const renderNodeEditor = () => {
    if (!selectedNode) return null

    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">{selectedNode.label}</h3>
          <span className="property-type-badge">{selectedNode.type}</span>
        </div>
        
        {selectedNode.description && (
          <p className="property-description">{selectedNode.description}</p>
        )}

        <div className="form-section">
          {selectedNode.required && (
            <div className="required-badge">Required Field</div>
          )}

          {selectedNode.enum && selectedNode.enum.length > 0 ? (
            <div className="form-group">
              <label className="form-label">Value</label>
              <select 
                className="form-input" 
                defaultValue={selectedNode.default as string || selectedNode.enum[0]}
              >
                {selectedNode.enum.map((value, index) => (
                  <option key={index} value={String(value)}>
                    {String(value)}
                  </option>
                ))}
              </select>
              {selectedNode.default !== undefined && (
                <span className="default-hint">Default: {String(selectedNode.default)}</span>
              )}
            </div>
          ) : selectedNode.type === 'string' && (
            <div className="form-group">
              <label className="form-label">Value</label>
              <input 
                type="text" 
                className="form-input" 
                defaultValue={selectedNode.default as string || ''}
                placeholder={selectedNode.default ? String(selectedNode.default) : 'Enter value...'}
              />
            </div>
          )}

          {selectedNode.type === 'number' && (
            <div className="form-group">
              <label className="form-label">Value</label>
              <input 
                type="number" 
                className="form-input" 
                defaultValue={selectedNode.default as number}
                placeholder={selectedNode.default !== undefined ? String(selectedNode.default) : 'Enter number...'}
              />
            </div>
          )}

          {selectedNode.type === 'boolean' && (
            <div className="form-group">
              <label className="form-label">Value</label>
              <div className="checkbox-group">
                <label>
                  <input 
                    type="radio" 
                    name={`bool-${selectedNode.id}`} 
                    value="true"
                    defaultChecked={selectedNode.default === true}
                  /> True
                </label>
                <label>
                  <input 
                    type="radio" 
                    name={`bool-${selectedNode.id}`} 
                    value="false"
                    defaultChecked={selectedNode.default === false}
                  /> False
                </label>
              </div>
              {selectedNode.default !== undefined && (
                <span className="default-hint">Default: {String(selectedNode.default)}</span>
              )}
            </div>
          )}

          {selectedNode.type === 'array' && (
            <div className="form-group">
              <label className="form-label">Array Items</label>
              <button className="add-button">+ Add Item</button>
              {selectedNode.default !== undefined && (
                <div className="default-hint">Default: {JSON.stringify(selectedNode.default)}</div>
              )}
            </div>
          )}

          {selectedNode.type === 'object' && (
            <div className="info-box">
              This is an object with nested properties. Expand it in the tree to edit its children.
            </div>
          )}

          {selectedNode.schemaType && (
            <div className="info-box">
              <strong>Schema Reference:</strong> {selectedNode.schemaType}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <Edit3 size={16} />
        <span>Property Editor</span>
        <div className="panel-actions">
          <button className="icon-button" title="Reset to defaults">
            <RotateCcw size={14} />
          </button>
          <button className="icon-button" title="Save changes">
            <Save size={14} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        {renderEditor()}
      </div>
      
      {showStateWizard && (
        <StateWizard
          onClose={() => setShowStateWizard(false)}
          onCreate={(state) => addState(state)}
        />
      )}
    </div>
  )
}

export default EditorPanel

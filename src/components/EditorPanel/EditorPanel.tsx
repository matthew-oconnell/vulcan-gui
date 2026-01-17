import { Edit3, Save, RotateCcw, Plus, Trash2, Eye, EyeOff, Maximize2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { BoundaryCondition } from '../../types/config'
import StateWizard from './StateWizard'
import BoundaryConditionDialog from '../BoundaryConditionDialog/BoundaryConditionDialog'
import PropertyEditorDialog from '../PropertyEditorDialog/PropertyEditorDialog'
import VisualizationDialog from '../VisualizationDialog/VisualizationDialog'
import { loadBCTypeInfo, isBCTypeAvailable } from '../../utils/bcTypeDescriptions'
import { calculateAreaWeightedNormal } from '../../utils/surfaceUtils'
import './EditorPanel.css'

interface SchemaProperty {
  type?: string | string[]
  description?: string
  default?: any
  properties?: Record<string, SchemaProperty>
  items?: SchemaProperty
  $ref?: string
  oneOf?: SchemaProperty[]
  anyOf?: SchemaProperty[]
  allOf?: SchemaProperty[]
  enum?: any[]
  required?: string[]
}

interface Schema {
  properties?: Record<string, SchemaProperty>
  definitions?: Record<string, SchemaProperty>
  required?: string[]
}

// List of BC types from the schema
const BC_TYPES = [
  'dirichlet',
  'dirichlet profile',
  'strong dirichlet',
  'riemann',
  'extrapolation',
  'slip wall',
  'tangent flow',
  'constant temperature',
  'weak constant temperature',
  'weak radiative equilibrium temperature',
  'symmetry',
  'weak symmetry',
  'no slip',
  'wall matching',
  'weak no slip',
  'axisymmetric pole',
  'back pressure',
  'mms',
  'strong mms',
  'strong-weak hns mms',
  'maxwell mms',
  'gol mms',
  'mass flux inflow',
  'subsonic inflow total',
  'supersonic outflow',
  'fixed subsonic inflow',
  'engine inlet',
  'strong particle wall',
  'particle wall',
  'marshak',
  'strong marshak',
  'weak constant intensity',
  'constant intensity',
  'perfect conductor',
  'insulated wall',
  'freestream em',
  'outflow em'
]

function EditorPanel() {
  const [showStateWizard, setShowStateWizard] = useState(false)
  const [showBCDialog, setShowBCDialog] = useState(false)
  const [showPropertyDialog, setShowPropertyDialog] = useState(false)
  const [showVizDialog, setShowVizDialog] = useState(false)
  const [normalPreset, setNormalPreset] = useState<string>('custom')
  const [selectedSurfaceForNormal, setSelectedSurfaceForNormal] = useState<string>('')
  const [schema, setSchema] = useState<Schema | null>(null)
  const [availableBCTypes, setAvailableBCTypes] = useState<string[]>(BC_TYPES)
  
  useEffect(() => {
    // Load the schema
    fetch('/input.schema.json')
      .then(response => response.json())
      .then(loadedSchema => setSchema(loadedSchema))
      .catch(error => console.error('Failed to load schema:', error))
    
    // Load and filter BC types
    loadBCTypeInfo().then(() => {
      const filtered = BC_TYPES.filter(type => isBCTypeAvailable(type))
      setAvailableBCTypes(filtered)
    })
  }, [])
  
  const { 
    selectedNode, 
    selectedSurface, 
    selectedBC,
    selectedState,
    selectedViz,
    setSelectedViz,
    soloBC,
    setSoloBC,
    configData,
    setConfigData,
    availableSurfaces,
    addBoundaryCondition, 
    updateBoundaryCondition,
    deleteBoundaryCondition,
    setSelectedBC,
    addState,
    updateState,
    deleteState
  } = useAppStore()

  // Helper function to get value from configData based on node path
  const getValueFromPath = (path: string) => {
    const parts = path.replace('root.', '').split('.')
    let value: any = configData
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part]
      } else {
        return undefined
      }
    }
    return value
  }

  // Helper function to get schema properties for a node path
  const getSchemaForPath = (path: string): SchemaProperty | null => {
    if (!schema) return null
    
    // Handle special Global node
    if (path === 'root.global') {
      return { type: 'object', properties: schema.properties }
    }
    
    const parts = path.replace('root.', '').split('.')
    let current: SchemaProperty | undefined = { properties: schema.properties }
    
    for (const part of parts) {
      if (!current?.properties) return null
      current = current.properties[part]
      if (!current) return null
      
      // Resolve $ref if present
      if (current.$ref && schema.definitions) {
        const defName: string = current.$ref.replace('#/definitions/', '')
        current = schema.definitions[defName]
      }
      
      // Handle allOf - merge all schemas together
      if (current?.allOf) {
        const merged: SchemaProperty = { type: 'object', properties: {} }
        
        for (const subSchema of current.allOf) {
          let resolvedSchema = subSchema
          
          // Resolve $ref if present in allOf item
          if (subSchema.$ref && schema.definitions) {
            const defName = subSchema.$ref.replace('#/definitions/', '')
            resolvedSchema = schema.definitions[defName] || subSchema
          }
          
          // Merge properties
          if (resolvedSchema.properties) {
            merged.properties = { ...merged.properties, ...resolvedSchema.properties }
          }
          
          // Merge required arrays
          if (resolvedSchema.required) {
            merged.required = [...(merged.required || []), ...resolvedSchema.required]
          }
          
          // Copy other properties from first schema
          if (!merged.description && resolvedSchema.description) merged.description = resolvedSchema.description
          if (!merged.default && resolvedSchema.default) merged.default = resolvedSchema.default
        }
        
        current = merged
      }
    }
    
    return current || null
  }

  // Helper function to check if a type is POD
  const isPODType = (type: string | string[] | undefined): boolean => {
    if (!type) return false
    const typeStr = Array.isArray(type) ? type[0] : type
    return typeStr === 'string' || typeStr === 'number' || typeStr === 'integer' || typeStr === 'boolean'
  }
  
  // Helper function to check if a property (including oneOf/anyOf) is POD
  const isPropertyPOD = (prop: SchemaProperty): boolean => {
    // Direct type check
    if (prop.type) {
      if (isPODType(prop.type)) {
        return true
      }
      // Check for array of primitives
      if (prop.type === 'array' && prop.items) {
        const itemType = prop.items.type
        if (isPODType(itemType)) {
          return true
        }
      }
      return false
    }
    
    // Check oneOf/anyOf - consider it POD if all options are POD
    if (prop.oneOf || prop.anyOf) {
      const options = prop.oneOf || prop.anyOf
      if (options && options.length > 0) {
        return options.every(option => {
          const optionType = option.type
          if (!optionType) return false
          return isPODType(optionType)
        })
      }
    }
    
    return false
  }

  // Get POD properties from a schema object
  const getPODProperties = (objSchema: SchemaProperty | null): Array<{key: string, prop: SchemaProperty, required: boolean}> => {
    if (!objSchema?.properties) return []
    
    const podProps: Array<{key: string, prop: SchemaProperty, required: boolean}> = []
    const requiredFields = objSchema.required || []
    
    for (const [key, prop] of Object.entries(objSchema.properties)) {
      if (isPropertyPOD(prop)) {
        podProps.push({
          key,
          prop,
          required: requiredFields.includes(key)
        })
      }
    }
    
    return podProps
  }

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
              {availableBCTypes.map((type) => (
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
            selectedBC.type === 'strong dirichlet' ||
            selectedBC.type === 'riemann' ||
            selectedBC.type === 'mass flux inflow') && (
            <div className="form-group">
              <label className="form-label">State Name</label>
              <select 
                className="form-input" 
                value={selectedBC.state || ''}
                onChange={(e) => {
                  if (e.target.value === '__CREATE_NEW__') {
                    setShowStateWizard(true)
                  } else {
                    updateBoundaryCondition(selectedBC.id, { state: e.target.value })
                  }
                }}
              >
                <option value="">Select state...</option>
                <option value="__CREATE_NEW__">Create New State...</option>
                {Object.keys(configData.HyperSolve?.states || {}).map((stateName) => (
                  <option key={stateName} value={stateName}>{stateName}</option>
                ))}
              </select>
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
      setShowBCDialog(true)
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

  const renderVisualizationArrayEditor = () => {
    const visualizations = configData.visualization || []
    
    const handleAddVisualization = () => {
      setShowVizDialog(true)
    }
    
    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">Visualization</h3>
          <span className="property-type-badge">array</span>
        </div>
        
        <p className="property-description">
          Configure visualization outputs for sampling the flow field solution at various locations and surfaces.
        </p>

        <div className="form-section">
          <button className="add-button" onClick={handleAddVisualization}>
            <Plus size={16} /> Add Visualization
          </button>
          
          <div className="info-box">
            {visualizations.length === 0 ? (
              'No visualizations defined. Click above to add one.'
            ) : (
              `${visualizations.length} visualization(s) defined. Select one from the tree to edit.`
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderVisualizationEditor = () => {
    if (!selectedViz) return null
    
    const viz = selectedViz.data
    const vizIndex = selectedViz.index
    
    const handleUpdate = (updates: any) => {
      const updatedConfig = { ...configData }
      if (!updatedConfig.visualization) return
      
      updatedConfig.visualization[vizIndex] = {
        ...updatedConfig.visualization[vizIndex],
        ...updates
      }
      setConfigData(updatedConfig)
      
      // Update the selected viz reference
      setSelectedViz({ data: updatedConfig.visualization[vizIndex], index: vizIndex })
    }
    
    const handleDelete = () => {
      const updatedConfig = { ...configData }
      if (!updatedConfig.visualization) return
      
      updatedConfig.visualization.splice(vizIndex, 1)
      setConfigData(updatedConfig)
      setSelectedViz(null)
    }
    
    return (
      <div className="editor-content">
        <div className="property-header">
          <h3 className="property-title">Visualization</h3>
          <span className="property-type-badge">{viz.type}</span>
          <button 
            className="icon-button delete-button"
            onClick={handleDelete}
            title="Delete Visualization"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        <p className="property-description">
          {viz.type} visualization output
        </p>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Filename *</label>
            <input 
              type="text" 
              className="form-input" 
              value={viz.filename || ''}
              onChange={(e) => handleUpdate({ filename: e.target.value })}
              placeholder="output.vtk"
            />
          </div>

          {viz.type === 'point' && viz.location && (
            <div className="form-group">
              <label className="form-label">Location [x, y, z]</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={viz.location[0] || 0}
                  onChange={(e) => handleUpdate({ location: [Number(e.target.value), viz.location[1], viz.location[2]] })}
                  placeholder="x"
                />
                <input 
                  type="number" 
                  className="form-input" 
                  value={viz.location[1] || 0}
                  onChange={(e) => handleUpdate({ location: [viz.location[0], Number(e.target.value), viz.location[2]] })}
                  placeholder="y"
                />
                <input 
                  type="number" 
                  className="form-input" 
                  value={viz.location[2] || 0}
                  onChange={(e) => handleUpdate({ location: [viz.location[0], viz.location[1], Number(e.target.value)] })}
                  placeholder="z"
                />
              </div>
            </div>
          )}

          {viz.type === 'line' && (
            <>
              <div className="form-group">
                <label className="form-label">Start Point (a) [x, y, z]</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input type="number" className="form-input" value={viz.a?.[0] || 0} onChange={(e) => handleUpdate({ a: [Number(e.target.value), viz.a[1], viz.a[2]] })} placeholder="x" />
                  <input type="number" className="form-input" value={viz.a?.[1] || 0} onChange={(e) => handleUpdate({ a: [viz.a[0], Number(e.target.value), viz.a[2]] })} placeholder="y" />
                  <input type="number" className="form-input" value={viz.a?.[2] || 0} onChange={(e) => handleUpdate({ a: [viz.a[0], viz.a[1], Number(e.target.value)] })} placeholder="z" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">End Point (b) [x, y, z]</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input type="number" className="form-input" value={viz.b?.[0] || 0} onChange={(e) => handleUpdate({ b: [Number(e.target.value), viz.b[1], viz.b[2]] })} placeholder="x" />
                  <input type="number" className="form-input" value={viz.b?.[1] || 0} onChange={(e) => handleUpdate({ b: [viz.b[0], Number(e.target.value), viz.b[2]] })} placeholder="y" />
                  <input type="number" className="form-input" value={viz.b?.[2] || 0} onChange={(e) => handleUpdate({ b: [viz.b[0], viz.b[1], Number(e.target.value)] })} placeholder="z" />
                </div>
              </div>
            </>
          )}

          {viz.type === 'plane' && (
            <>
              <div className="form-group">
                <label className="form-label">Normal:</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                  <button
                    className={`add-button ${normalPreset === 'x-normal' ? '' : ''}`}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '11px', 
                      backgroundColor: normalPreset === 'x-normal' ? '#4a9eff' : '#3a3a3a',
                      color: '#fff',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      minWidth: '28px',
                      maxWidth: '32px'
                    }}
                    onClick={() => {
                      setNormalPreset('x-normal')
                      handleUpdate({ normal: [1, 0, 0] })
                    }}
                    title="X Normal (1, 0, 0)"
                  >
                    X
                  </button>
                  <button
                    className={`add-button ${normalPreset === 'y-normal' ? '' : ''}`}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '11px', 
                      backgroundColor: normalPreset === 'y-normal' ? '#4a9eff' : '#3a3a3a',
                      color: '#fff',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      minWidth: '28px',
                      maxWidth: '32px'
                    }}
                    onClick={() => {
                      setNormalPreset('y-normal')
                      handleUpdate({ normal: [0, 1, 0] })
                    }}
                    title="Y Normal (0, 1, 0)"
                  >
                    Y
                  </button>
                  <button
                    className={`add-button ${normalPreset === 'z-normal' ? '' : ''}`}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '11px', 
                      backgroundColor: normalPreset === 'z-normal' ? '#4a9eff' : '#3a3a3a',
                      color: '#fff',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      minWidth: '28px',
                      maxWidth: '32px'
                    }}
                    onClick={() => {
                      setNormalPreset('z-normal')
                      handleUpdate({ normal: [0, 0, 1] })
                    }}
                    title="Z Normal (0, 0, 1)"
                  >
                    Z
                  </button>
                  <select
                    className="form-input"
                    style={{ flex: '1 1 auto', minWidth: 0 }}
                    value={selectedSurfaceForNormal}
                    onChange={(e) => {
                      const surfaceId = e.target.value
                      setSelectedSurfaceForNormal(surfaceId)
                      
                      if (surfaceId) {
                        setNormalPreset('surface-normal')
                        const surface = availableSurfaces.find(s => s.id === surfaceId)
                        if (surface) {
                          const normal = calculateAreaWeightedNormal(surface)
                          handleUpdate({ normal })
                        }
                      } else {
                        setNormalPreset('custom')
                      }
                    }}
                  >
                    <option value="">Normal from surface...</option>
                    {availableSurfaces.map(surface => (
                      <option key={surface.id} value={surface.id}>
                        {surface.name || surface.metadata?.tagName || `Tag ${surface.metadata?.tag}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">[x, y, z]:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '4px' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    value={viz.normal?.[0] || 0} 
                    onChange={(e) => {
                      setNormalPreset('custom')
                      setSelectedSurfaceForNormal('')
                      handleUpdate({ normal: [Number(e.target.value), viz.normal[1], viz.normal[2]] })
                    }} 
                    placeholder="x" 
                  />
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    value={viz.normal?.[1] || 0} 
                    onChange={(e) => {
                      setNormalPreset('custom')
                      setSelectedSurfaceForNormal('')
                      handleUpdate({ normal: [viz.normal[0], Number(e.target.value), viz.normal[2]] })
                    }} 
                    placeholder="y" 
                  />
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    value={viz.normal?.[2] || 0} 
                    onChange={(e) => {
                      setNormalPreset('custom')
                      setSelectedSurfaceForNormal('')
                      handleUpdate({ normal: [viz.normal[0], viz.normal[1], Number(e.target.value)] })
                    }} 
                    placeholder="z" 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Center:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '4px' }}>
                  <input type="number" className="form-input" value={viz.center?.[0] || 0} onChange={(e) => handleUpdate({ center: [Number(e.target.value), viz.center?.[1] || 0, viz.center?.[2] || 0] })} placeholder="x" />
                  <input type="number" className="form-input" value={viz.center?.[1] || 0} onChange={(e) => handleUpdate({ center: [viz.center?.[0] || 0, Number(e.target.value), viz.center?.[2] || 0] })} placeholder="y" />
                  <input type="number" className="form-input" value={viz.center?.[2] || 0} onChange={(e) => handleUpdate({ center: [viz.center?.[0] || 0, viz.center?.[1] || 0, Number(e.target.value)] })} placeholder="z" />
                </div>
              </div>
            </>
          )}

          {viz.type === 'sphere' && (
            <>
              <div className="form-group">
                <label className="form-label">Radius</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={viz.radius || 0}
                  onChange={(e) => handleUpdate({ radius: Number(e.target.value) })}
                  min="0"
                  step="0.1"
                />
              </div>
              {viz.center && (
                <div className="form-group">
                  <label className="form-label">Center [x, y, z]</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <input type="number" className="form-input" value={viz.center[0] || 0} onChange={(e) => handleUpdate({ center: [Number(e.target.value), viz.center[1], viz.center[2]] })} placeholder="x" />
                    <input type="number" className="form-input" value={viz.center[1] || 0} onChange={(e) => handleUpdate({ center: [viz.center[0], Number(e.target.value), viz.center[2]] })} placeholder="y" />
                    <input type="number" className="form-input" value={viz.center[2] || 0} onChange={(e) => handleUpdate({ center: [viz.center[0], viz.center[1], Number(e.target.value)] })} placeholder="z" />
                  </div>
                </div>
              )}
            </>
          )}

          {viz['iteration frequency'] !== undefined && (
            <div className="form-group">
              <label className="form-label">Iteration Frequency</label>
              <input 
                type="number" 
                className="form-input" 
                value={viz['iteration frequency'] || -1}
                onChange={(e) => handleUpdate({ 'iteration frequency': Number(e.target.value) })}
                placeholder="-1"
              />
              <span className="default-hint">-1 means use checkpoint frequency</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderEditor = () => {
    // Priority: Viz > State > BC > Node
    if (selectedViz) {
      return renderVisualizationEditor()
    }
    if (selectedState) {
      return renderStateEditor()
    }
    if (selectedBC) {
      return renderBCEditor()
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
      // Check if this is the visualization array node
      if (selectedNode.id === 'root.visualization') {
        return renderVisualizationArrayEditor()
      }
      return renderNodeEditor()
    }
    return (
      <div className="editor-placeholder">
        <p className="placeholder-text">Select an item from the configuration tree to edit</p>
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
          {selectedNode.type === 'object' && (
            <button 
              className="icon-button"
              onClick={() => setShowPropertyDialog(true)}
              title="Open in larger window"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>
        
        {selectedNode.description && (
          <p className="property-description">{selectedNode.description}</p>
        )}

        <div className="form-section">
          {selectedNode.required && (
            <div className="required-badge">Required Field</div>
          )}

          {selectedNode.type === 'object' && (() => {
            const objSchema = getSchemaForPath(selectedNode.id)
            const podProps = getPODProperties(objSchema)
            const objValue = getValueFromPath(selectedNode.id) || {}
            
            if (podProps.length === 0) {
              return (
                <div className="info-box">
                  This object has no primitive properties. Expand it in the tree to edit nested objects.
                </div>
              )
            }
            
            return podProps.map(({ key, prop, required }) => {
              const value = objValue[key]
              const displayValue = value !== undefined ? value : prop.default
              const propType = Array.isArray(prop.type) ? prop.type[0] : prop.type
              
              return (
                <div key={key} className="form-group">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div style={{ flex: '0 0 auto', minWidth: 0 }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        {key}
                        {required && <span style={{ color: '#ff6b6b' }}> *</span>}
                      </label>
                      {prop.description && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#888', 
                          marginTop: '2px',
                          maxWidth: '300px'
                        }}>
                          {prop.description}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: '0 0 auto', minWidth: '200px', maxWidth: '300px' }}>
                      {propType === 'boolean' ? (
                        <label style={{ 
                          position: 'relative',
                          display: 'inline-block',
                          width: '50px',
                          height: '24px',
                          cursor: 'pointer'
                        }}>
                          <input 
                            type="checkbox"
                            defaultChecked={displayValue === true}
                            style={{ 
                              position: 'absolute',
                              opacity: 0,
                              width: '100%',
                              height: '100%',
                              cursor: 'pointer',
                              zIndex: 1
                            }}
                            onChange={(e) => {
                              const toggle = e.target.nextElementSibling as HTMLElement
                              const knob = toggle?.firstChild as HTMLElement
                              if (toggle && knob) {
                                if (e.target.checked) {
                                  toggle.style.backgroundColor = '#4da6ff'
                                  knob.style.left = '28px'
                                } else {
                                  toggle.style.backgroundColor = '#444'
                                  knob.style.left = '4px'
                                }
                              }
                            }}
                          />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: displayValue ? '#4da6ff' : '#444',
                            borderRadius: '24px',
                            transition: 'background-color 0.2s',
                            pointerEvents: 'none'
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '""',
                              height: '18px',
                              width: '18px',
                              left: displayValue ? '28px' : '4px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              transition: 'left 0.2s'
                            }} />
                          </span>
                        </label>
                      ) : prop.enum ? (
                        <select 
                          className="form-input"
                          defaultValue={displayValue}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Select --</option>
                          {prop.enum.map((enumValue: any) => (
                            <option key={enumValue} value={enumValue}>
                              {enumValue}
                            </option>
                          ))}
                        </select>
                      ) : propType === 'array' ? (
                        <textarea 
                          className="form-input"
                          rows={2}
                          defaultValue={Array.isArray(displayValue) ? JSON.stringify(displayValue) : '[]'}
                          placeholder="[...]"
                          style={{ width: '100%', fontSize: '12px' }}
                        />
                      ) : (
                        <input 
                          type={propType === 'integer' || propType === 'number' ? 'number' : 'text'}
                          className="form-input"
                          defaultValue={displayValue !== undefined ? displayValue : ''}
                          placeholder={prop.default !== undefined ? String(prop.default) : ''}
                          style={{ width: '100%' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          })()}
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
      
      {showBCDialog && (
        <BoundaryConditionDialog
          isOpen={showBCDialog}
          onClose={() => setShowBCDialog(false)}
        />
      )}
      
      {showPropertyDialog && selectedNode && (
        <PropertyEditorDialog
          isOpen={showPropertyDialog}
          onClose={() => setShowPropertyDialog(false)}
          node={selectedNode}
          schema={schema}
          configData={configData}
        />
      )}

      {showVizDialog && (
        <VisualizationDialog
          isOpen={showVizDialog}
          onClose={() => setShowVizDialog(false)}
        />
      )}
    </div>
  )
}

export default EditorPanel

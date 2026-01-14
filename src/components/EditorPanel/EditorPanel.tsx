import { Edit3, Save, RotateCcw } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import './EditorPanel.css'

function EditorPanel() {
  const { selectedNode } = useAppStore()

  const renderEditor = () => {
    if (!selectedNode) {
      return (
        <div className="editor-placeholder">
          <p className="placeholder-text">Select an item from the tree to edit</p>
        </div>
      )
    }

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
    </div>
  )
}

export default EditorPanel

import { Edit3, Save, RotateCcw } from 'lucide-react'
import './EditorPanel.css'

function EditorPanel() {
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
        <div className="editor-placeholder">
          <p className="placeholder-text">Select an item from the tree to edit</p>
          
          {/* Sample form for demonstration */}
          <div className="form-section">
            <h3 className="form-section-title">Solver Settings</h3>
            <div className="form-group">
              <label className="form-label">Solver Type</label>
              <select className="form-input">
                <option>SIMPLE</option>
                <option>PISO</option>
                <option>SIMPLEC</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Iterations</label>
              <input type="number" className="form-input" defaultValue={1000} />
            </div>
            <div className="form-group">
              <label className="form-label">Convergence Tolerance</label>
              <input type="number" className="form-input" defaultValue={0.0001} step={0.0001} />
            </div>
            <div className="form-group">
              <label className="form-label">Enable Turbulence</label>
              <input type="checkbox" className="form-checkbox" defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorPanel

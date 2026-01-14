import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import TreePanel from './components/TreePanel/TreePanel'
import EditorPanel from './components/EditorPanel/EditorPanel'
import Viewport3D from './components/Viewport3D/Viewport3D'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <PanelGroup direction="horizontal">
        {/* Left Panel Group - contains tree and editor vertically stacked */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <PanelGroup direction="vertical">
            {/* Tree Panel - Top */}
            <Panel defaultSize={50} minSize={20}>
              <TreePanel />
            </Panel>
            
            {/* Vertical Resize Handle */}
            <PanelResizeHandle className="resize-handle resize-handle-vertical" />
            
            {/* Editor Panel - Bottom */}
            <Panel defaultSize={50} minSize={20}>
              <EditorPanel />
            </Panel>
          </PanelGroup>
        </Panel>

        {/* Horizontal Resize Handle */}
        <PanelResizeHandle className="resize-handle resize-handle-horizontal" />

        {/* Right Panel - 3D Viewport */}
        <Panel defaultSize={75} minSize={40}>
          <Viewport3D />
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default App

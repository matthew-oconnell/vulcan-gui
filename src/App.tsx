import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import TreePanel from './components/TreePanel/TreePanel'
import EditorPanel from './components/EditorPanel/EditorPanel'
import Viewport3D from './components/Viewport3D/Viewport3D'
import MenuBar from './components/MenuBar/MenuBar'
import NewProjectWizard, { ProjectConfig } from './components/MenuBar/NewProjectWizard'
import { useAppStore } from './store/appStore'
import './App.css'

function App() {
  const [showNewProjectWizard, setShowNewProjectWizard] = useState(false)
  const { configData, initializeConfig } = useAppStore()

  const handleNew = () => {
    setShowNewProjectWizard(true)
  }

  const handleCreateProject = (config: ProjectConfig) => {
    console.log('Creating new project with config:', config)
    initializeConfig(config)
    console.log('Config initialized, check store for updated configData')
  }

  const handleOpen = () => {
    console.log('Open file')
    // TODO: Open file dialog and load configuration
  }

  const handleSave = () => {
    console.log('Save file')
    console.log('Current config:', configData)
    // TODO: Save current configuration to file
  }

  const handleValidate = () => {
    console.log('Validate configuration')
    // TODO: Validate configuration against schema
  }

  const handleExit = () => {
    console.log('Exit')
    // TODO: Prompt to save if dirty, then close
  }

  return (
    <div className="app-container">
      <MenuBar 
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onValidate={handleValidate}
        onExit={handleExit}
      />
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

      {/* Modals */}
      {showNewProjectWizard && (
        <NewProjectWizard
          onClose={() => setShowNewProjectWizard(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  )
}

export default App

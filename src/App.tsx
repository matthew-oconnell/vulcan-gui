import { useState } from 'react'
import { saveJsonFile } from './utils/fileUtils'
import { useNotifications } from './components/Notification/NotificationManager'
import Notification from './components/Notification/Notification'
import { validateAgainstSchema, formatValidationErrors, ValidationErrorItem } from './utils/schemaValidator'
import ValidationErrorDialog from './components/ValidationErrorDialog/ValidationErrorDialog'
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([])
  const { configData, initializeConfig } = useAppStore()
  const { notifySuccess, notifyError, notifyInfo, notifications } = useNotifications()

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

  const validateAndSave = async () => {
    try {
      // Save the file
      await saveJsonFile(configData, 'vulcan_config.json')
      console.log('File saved successfully')
      notifySuccess('Configuration saved successfully')
      
      // Clear any validation errors
      setValidationErrors([])
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to save file:', error)
        notifyError('Failed to save configuration: ' + (error as Error).message)
      }
    }
  }
  
  // Function to update the config data with a quick fix
  const handleQuickFix = (parentPath: string, propertyName: string, value: any) => {
    console.log(`Quick fixing ${propertyName} in "${parentPath}" with:`, value);
    console.log('Current configData before update:', configData);
    
    try {
      // Clone the current config
      const updatedConfig = JSON.parse(JSON.stringify(configData));
      
      // Special handling for top-level properties
      if (parentPath === '' || parentPath === 'root') {
        console.log(`Adding top-level property ${propertyName}:`, value);
        updatedConfig[propertyName] = value;
      } else {
        // Navigate to the parent path
        const pathParts = parentPath.split('.');
        let current = updatedConfig;
        
        // Navigate the path (skipping 'root' if present)
        if (pathParts[0] === 'root') pathParts.shift();
        
        // Create nested objects along the path if they don't exist
        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          
          // Handle array access notation [index]
          if (part.includes('[') && part.includes(']')) {
            // This is an array path like items[0] - we need special handling
            const arrayName = part.split('[')[0];
            const indexStr = part.split('[')[1].split(']')[0];
            const index = parseInt(indexStr, 10);
            
            // Create array if it doesn't exist
            if (!current[arrayName]) current[arrayName] = [];
            
            // Ensure the array is big enough
            while (current[arrayName].length <= index) {
              current[arrayName].push({});
            }
            
            // Move to this array element
            current = current[arrayName][index];
          } else {
            // Regular object property
            if (i === pathParts.length - 1) {
              // We've reached the parent - add or update the property
              current[part] = current[part] || {};
              current = current[part];
            } else {
              // Create path if it doesn't exist
              current[part] = current[part] || {};
              current = current[part];
            }
          }
        }
        
        // Add the property to the final object
        current[propertyName] = value;
      }
      
      // Update the store with the modified config
      console.log('Updating store with new config:', updatedConfig);
      console.log(`Updated property: ${propertyName} =`, 
                 parentPath === '' || parentPath === 'root' ? 
                 updatedConfig[propertyName] : 
                 JSON.stringify(updatedConfig).includes(propertyName));
      
      // Actually update the store
      useAppStore.setState({ configData: updatedConfig });
      
      // Close the validation dialog and show success
      setValidationErrors([]);
      notifySuccess(`Added property "${propertyName}"`);
      
      // Ensure our local reference is updated too
      // This is critical because handleSave() will use this reference
      // We need to use the updated config from the store
      const updatedStoreConfig = useAppStore.getState().configData;
      
      // Validate again to see if there are more errors
      // Use a small timeout to ensure the store update has propagated
      setTimeout(() => {
        console.log('Re-validating after quick fix. Current config:', updatedStoreConfig);
        
        // Run the validation with the latest config directly from the store
        validateConfigAndSave(updatedStoreConfig);
      }, 100);
    } catch (error) {
      console.error('Error applying quick fix:', error);
      notifyError(`Failed to add property: ${(error as Error).message}`);
    }
  };
  
  // Function to validate a configuration and save if valid
  const validateConfigAndSave = async (configToValidate: any) => {
    console.log('Validating config:', configToValidate)
    
    // Fetch the schema and validate the configuration
    try {
      const schemaResponse = await fetch('/input.schema.json')
      const schema = await schemaResponse.json()
      
      // Validate configuration against schema
      const { valid, errors } = validateAgainstSchema(schema, configToValidate)
      
      if (!valid && errors) {
        console.error('Configuration validation failed:', errors)
        // Pass the schema to get better type information for quick fixes
        const formattedErrors = formatValidationErrors(errors, schema)
        
        // Show the validation error dialog
        setValidationErrors(formattedErrors)
        return
      } 
      
      // If validation passed, save directly
      notifySuccess('Configuration validated successfully')
      await validateAndSave()
    } catch (error) {
      console.error('Error during validation:', error)
      notifyError('Error validating configuration: ' + (error as Error).message)
    }
  }
  
  // Handle the save action from the menu
  const handleSave = async () => {
    console.log('Save file')
    console.log('Current config:', configData)
    
    // Validate with the current config from the component state
    await validateConfigAndSave(configData)
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
      
      {/* Display notifications */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => {}} // handled by useNotifications
        />
      ))}
      
      {/* Validation Error Dialog */}
      {validationErrors.length > 0 && (
        <ValidationErrorDialog 
          errors={validationErrors}
          onCancel={() => {
            setValidationErrors([])
            notifyError('Save cancelled due to validation errors')
          }}
          onContinue={() => {
            notifyInfo('Saving configuration with validation errors')
            validateAndSave()
          }}
          onNavigateToError={(path) => {
            console.log('Navigate to path:', path)
            
            // Close the validation dialog
            setValidationErrors([])
            
            // Navigate to the path using our global function
            if ((window as any).navigateToTreePath) {
              notifyInfo(`Navigating to ${path}`)
              // Add root prefix if needed
              const fullPath = path.startsWith('root.') ? path : `root.${path}`
              ;(window as any).navigateToTreePath(fullPath)
            } else {
              console.error('Tree navigation function not available')
              notifyError('Could not navigate to error location')
            }
          }}
          onQuickFix={handleQuickFix}
          title="Configuration Validation Errors"
        />
      )}
    </div>
  )
}

export default App

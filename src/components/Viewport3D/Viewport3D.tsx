import { Canvas, useThree } from '@react-three/fiber'
import { TrackballControls, Grid } from '@react-three/drei'
import { Box as BoxIcon, Maximize2, Camera } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Surface } from '../../types/surface'
import { BoundaryCondition } from '../../types/config'
import { useState, useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { CameraControls, CameraToolbar } from './CameraToolbar'
import BoundaryConditionDialog from '../BoundaryConditionDialog/BoundaryConditionDialog'
import './Viewport3D.css'

// Sample surfaces with metadata
const sampleSurfaces: Surface[] = [
  {
    id: 'surface-1',
    name: 'Inlet',
    metadata: { id: 'surface-1', tag: 1, tagName: 'inlet' }
  },
  {
    id: 'surface-2',
    name: 'Outlet',
    metadata: { id: 'surface-2', tag: 2, tagName: 'outlet' }
  },
  {
    id: 'surface-3',
    name: 'Wall',
    metadata: { id: 'surface-3', tag: 3, tagName: 'wall' }
  }
]

function ClickableSurface({ 
  surface, 
  onContextMenu 
}: { 
  surface: Surface
  onContextMenu: (e: any, surface: Surface) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)
  const { selectedSurface, setSelectedSurface, selectedBC, soloBC, surfaceVisibility, surfaceRenderSettings } = useAppStore()
  const [hovered, setHovered] = useState(false)
  
  const isSelected = selectedSurface?.id === surface.id
  const isVisible = surfaceVisibility[surface.id] ?? true
  
  // Get render settings with defaults
  const settings = surfaceRenderSettings[surface.id] ?? {
    surfaceColor: '#4a9eff',
    meshColor: '#ffffff',
    renderMode: 'surface' as const,
    opacity: 1
  }
  
  // Create geometry from Float32Array if available (already centered and scaled globally)
  const geometry = useMemo(() => {
    if (!surface.geometry) return null
    
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(surface.geometry.vertices, 3))
    geom.setAttribute('normal', new THREE.BufferAttribute(surface.geometry.normals, 3))
    
    console.log('[Viewport3D] Created BufferGeometry for', surface.name, ':', surface.geometry.vertices.length / 3, 'vertices')
    return geom
  }, [surface.geometry, surface.name])
  
  // Check if this surface belongs to the selected BC
  const belongsToSelectedBC = selectedBC ? (() => {
    const tags = selectedBC['mesh boundary tags']
    const surfaceTag = surface.metadata.tag
    
    if (Array.isArray(tags)) {
      return (tags as any[]).includes(surfaceTag) || (tags as any[]).includes(String(surfaceTag))
    } else if (typeof tags === 'number') {
      return tags === surfaceTag
    } else if (typeof tags === 'string') {
      return tags.split(',').map(s => parseInt(s.trim(), 10)).includes(surfaceTag)
    }
    return false
  })() : false
  
  // Check if this surface belongs to the soloed BC
  const belongsToSoloBC = soloBC ? (() => {
    const tags = soloBC['mesh boundary tags']
    const surfaceTag = surface.metadata.tag
    
    if (Array.isArray(tags)) {
      return (tags as any[]).includes(surfaceTag) || (tags as any[]).includes(String(surfaceTag))
    } else if (typeof tags === 'number') {
      return tags === surfaceTag
    } else if (typeof tags === 'string') {
      return tags.split(',').map(s => parseInt(s.trim(), 10)).includes(surfaceTag)
    }
    return false
  })() : true // Show all surfaces if no BC is soloed
  
  // Don't render if surface is hidden
  if (!isVisible) {
    return null
  }
  
  // Don't render if BC is soloed and this surface doesn't belong to it
  if (soloBC && !belongsToSoloBC) {
    return null
  }
  
  // Track right-click position to differentiate click from drag (use ref for immediate access)
  const rightClickStartRef = useRef<{ x: number; y: number } | null>(null)
  
  const handleClick = (e: any) => {
    e.stopPropagation()
    setSelectedSurface(surface)
  }
  
  const handlePointerDown = (e: any) => {
    // Track right-click start position
    if (e.button === 2) {
      console.log('Right click down on surface:', surface.metadata.tagName, e.clientX, e.clientY)
      rightClickStartRef.current = { x: e.clientX, y: e.clientY }
    }
  }
  
  const handleContextMenu = (e: any) => {
    e.stopPropagation()
    
    console.log('Context menu event on surface:', surface.metadata.tagName, 'rightClickStart:', rightClickStartRef.current)
    
    // Check if mouse moved significantly from click start (drag threshold = 5px)
    if (rightClickStartRef.current) {
      const dx = e.clientX - rightClickStartRef.current.x
      const dy = e.clientY - rightClickStartRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      console.log('Distance moved:', distance)
      
      if (distance < 5) {
        // It was a click, not a drag - show context menu
        console.log('Calling onContextMenu')
        onContextMenu(e, surface)
      }
      
      rightClickStartRef.current = null
    }
  }
  
  // Determine display color (highlight overrides custom color)
  const displayColor = isSelected ? '#ffd700' : hovered ? '#ffffff' : settings.surfaceColor
  const emissive = isSelected ? '#aa8800' : hovered ? '#444444' : '#000000'
  const emissiveIntensity = isSelected ? 0.5 : hovered ? 0.2 : 0
  
  // If we have geometry from mesh, use it
  if (geometry) {
    const showSurface = settings.renderMode === 'surface' || settings.renderMode === 'both'
    const showMesh = settings.renderMode === 'mesh' || settings.renderMode === 'both'
    
    return (
      <group>
        {/* Surface mesh */}
        {showSurface && (
          <mesh
            ref={meshRef}
            geometry={geometry}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onContextMenu={handleContextMenu}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshStandardMaterial 
              color={displayColor}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              side={THREE.DoubleSide}
              flatShading={true}
              transparent={settings.opacity < 1}
              opacity={settings.opacity}
            />
          </mesh>
        )}
        
        {/* Mesh edges */}
        {showMesh && (
          <lineSegments
            ref={edgesRef}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onContextMenu={handleContextMenu}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <edgesGeometry args={[geometry]} />
            <lineBasicMaterial color={settings.meshColor} />
          </lineSegments>
        )}
      </group>
    )
  }
  
  // Otherwise use sample box geometry
  const position: [number, number, number] = surface.id === 'surface-1' ? [0, 0.5, 0] : 
                                              surface.id === 'surface-2' ? [2, 0.5, 0] : 
                                              [-2, 0.25, 0]
  
  const size: [number, number, number] = surface.id === 'surface-1' ? [2, 1, 1] : 
                                          surface.id === 'surface-2' ? [1, 1, 1] : 
                                          [1.5, 0.5, 1.5]
  
  const showSurface = settings.renderMode === 'surface' || settings.renderMode === 'both'
  const showMesh = settings.renderMode === 'mesh' || settings.renderMode === 'both'
  
  return (
    <group position={position}>
      {/* Surface mesh */}
      {showSurface && (
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={size} />
          <meshStandardMaterial 
            color={displayColor}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            transparent={settings.opacity < 1}
            opacity={settings.opacity}
          />
        </mesh>
      )}
      
      {/* Mesh edges */}
      {showMesh && (
        <lineSegments
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
          <lineBasicMaterial color={settings.meshColor} />
        </lineSegments>
      )}
    </group>
  )
}

function Scene({ onSurfaceContextMenu }: { onSurfaceContextMenu: (e: any, surface: Surface) => void }) {
  const { scene } = useThree()
  const { availableSurfaces, cameraSettings } = useAppStore()
  
  // Set background color
  useEffect(() => {
    scene.background = new THREE.Color(0x1a1a1a)
  }, [scene])
  
  console.log('[Viewport3D] Rendering scene, availableSurfaces:', availableSurfaces.length)
  
  return (
    <>
      {/* Camera control functions */}
      <CameraControls />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <directionalLight position={[0, 10, 0]} intensity={0.3} />

      {/* Surfaces from mesh or samples */}
      {availableSurfaces.length > 0 ? (
        availableSurfaces.map((surface) => (
          <ClickableSurface key={surface.id} surface={surface} onContextMenu={onSurfaceContextMenu} />
        ))
      ) : (
        sampleSurfaces.map((surface) => (
          <ClickableSurface key={surface.id} surface={surface} onContextMenu={onSurfaceContextMenu} />
        ))
      )}

      {/* Ground grid */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6e6e6e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9d9d9d"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Camera controls - Trackball style like Paraview */}
      <TrackballControls 
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={cameraSettings.rotateSpeed}
        zoomSpeed={cameraSettings.invertZoom ? -cameraSettings.zoomSpeed : cameraSettings.zoomSpeed}
        panSpeed={cameraSettings.panSpeed}
        staticMoving={false}
        dynamicDampingFactor={0.2}
        minDistance={1}
        maxDistance={100}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.DOLLY
        }}
      />
    </>
  )
}

function Viewport3D() {
  const { 
    totalVertices, 
    totalFaces, 
    overlayPosition, 
    setOverlayPosition, 
    selectedSurface, 
    configData,
    addBoundaryCondition,
    setSelectedBC
  } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; surface: Surface } | null>(null)
  const [showBCDialog, setShowBCDialog] = useState(false)
  const [bcDialogInitialSurface, setBCDialogInitialSurface] = useState<Surface | undefined>(undefined)
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const viewportContent = document.querySelector('.viewport-content')
    if (!viewportContent) return
    
    const rect = viewportContent.getBoundingClientRect()
    const statsElement = document.querySelector('.stats') as HTMLElement
    if (!statsElement) return
    
    const statsRect = statsElement.getBoundingClientRect()
    
    let newX = e.clientX - rect.left - dragOffset.x
    let newY = e.clientY - rect.top - dragOffset.y
    
    // Keep within bounds
    newX = Math.max(0, Math.min(newX, rect.width - statsRect.width))
    newY = Math.max(0, Math.min(newY, rect.height - statsRect.height))
    
    setOverlayPosition({ x: newX, y: newY })
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])
  
  const handleSurfaceContextMenu = (e: any, surface: Surface) => {
    // R3F events don't have preventDefault directly
    if (e.nativeEvent) {
      e.nativeEvent.preventDefault()
    }
    console.log('handleSurfaceContextMenu called:', surface.metadata.tagName, e.clientX, e.clientY)
    setContextMenu({ x: e.clientX, y: e.clientY, surface })
  }
  
  const closeContextMenu = () => {
    setContextMenu(null)
  }
  
  const handleAddToBC = () => {
    if (!contextMenu) return
    
    // TODO: Show dialog to select which BC to add the surface to
    // For now, just log it
    console.log('Add surface to BC:', contextMenu.surface)
    closeContextMenu()
  }
  
  const handleCreateNewBC = () => {
    if (!contextMenu) return
    
    // Open the BC creation dialog with the selected surface
    setBCDialogInitialSurface(contextMenu.surface)
    setShowBCDialog(true)
    closeContextMenu()
  }
  
  const handleAddToVisualization = () => {
    if (!contextMenu) return
    
    // TODO: Show dialog to select which visualization to add the surface to
    console.log('Add surface to visualization:', contextMenu.surface)
    closeContextMenu()
  }
  
  const handleCreateNewVisualization = () => {
    if (!contextMenu) return
    
    // TODO: Implement surface visualization creation
    console.log('Create new surface visualization:', contextMenu.surface)
    closeContextMenu()
  }
  
  // Close context menu on click outside
  useEffect(() => {
    if (contextMenu) {
      window.addEventListener('click', closeContextMenu)
      return () => {
        window.removeEventListener('click', closeContextMenu)
      }
    }
  }, [contextMenu])
  
  return (
    <div className="panel viewport-panel">
      <div className="panel-header">
        <BoxIcon size={16} />
        <span>3D Viewport</span>
        <div className="viewport-info">
          <span className="info-text">Drag to rotate • Scroll to zoom • Right-click to pan</span>
        </div>
        <div className="panel-actions">
          <button className="icon-button" title="Reset camera">
            <Camera size={14} />
          </button>
          <button className="icon-button" title="Fullscreen">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
      <div className="viewport-content">
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50 }}
          shadows
          onContextMenu={(e) => e.preventDefault()}
        >
          <Scene onSurfaceContextMenu={handleSurfaceContextMenu} />
        </Canvas>
        
        {/* Camera Toolbar */}
        <CameraToolbar />
        
        {/* Overlay UI */}
        <div className="viewport-overlay">
          <div 
            className="stats-overlay" 
            style={{ 
              left: `${overlayPosition.x}px`, 
              top: `${overlayPosition.y}px` 
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="stats">
              <div className="stat-item">Vertices: {totalVertices}</div>
              <div className="stat-item">Faces: {totalFaces}</div>
            </div>
          </div>
          
          {/* Surface metadata overlay */}
          {selectedSurface && (
            <div className="overlay-corner top-right">
              <div className="surface-metadata">
                <div className="metadata-header">{selectedSurface.name}</div>
                <div className="metadata-row">Tag: {selectedSurface.metadata.tag}</div>
                {selectedSurface.metadata.isLumped && selectedSurface.metadata.originalRegionCount && (
                  <div className="metadata-row">
                    Lumped: {selectedSurface.metadata.originalRegionCount} region{selectedSurface.metadata.originalRegionCount > 1 ? 's' : ''}
                  </div>
                )}
                {(() => {
                  const bcs = configData.HyperSolve?.['boundary conditions'] || []
                  const associatedBC = bcs.find(bc => {
                    const tags = bc['mesh boundary tags']
                    const surfaceTag = selectedSurface.metadata.tag
                    
                    if (Array.isArray(tags)) {
                      return tags.includes(surfaceTag) || tags.includes(String(surfaceTag))
                    } else if (typeof tags === 'number') {
                      return tags === surfaceTag
                    } else if (typeof tags === 'string') {
                      return tags.split(',').map(s => parseInt(s.trim(), 10)).includes(surfaceTag)
                    }
                    return false
                  })
                  
                  return associatedBC ? (
                    <div className="metadata-row">BC: {associatedBC.name || 'Unnamed'}</div>
                  ) : (
                    <div className="metadata-row unassigned">No BC assigned</div>
                  )
                })()}
              </div>
            </div>
          )}
          
          <div className="overlay-corner bottom-right">
            <div className="axis-indicator">
              <div className="axis-label">X</div>
              <div className="axis-label">Y</div>
              <div className="axis-label">Z</div>
            </div>
          </div>
        </div>
        
        {/* Context menu */}
        {contextMenu && selectedSurface && (() => {
          const hasBCs = configData?.HyperSolve?.['boundary conditions']?.length > 0
          const hasVisualizations = false // TODO: Check when visualizations are implemented
          
          return (
            <div 
              className="context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              {hasBCs && <div className="context-menu-item" onClick={handleAddToBC}>Add to BC</div>}
              <div className="context-menu-item" onClick={handleCreateNewBC}>Create new BC from surface</div>
              {(hasBCs || hasVisualizations) && <div className="context-menu-separator" />}
              {hasVisualizations && <div className="context-menu-item" onClick={handleAddToVisualization}>Add to Visualization</div>}
              <div className="context-menu-item" onClick={handleCreateNewVisualization}>Create new surface visualization</div>
            </div>
          )
        })()}
      </div>
      
      {/* Boundary Condition Dialog */}
      <BoundaryConditionDialog 
        isOpen={showBCDialog}
        onClose={() => {
          setShowBCDialog(false)
          setBCDialogInitialSurface(undefined)
        }}
        initialSurface={bcDialogInitialSurface}
      />
    </div>
  )
}

export default Viewport3D

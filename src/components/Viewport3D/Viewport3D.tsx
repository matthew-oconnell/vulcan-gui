import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { Box as BoxIcon, Maximize2, Camera } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Surface } from '../../types/surface'
import { useState, useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
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

function ClickableSurface({ surface }: { surface: Surface }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { selectedSurface, setSelectedSurface, selectedBC, soloBC } = useAppStore()
  const [hovered, setHovered] = useState(false)
  
  const isSelected = selectedSurface?.id === surface.id
  
  // Create geometry from Float32Array if available and center/scale it
  const { geometry, scale, center } = useMemo(() => {
    if (!surface.geometry) return { geometry: null, scale: 1, center: [0, 0, 0] as [number, number, number] }
    
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(surface.geometry.vertices, 3))
    geom.setAttribute('normal', new THREE.BufferAttribute(surface.geometry.normals, 3))
    
    // Compute bounding box to center and scale
    geom.computeBoundingBox()
    const bbox = geom.boundingBox!
    const center = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    
    // Center the geometry
    geom.translate(-center.x, -center.y, -center.z)
    
    // Scale to fit in a 10-unit cube
    const targetSize = 10
    const scaleFactor = targetSize / maxDim
    
    console.log('[Viewport3D] Created BufferGeometry:', {
      vertices: surface.geometry.vertices.length / 3,
      originalCenter: [center.x, center.y, center.z],
      originalSize: [size.x, size.y, size.z],
      scaleFactor
    })
    
    return { 
      geometry: geom, 
      scale: scaleFactor,
      center: [0, 0, 0] as [number, number, number]
    }
  }, [surface.geometry])
  
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
  
  // Don't render if BC is soloed and this surface doesn't belong to it
  if (soloBC && !belongsToSoloBC) {
    return null
  }
  
  const handleClick = (e: any) => {
    e.stopPropagation()
    setSelectedSurface(surface)
  }
  
  // If we have geometry from mesh, use it
  if (geometry) {
    return (
      <mesh
        ref={meshRef}
        geometry={geometry}
        scale={[scale, scale, scale]}
        position={center}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={isSelected ? '#ffd700' : hovered ? '#ffffff' : '#4a9eff'}
          emissive={isSelected ? '#aa8800' : hovered ? '#444444' : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.2 : 0}
          side={THREE.DoubleSide}
          flatShading={true}
        />
      </mesh>
    )
  }
  
  // Otherwise use sample box geometry
  const position: [number, number, number] = surface.id === 'surface-1' ? [0, 0.5, 0] : 
                                              surface.id === 'surface-2' ? [2, 0.5, 0] : 
                                              [-2, 0.25, 0]
  
  const size: [number, number, number] = surface.id === 'surface-1' ? [2, 1, 1] : 
                                          surface.id === 'surface-2' ? [1, 1, 1] : 
                                          [1.5, 0.5, 1.5]
  
  const baseColor = surface.id === 'surface-1' ? '#4a9eff' : 
                    surface.id === 'surface-2' ? '#ff6b6b' : 
                    '#51cf66'
  
  // Determine color based on state
  let color = baseColor
  let emissive = '#000000'
  let emissiveIntensity = 0
  
  if (isSelected) {
    color = '#ffd700' // Gold for direct selection
    emissive = '#aa8800'
    emissiveIntensity = 0.5
  } else if (belongsToSelectedBC) {
    color = '#ff9800' // Orange for BC membership
    emissive = '#cc6600'
    emissiveIntensity = 0.3
  } else if (hovered) {
    color = '#ffffff'
    emissive = '#444444'
    emissiveIntensity = 0.2
  }
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  )
}

function Scene() {
  const { camera, controls, scene } = useThree()
  const { meshData, availableSurfaces } = useAppStore()
  
  // Set background color
  useEffect(() => {
    scene.background = new THREE.Color(0x1a1a1a)
  }, [scene])
  
  // DON'T auto-move camera - mesh is now centered and scaled to fit in view
  useEffect(() => {
    if (!meshData) return
    console.log('[Viewport3D] Mesh loaded, geometry is centered and scaled to fit')
  }, [meshData])
  
  console.log('[Viewport3D] Rendering scene, availableSurfaces:', availableSurfaces.length)
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <directionalLight position={[0, 10, 0]} intensity={0.3} />

      {/* Surfaces from mesh or samples */}
      {availableSurfaces.length > 0 ? (
        availableSurfaces.map((surface) => (
          <ClickableSurface key={surface.id} surface={surface} />
        ))
      ) : (
        sampleSurfaces.map((surface) => (
          <ClickableSurface key={surface.id} surface={surface} />
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

      {/* Camera controls */}
      <OrbitControls 
        makeDefault
        enableDamping={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  )
}

function Viewport3D() {
  const { meshData } = useAppStore()
  
  const vertexCount = meshData ? meshData.vertices.length / 3 : 0
  const faceCount = meshData ? meshData.vertices.length / 9 : 0
  
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
        >
          <Scene />
        </Canvas>
        
        {/* Overlay UI */}
        <div className="viewport-overlay">
          <div className="overlay-corner top-left">
            <div className="stats">
              <div className="stat-item">Vertices: {vertexCount}</div>
              <div className="stat-item">Faces: {faceCount}</div>
            </div>
          </div>
          <div className="overlay-corner bottom-right">
            <div className="axis-indicator">
              <div className="axis-label">X</div>
              <div className="axis-label">Y</div>
              <div className="axis-label">Z</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Viewport3D

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Box, Sphere } from '@react-three/drei'
import { Box as BoxIcon, Maximize2, Camera } from 'lucide-react'
import './Viewport3D.css'

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Sample mesh - placeholder for actual CFD mesh */}
      <group>
        <Box args={[2, 1, 1]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#4a9eff" wireframe={false} />
        </Box>
        <Sphere args={[0.5, 32, 32]} position={[2, 0.5, 0]}>
          <meshStandardMaterial color="#ff6b6b" />
        </Sphere>
        <Box args={[1.5, 0.5, 1.5]} position={[-2, 0.25, 0]}>
          <meshStandardMaterial color="#51cf66" />
        </Box>
      </group>

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
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  )
}

function Viewport3D() {
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
              <div className="stat-item">Vertices: 0</div>
              <div className="stat-item">Faces: 0</div>
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

/**
 * Utility functions for parsing STL files
 * Logs to console for debugging
 */

export interface MeshData {
  vertices: Float32Array
  normals: Float32Array
}

export const parseSTL = async (file: File): Promise<MeshData> => {
  console.log('[STL Parser] Starting to parse file:', file.name)
  const buffer = await file.arrayBuffer()
  console.log('[STL Parser] File size:', buffer.byteLength, 'bytes')
  
  const textDecoder = new TextDecoder('utf-8')
  const header = textDecoder.decode(buffer.slice(0, 80))
  
  const isBinary = isBinarySTL(buffer)
  console.log('[STL Parser] File type:', isBinary ? 'Binary' : 'ASCII')
  
  if (header.toLowerCase().startsWith('solid') && !isBinary) {
    return parseASCIISTL(buffer)
  } else {
    return parseBinarySTL(buffer)
  }
}

const isBinarySTL = (buffer: ArrayBuffer): boolean => {
  if (buffer.byteLength < 84) return false
  const view = new DataView(buffer)
  const faceCount = view.getUint32(80, true)
  const expectedSize = 84 + (faceCount * 50)
  return Math.abs(buffer.byteLength - expectedSize) < 100
}

const parseBinarySTL = (buffer: ArrayBuffer): MeshData => {
  console.log('[STL Parser] Parsing binary STL')
  const view = new DataView(buffer)
  const faceCount = view.getUint32(80, true)
  console.log('[STL Parser] Face count:', faceCount)
  
  const vertices = new Float32Array(faceCount * 9)
  const normals = new Float32Array(faceCount * 9)
  
  let offset = 84
  for (let i = 0; i < faceCount; i++) {
    const nx = view.getFloat32(offset, true)
    const ny = view.getFloat32(offset + 4, true)
    const nz = view.getFloat32(offset + 8, true)
    offset += 12
    
    for (let v = 0; v < 3; v++) {
      const vx = view.getFloat32(offset, true)
      const vy = view.getFloat32(offset + 4, true)
      const vz = view.getFloat32(offset + 8, true)
      offset += 12
      
      const idx = i * 9 + v * 3
      vertices[idx] = vx
      vertices[idx + 1] = vy
      vertices[idx + 2] = vz
      
      normals[idx] = nx
      normals[idx + 1] = ny
      normals[idx + 2] = nz
    }
    offset += 2
  }
  
  console.log('[STL Parser] Binary parse complete - vertices:', vertices.length / 3, 'triangles:', faceCount)
  return { vertices, normals }
}

const parseASCIISTL = (buffer: ArrayBuffer): MeshData => {
  console.log('[STL Parser] Parsing ASCII STL')
  const textDecoder = new TextDecoder('utf-8')
  const text = textDecoder.decode(buffer)
  
  const vertices: number[] = []
  const normals: number[] = []
  const lines = text.split('\n')
  let currentNormal: [number, number, number] | null = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('facet normal')) {
      const parts = trimmed.split(/\s+/)
      currentNormal = [
        parseFloat(parts[2]),
        parseFloat(parts[3]),
        parseFloat(parts[4])
      ]
    } else if (trimmed.startsWith('vertex')) {
      const parts = trimmed.split(/\s+/)
      vertices.push(
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      )
      if (currentNormal) {
        normals.push(...currentNormal)
      }
    }
  }
  
  console.log('[STL Parser] ASCII parse complete - vertices:', vertices.length / 3)
  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals)
  }
}

export const pickSTLFile = async (): Promise<File | null> => {
  console.log('[STL Parser] Opening file picker')
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.stl'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      console.log('[STL Parser] File selected:', file?.name || 'none')
      resolve(file || null)
    }
    
    input.oncancel = () => {
      console.log('[STL Parser] File picker cancelled')
      resolve(null)
    }
    
    input.click()
  })
}

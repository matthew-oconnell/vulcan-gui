export interface SurfaceMetadata {
  id: string
  tag: number
  tagName: string
}

export interface MeshGeometry {
  vertices: Float32Array
  normals: Float32Array
}

export interface Surface {
  id: string
  name: string
  metadata: SurfaceMetadata
  geometry?: MeshGeometry
}

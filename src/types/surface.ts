export interface SurfaceMetadata {
  id: string
  tag: number
  tagName: string
}

export interface Surface {
  id: string
  name: string
  metadata: SurfaceMetadata
}

// Utility to extract BC type descriptions from the schema

export interface BCTypeInfo {
  type: string
  description: string
}

let bcTypeDescriptions: Record<string, string> | null = null

/**
 * Load and cache BC type descriptions from the schema
 */
export async function loadBCTypeDescriptions(): Promise<Record<string, string>> {
  if (bcTypeDescriptions) {
    return bcTypeDescriptions
  }

  try {
    const response = await fetch('/input.schema.json')
    const schema = await response.json()

    const descriptions: Record<string, string> = {}

    // Get BC definition names from the Boundary Condition anyOf
    const bcDefinitions = schema.definitions?.['Boundary Condition']?.anyOf?.map((ref: any) =>
      ref.$ref.replace('#/definitions/', '')
    ) || []

    // For each BC definition, extract enum values and description
    bcDefinitions.forEach((defName: string) => {
      const def = schema.definitions?.[defName]
      if (def?.properties?.type?.enum) {
        const description = def.description || 'No description available'
        const enumValues = def.properties.type.enum

        enumValues.forEach((enumVal: string) => {
          descriptions[enumVal] = description
        })
      }
    })

    bcTypeDescriptions = descriptions
    return descriptions
  } catch (error) {
    console.error('Failed to load BC type descriptions:', error)
    return {}
  }
}

/**
 * Get description for a specific BC type
 */
export function getBCTypeDescription(type: string): string {
  return bcTypeDescriptions?.[type] || 'No description available'
}

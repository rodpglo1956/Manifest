// Marie AI and Smart Routing types
// Phase 5: Marie AI & Smart Routing

export type MarieMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type MarieQueryRequest = {
  query: string
}

export type MarieQueryResponse = {
  response: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export type ActionButton = {
  type: 'view_load' | 'dispatch_driver' | 'generate_invoice'
  entityId: string
  label: string
}

export type DriverSuggestion = {
  driver_id: string
  driver_name: string
  score: number
  factors: ScoringFactors
}

export type ScoringFactors = {
  proximity: number
  availability: number
  equipment: number
  performance: number
  lane: number
}

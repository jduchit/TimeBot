/*
  Constantes globales de la aplicacion
  Solo se almacenan valores inmutables en tiempo de ejecucion
  Si un valor puede cambiar en runtime debe gestionarse en el store
*/

import type { AIProvider, AIProviderConfig } from './types'

// ---------------------------------------------------------------------------
// Configuracion de proveedores de IA
// ---------------------------------------------------------------------------
/*
  Configuracion para cada proveedor de IA
  Para incorporar un nuevo proveedor se deben seguir estos pasos:
  1 - Agregar el literal correspondiente a AIProvider en types.ts
  2 - Agregar su entrada en este objeto (TypeScript lo exigira por el Record)
  3 - Verificar que el modelo este disponible en OpenRouter o el SDK utilizado
*/
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    name: 'ChatGPT',
    model: 'openai/gpt-4o',
    color: 'bg-emerald-600',
  },
  anthropic: {
    name: 'Claude',
    model: 'anthropic/claude-sonnet-4-20250514',
    color: 'bg-orange-500',
  },
  google: {
    name: 'Gemini',
    model: 'google/gemini-2.0-flash',
    color: 'bg-blue-500',
  },
} as const
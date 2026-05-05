/*
  Definiciones de tipos e interfaces del sistema
*/

// ---------------------------------------------------------------------------
// Proveedores de IA
// ---------------------------------------------------------------------------
/*
  Identificadores validos para los proveedores de IA soportados
*/
export type AIProvider = 'openai' | 'anthropic' | 'google'

/*
  Configuracion de visualizacion y modelo para cada proveedor
*/
export interface AIProviderConfig {
  name: string   // nombre visible en la interfaz de usuario
  model: string  // identificador del modelo en formato proveedor/modelo
  color: string  // clase Tailwind asignada al badge del proveedor
}

/*
  Mapa de credenciales indexado por proveedor
  Al usar Record<AIProvider> TypeScript exige una entrada por cada proveedor definido
  Si se agrega un nuevo valor a AIProvider este tipo rompera hasta completarse
*/
export type APIKeys = Record<AIProvider, string>

// ---------------------------------------------------------------------------
// Registros de tiempo
// ---------------------------------------------------------------------------
/*
  Representa un registro de tiempo completo
*/
export interface TimeEntry {
  id: string          // identificador unico generado con crypto.randomUUID()
  proyecto: string    // nombre del proyecto
  idDevOps: string    // identificador del proyecto vinculado en Azure DevOps o Jira
  tarea: string      
  descripcion: string // descripcion de la tarea
  fecha: string       // formato ISO 8601, ejemplo: 2025-01-15
  horas: number       // admite valores decimales, ejemplo: 1.5
}

/*
  Version de TimeEntry sin identificador
  Es la estructura que retorna la IA antes de que el store asigne el id
*/
export type TimeEntryDraft = Omit<TimeEntry, 'id'>

// ---------------------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------------------
/*
  Proyecto de trabajo registrado en el sistema
*/
export interface Project {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Mensajeria del chat
// ---------------------------------------------------------------------------
/*
  Roles posibles dentro de una conversacion
  Se extrae como tipo independiente para facilitar validaciones y type guards
*/
export type ChatRole = 'user' | 'assistant'

/*
  Mensaje individual dentro del historial de conversacion con la IA
  Advertencia: Zustand serializa timestamp como string al persistir en localStorage
  Al rehidratar el estado se debe convertir con new Date(entry.timestamp)
*/
export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
}

// ---------------------------------------------------------------------------
// Contrato del endpoint /api/chat
// ---------------------------------------------------------------------------
/*
  Estructura de respuesta del endpoint cuando la IA procesa un mensaje
*/
export interface AIResponse {
  message: string           // respuesta en lenguaje natural dirigida al usuario
  entries: TimeEntryDraft[] // registros de tiempo extraidos, puede ser un array vacio
}
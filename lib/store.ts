/*
  Estado global de la aplicacion gestionado con Zustand
  Persiste en localStorage bajo la clave 'timebot-storage'
  Nota: las API keys se excluyen de la persistencia por seguridad
  Si se necesita persistirlas se debe implementar cifrado antes de hacerlo
*/

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TimeEntry, TimeEntryDraft, Project, AIProvider, APIKeys } from './types'

// ---------------------------------------------------------------------------
// Tipos internos del store
// ---------------------------------------------------------------------------
/*
  Resultado de intentar agregar un proyecto
  'duplicate' indica que ya existe un proyecto con el mismo nombre
*/
type AddProjectResult = 'success' | 'duplicate' | 'invalid'

/*
  Estadisticas calculadas en tiempo real desde los registros actuales
*/
interface TimeBotStats {
  totalHours: number
  totalEntries: number
  totalProjects: number
  totalDays: number
}

// ---------------------------------------------------------------------------
// Contrato del store
// ---------------------------------------------------------------------------
/*
  Define todas las propiedades y acciones disponibles en el estado global
  Cada seccion agrupa estado relacionado con sus acciones correspondientes
*/
interface TimeBotStore {
  // Registros de tiempo
  entries: TimeEntry[]
  addEntries: (entries: TimeEntryDraft[]) => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, updates: Partial<Omit<TimeEntry, 'id'>>) => void
  clearEntries: () => void

  // Proyectos
  projects: Project[]
  addProject: (name: string) => AddProjectResult
  removeProject: (id: string) => void
  updateProject: (id: string, name: string) => void

  // Proyecto activo
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void

  // Proveedor de IA seleccionado
  aiProvider: AIProvider
  setAIProvider: (provider: AIProvider) => void

  // Credenciales de API (no se persisten en localStorage)
  apiKeys: APIKeys
  setAPIKey: (provider: AIProvider, key: string) => void
  getAPIKey: (provider: AIProvider) => string

  // Estadisticas calculadas
  getStats: () => TimeBotStats
}

// ---------------------------------------------------------------------------
// Implementacion del store
// ---------------------------------------------------------------------------
export const useTimeBotStore = create<TimeBotStore>()(
  persist(
    (set, get) => ({

      // Estado inicial
      entries: [],
      projects: [],
      activeProjectId: null,
      aiProvider: 'anthropic',
      apiKeys: {
        openai: '',
        anthropic: '',
        google: '',
      },

      // -----------------------------------------------------------------
      // Acciones de registros de tiempo
      // -----------------------------------------------------------------
      /*
        Agrega uno o mas registros asignando un id unico a cada uno
        El id se genera en el cliente con crypto.randomUUID()
      */
      addEntries: (newEntries) => {
        const hydrated: TimeEntry[] = newEntries.map((entry) => ({
          ...entry,
          id: crypto.randomUUID(),
        }))
        set((state) => ({ entries: [...state.entries, ...hydrated] }))
      },

      /*
        Elimina un registro por su id
      */
      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }))
      },

      /*
        Actualiza campos especificos de un registro sin reemplazarlo completo
        El id no puede modificarse a traves de esta accion
      */
      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }))
      },

      /*
        Elimina todos los registros del estado
      */
      clearEntries: () => {
        set({ entries: [] })
      },

      // -----------------------------------------------------------------
      // Acciones de proyectos
      // -----------------------------------------------------------------
      /*
        Agrega un proyecto nuevo validando que el nombre no este vacio
        y que no exista otro proyecto con el mismo nombre sin distincion de mayusculas
        Retorna el resultado de la operacion para que el componente pueda reaccionar
      */
      addProject: (name) => {
        const trimmed = name.trim()

        if (!trimmed) return 'invalid'

        const isDuplicate = get().projects.some(
          (p) => p.name.toLowerCase() === trimmed.toLowerCase()
        )
        if (isDuplicate) return 'duplicate'

        const newProject: Project = {
          id: crypto.randomUUID(),
          name: trimmed,
        }

        set((state) => ({ projects: [...state.projects, newProject] }))
        return 'success'
      },

      /*
        Elimina un proyecto y desactiva el proyecto activo si era el eliminado
      */
      removeProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId:
            state.activeProjectId === id ? null : state.activeProjectId,
        }))
      },

      /*
        Actualiza el nombre de un proyecto existente
      */
      updateProject: (id, name) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name: name.trim() } : p
          ),
        }))
      },

      /*
        Establece el proyecto activo, acepta null para deseleccionar
      */
      setActiveProject: (id) => {
        set({ activeProjectId: id })
      },

      // -----------------------------------------------------------------
      // Acciones de proveedor de IA
      // -----------------------------------------------------------------
      setAIProvider: (provider) => {
        set({ aiProvider: provider })
      },

      // -----------------------------------------------------------------
      // Acciones de credenciales
      // -----------------------------------------------------------------
      /*
        Actualiza la key de un proveedor especifico sin tocar las demas
      */
      setAPIKey: (provider, key) => {
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        }))
      },

      /*
        Retorna la key del proveedor solicitado
        Retorna string vacio si aun no fue configurada
      */
      getAPIKey: (provider) => {
        return get().apiKeys[provider]
      },

      // -----------------------------------------------------------------
      // Estadisticas
      // -----------------------------------------------------------------
      /*
        Calcula estadisticas en tiempo real desde los registros actuales
        No se persiste, se recalcula cada vez que se llama
      */
      getStats: (): TimeBotStats => {
        const { entries } = get()
        return {
          totalHours: entries.reduce((sum, e) => sum + e.horas, 0),
          totalEntries: entries.length,
          totalProjects: new Set(entries.map((e) => e.proyecto).filter(Boolean)).size,
          totalDays: new Set(entries.map((e) => e.fecha)).size,
        }
      },
    }),

    {
      name: 'timebot-storage',
      storage: createJSONStorage(() => localStorage),

      /*
        Las API keys se excluyen de la persistencia
        Guardar credenciales en localStorage en texto plano es un riesgo de seguridad
        El usuario debe ingresarlas nuevamente en cada sesion
      */
      partialize: (state) => ({
        entries: state.entries,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        aiProvider: state.aiProvider,
      }),
    }
  )
)
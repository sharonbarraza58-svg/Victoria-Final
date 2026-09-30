import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/**
 * Cliente para /api/coordinador/* — mismo patrón que lib/instructor.ts.
 * TODOS estos endpoints deben quedar protegidos en el backend con un
 * require_coordinador equivalente a require_instructor (ver
 * core/security.py): aunque este archivo arme las peticiones, la
 * seguridad real vive en el servidor. Este cliente asume que el backend
 * expone las rutas descritas abajo; si todavía no existen, cada pantalla
 * de coordinador va a mostrar el mensaje de error de CoordinadorApiError
 * en vez de romperse.
 */

// --------------------------------------------------------------------
// Tipos
// --------------------------------------------------------------------
export type FichaResumen = {
  id_ficha: number;
  numero_ficha: string | null;
  nombre_programa: string | null;
  trimestre: number | null;
  nombre_director_ficha: string | null;
  num_estudiantes: number;
};

export type DashboardCoordinador = {
  nombre_programa_principal: string | null;
  numero_ficha_principal: string | null;
  trimestre_actual: number | null;
  nombre_director_ficha: string | null;
  total_fichas: number;
  fichas_recientes: FichaResumen[];
};

export type SedeResumen = {
  id_sede: number;
  nombre: string;
  descripcion: string | null;
};

export type SedeDetalle = SedeResumen & {
  direccion_principal: string | null;
  telefono_atencion: string | null;
  horario_atencion: string | null;
};

export type TipoInstructor = 'planta' | 'tecnico' | 'transversal';

export type InstructorResumen = {
  id_usuario: number;
  nombre_completo: string;
  tipo_instructor: TipoInstructor;
  numero_documento: string;
};

export type InstructorDetalle = InstructorResumen & {
  especialidad: string | null;
  tipo_contrato: string | null;
  vigencia_contrato: string | null;
  numero_ficha: string | null;
  horario_ficha: string | null;
  correo_sena: string;
  telefono: string | null;
  hoja_vida_url: string | null;
};

export type CompetenciaPortafolio = {
  id_competencia: number;
  nombre: string;
  archivos: number;
};

export type TrimestrePortafolio = {
  trimestre: number;
  evidencias: number;
  competencias: CompetenciaPortafolio[];
};

export type PortafolioInstructor = {
  id_usuario: number;
  nombre_completo: string;
  tipo_instructor: TipoInstructor;
  trimestres: TrimestrePortafolio[];
};

export type EvidenciaArchivo = {
  id_evidencia: number;
  nombre_archivo: string;
  url: string;
};

export type CompetenciaDetalle = {
  id_competencia: number;
  nombre: string;
  descripcion: string | null;
  trimestre: number;
  fecha_creacion: string;
  fecha_edicion: string | null;
  archivos: EvidenciaArchivo[];
};

export class CoordinadorApiError extends Error {}

// --------------------------------------------------------------------
// Helper interno: fetch autenticado + manejo uniforme de errores
// --------------------------------------------------------------------
async function fetchCoordinador<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new CoordinadorApiError('No hay sesión activa.');
  }

  const respuesta = await fetch(`${API_BASE_URL}/api/coordinador${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 403) {
      throw new CoordinadorApiError(
        datos.detail ?? 'No tienes permisos de coordinador para esta acción.'
      );
    }
    throw new CoordinadorApiError(datos.detail ?? `Error ${respuesta.status} al consultar la API.`);
  }

  return respuesta.json();
}

// --------------------------------------------------------------------
// 1. Dashboard
// --------------------------------------------------------------------
export function obtenerDashboardCoordinador(): Promise<DashboardCoordinador> {
  return fetchCoordinador('/dashboard');
}

// --------------------------------------------------------------------
// 2. Sedes SENA
// --------------------------------------------------------------------
export function obtenerSedes(): Promise<SedeResumen[]> {
  return fetchCoordinador('/sedes');
}

export function obtenerSedeDetalle(idSede: number): Promise<SedeDetalle> {
  return fetchCoordinador(`/sedes/${idSede}`);
}

// --------------------------------------------------------------------
// 3. Instructores por sede
// --------------------------------------------------------------------
export function obtenerInstructoresSede(
  idSede: number,
  tipo?: TipoInstructor
): Promise<InstructorResumen[]> {
  const query = tipo ? `?tipo=${tipo}` : '';
  return fetchCoordinador(`/sedes/${idSede}/instructores${query}`);
}

export function obtenerInstructorDetalle(idInstructor: number): Promise<InstructorDetalle> {
  return fetchCoordinador(`/instructores/${idInstructor}`);
}

// --------------------------------------------------------------------
// 4. Portafolio del instructor (solo lectura para el coordinador)
// --------------------------------------------------------------------
export function obtenerPortafolioInstructor(idInstructor: number): Promise<PortafolioInstructor> {
  return fetchCoordinador(`/instructores/${idInstructor}/portafolio`);
}

export function obtenerCompetenciaDetalle(
  idInstructor: number,
  trimestre: number,
  idCompetencia: number
): Promise<CompetenciaDetalle> {
  return fetchCoordinador(
    `/instructores/${idInstructor}/portafolio/${trimestre}/competencias/${idCompetencia}`
  );
}

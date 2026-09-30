import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/**
 * Cliente para /api/instructor/* (routes/instructor.py). TODOS estos
 * endpoints están protegidos en el backend con require_instructor: si el
 * usuario logueado no tiene rol "instructor", el servidor responde 403 sin
 * importar qué mande este cliente. Este archivo solo arma las peticiones;
 * la seguridad real vive en el backend (ver core/security.py).
 */

// --------------------------------------------------------------------
// Tipos — reflejan exactamente schemas/instructor.py
// --------------------------------------------------------------------
export type FichaResumen = {
  id_ficha: number;
  numero_ficha: string | null;
  nombre_programa: string | null;
  nombre_competencia: string | null;
  trimestre: number | null;
  num_estudiantes: number;
};

export type DashboardInstructor = {
  nombre_programa_principal: string | null;
  descripcion_programa_principal: string | null;
  numero_ficha_principal: string | null;
  trimestre_actual: number | null;
  total_fichas: number;
  total_aprendices: number;
  fichas_recientes: FichaResumen[];
};

export type FichaEnMateria = {
  id_ficha: number;
  numero_ficha: string | null;
  num_estudiantes: number;
};

export type MateriaConFichas = {
  id_competencia: number;
  nombre: string;
  descripcion: string | null;
  fichas: FichaEnMateria[];
};

export type TrimestreConMaterias = {
  trimestre: number;
  materias: MateriaConFichas[];
};

export type Tarea = {
  id_tarea: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  archivo_url: string | null;
  id_ficha: number;
  id_competencia: number;
  fecha_creacion: string;
  total_aprendices: number;
  total_aprobados: number;
  total_en_revision: number;
  total_pendientes: number;
};

export type EstadoEntrega = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';

export type Entrega = {
  id_entrega: number;
  id_aprendiz: number;
  nombre_aprendiz: string;
  estado: EstadoEntrega;
  archivo_url: string | null;
  fecha_entrega: string | null;
  nota: number | null;
  comentario: string | null;
};

export type TareaDetalle = Tarea & {
  numero_ficha: string | null;
  nombre_competencia: string | null;
  entregas: Entrega[];
};

// Portafolio de UN aprendiz: sus materias (competencias) con las
// actividades de cada una y la entrega puntual de ese aprendiz.
export type ActividadPortafolio = {
  id_tarea: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  id_entrega: number | null;
  archivo_url: string | null;
  estado: EstadoEntrega | null;
  nota: number | null;
  comentario: string | null;
  fecha_entrega: string | null;
};

export type CompetenciaPortafolio = {
  id_competencia: number;
  nombre: string;
  actividades: ActividadPortafolio[];
};

export type PortafolioAprendiz = {
  id_ficha: number;
  numero_ficha: string | null;
  id_aprendiz: number;
  nombre_aprendiz: string;
  competencias: CompetenciaPortafolio[];
};

export type PortafolioFicha = {
  id_ficha: number;
  numero_ficha: string | null;
  nombre_programa: string | null;
  nombre_competencia: string | null;
  trimestre: number | null;
  num_aprendices: number;
};

export type AprendizResumen = {
  id_usuario: number;
  nombre_completo: string;
  numero_documento: string;
  estado_portafolio: 'con_portafolio' | 'sin_portafolio';
};

export type NuevoAprendiz = {
  nombre: string;
  apellido?: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  correo_personal: string;
  correo_sena: string;
  contrasena?: string;
  informacion_adicional?: string;
  archivo_url?: string;
};

export type AprendizCreado = {
  id_usuario: number;
  nombre: string;
  apellido: string | null;
  numero_documento: string;
  correo_sena: string;
  contrasena_temporal: string | null;
};

export type NuevaTarea = {
  titulo: string;
  descripcion?: string;
  fecha_limite?: string; // YYYY-MM-DD
  archivo_url?: string;
};

export type Asignacion = {
  id_asignacion: number;
  id_instructor: number;
  id_ficha: number;
  id_competencia: number;
  trimestre: number;
  fecha_creacion: string;
};

export type NuevaAsignacion = {
  id_instructor: number;
  id_ficha: number;
  id_competencia: number;
  trimestre: number;
};

export class InstructorApiError extends Error {}

// --------------------------------------------------------------------
// Helper interno: fetch autenticado + manejo uniforme de errores
// --------------------------------------------------------------------
async function fetchInstructor<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new InstructorApiError('No hay sesión activa.');
  }

  const respuesta = await fetch(`${API_BASE_URL}/api/instructor${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 403) {
      throw new InstructorApiError(
        datos.detail ?? 'No tienes permisos de instructor para esta acción.'
      );
    }
    throw new InstructorApiError(datos.detail ?? `Error ${respuesta.status} al consultar la API.`);
  }

  return respuesta.json();
}

// --------------------------------------------------------------------
// 1. Dashboard
// --------------------------------------------------------------------
export function obtenerDashboardInstructor(): Promise<DashboardInstructor> {
  return fetchInstructor('/dashboard');
}

// --------------------------------------------------------------------
// 2. Árbol de competencias
// --------------------------------------------------------------------
export function obtenerArbolCompetencias(): Promise<TrimestreConMaterias[]> {
  return fetchInstructor('/competencias');
}

// --------------------------------------------------------------------
// 3. Tareas
// --------------------------------------------------------------------
export function obtenerTareas(idFicha: number, idCompetencia: number): Promise<Tarea[]> {
  return fetchInstructor(`/fichas/${idFicha}/competencias/${idCompetencia}/tareas`);
}

export function crearTarea(
  idFicha: number,
  idCompetencia: number,
  data: NuevaTarea
): Promise<Tarea> {
  return fetchInstructor(`/fichas/${idFicha}/competencias/${idCompetencia}/tareas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function obtenerTareaDetalle(idTarea: number): Promise<TareaDetalle> {
  return fetchInstructor(`/tareas/${idTarea}`);
}

/**
 * Actualiza estado y/o calificación de una entrega. Los tres campos son
 * opcionales -- manda solo lo que cambió (el botón "Aprobar" solo manda
 * estado; el formulario de calificar manda nota/comentario, con o sin
 * estado). Refleja schemas/instructor.py::EntregaUpdate.
 */
export function actualizarEntrega(
  idEntrega: number,
  cambios: { estado?: EstadoEntrega; nota?: number; comentario?: string }
): Promise<Entrega> {
  return fetchInstructor(`/entregas/${idEntrega}`, {
    method: 'PUT',
    body: JSON.stringify(cambios),
  });
}

/**
 * Extensión de archivo -> icono/tipo, para mostrar "Word", "PDF" o
 * "Video" junto al link de la evidencia entregada en vez de una URL cruda.
 */
export function tipoDeArchivo(url: string | null): 'pdf' | 'word' | 'video' | 'otro' | null {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
  return 'otro';
}

// --------------------------------------------------------------------
// 4. Portafolios
// --------------------------------------------------------------------
export function obtenerPortafolios(): Promise<PortafolioFicha[]> {
  return fetchInstructor('/portafolios');
}

// --------------------------------------------------------------------
// 5. Aprendices
// --------------------------------------------------------------------
export function obtenerAprendices(idFicha: number): Promise<AprendizResumen[]> {
  return fetchInstructor(`/fichas/${idFicha}/aprendices`);
}

/** Portafolio de un aprendiz puntual: Materia > Actividades > su entrega. */
export function obtenerPortafolioAprendiz(
  idFicha: number,
  idAprendiz: number
): Promise<PortafolioAprendiz> {
  return fetchInstructor(`/fichas/${idFicha}/aprendices/${idAprendiz}/portafolio`);
}

export function crearAprendiz(idFicha: number, data: NuevoAprendiz): Promise<AprendizCreado> {
  return fetchInstructor(`/fichas/${idFicha}/aprendices`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --------------------------------------------------------------------
// 6. Asignaciones (instructor <-> ficha <-> materia <-> trimestre).
//    Esto es lo que de verdad hace que una ficha "le aparezca" a un
//    instructor -- fijar Ficha.id_director (el "director de ficha" que se
//    elige al crear/editar una ficha en Gestión) es otra cosa y NO crea
//    una asignación. Exclusivo de coordinador (el backend lo exige con
//    require_coordinador en routes/instructor.py).
// --------------------------------------------------------------------
export function crearAsignacion(data: NuevaAsignacion): Promise<Asignacion> {
  return fetchInstructor('/asignaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function obtenerAsignaciones(): Promise<Asignacion[]> {
  return fetchInstructor('/asignaciones');
}

// --------------------------------------------------------------------
// 7. Adjuntos — recibe un objeto { uri, name, mimeType } como el que
//    devuelve expo-document-picker y lo sube como multipart/form-data.
// --------------------------------------------------------------------
export async function subirAdjunto(archivo: {
  uri: string;
  name: string;
  mimeType?: string | null;
}): Promise<string> {
  const token = await getToken();
  if (!token) throw new InstructorApiError('No hay sesión activa.');

  const formData = new FormData();
  // React Native/Expo aceptan este objeto "tipo File" directamente en
  // FormData; en web, uri ya viene como blob: URL y esto también funciona
  // porque expo-document-picker normaliza el resultado en ambas plataformas.
  formData.append('archivo', {
    uri: archivo.uri,
    name: archivo.name,
    type: archivo.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);

  const respuesta = await fetch(`${API_BASE_URL}/api/instructor/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new InstructorApiError(datos.detail ?? 'No se pudo subir el archivo.');
  }

  const datos: { url: string } = await respuesta.json();
  return `${API_BASE_URL}${datos.url}`;
}

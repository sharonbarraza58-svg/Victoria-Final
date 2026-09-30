import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/** GET /api/tareas/competencia/{id} — refleja schemas/tarea.py::TareaParaAprendiz */
export type TareaConEntrega = {
  id_tarea: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  archivo_url: string | null;
  id_entrega: number | null;
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  nota: number | null;
  comentario: string | null;
  fecha_entrega: string | null;
};

export async function obtenerTareasDeCompetencia(idCompetencia: number): Promise<TareaConEntrega[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(`${API_BASE_URL}/api/tareas/competencia/${idCompetencia}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las tareas.');
  }

  return respuesta.json();
}

export const ETIQUETA_ESTADO: Record<TareaConEntrega['estado'], string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

/** GET /api/tareas/proximas — refleja schemas/tarea.py::TareaProximaAprendiz */
export type TareaProxima = {
  id_tarea: number;
  titulo: string;
  fecha_limite: string | null;
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  id_competencia: number;
  nombre_competencia: string;
  trimestre: string;
};

export async function obtenerProximasTareas(limite = 5): Promise<TareaProxima[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(`${API_BASE_URL}/api/tareas/proximas?limite=${limite}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las tareas próximas.');
  }

  return respuesta.json();
}

export type ArchivoAdjunto = {
  id_archivo: number;
  nombre_archivo: string;
  url: string;
};

/** GET /api/tareas/{id} — refleja schemas/tarea.py::TareaDetalleParaAprendiz */
export type TareaDetalle = {
  id_tarea: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  fecha_creacion: string;
  nombre_instructor: string | null;
  archivos_referencia: ArchivoAdjunto[];
  id_entrega: number | null;
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  nota: number | null;
  comentario: string | null;
  fecha_entrega: string | null;
  archivos_entrega: ArchivoAdjunto[];
};

export async function obtenerDetalleTarea(idTarea: number): Promise<TareaDetalle> {
  const token = await getToken();
  if (!token) throw new Error('No hay sesión activa.');

  const respuesta = await fetch(`${API_BASE_URL}/api/tareas/${idTarea}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuesta.ok) {
    throw new Error('No se pudo cargar la tarea.');
  }

  return respuesta.json();
}
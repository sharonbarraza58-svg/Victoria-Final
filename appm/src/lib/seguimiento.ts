import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

export type ResumenTrimestre = {
  trimestre: string;
  numero: string;
  competencias: number;
  evidencias: number;
};

export type MateriaSeguimiento = {
  id_competencia: number;
  nombre: string;
  total_archivos: number;
};

export type NotaTarea = {
  id_tarea: number;
  titulo: string;
  descripcion: string | null;
  estado: string;
  nota: number | null;
  comentario: string | null;
  tiene_archivo: boolean;
  fecha: string | null;
};

export type DetalleMateria = {
  id_competencia: number;
  nombre: string;
  trimestre: string;
  numero: string;
  promedio: number | null;
  estado_promedio: string;
  tareas: NotaTarea[];
};

async function obtenerConToken(url: string) {
  const token = await getToken();
  if (!token) return null;
  const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(typeof datos.detail === 'string' ? datos.detail : 'No se pudo cargar el seguimiento.');
  }
  return respuesta.json();
}

export async function obtenerResumenSeguimiento(): Promise<ResumenTrimestre[]> {
  const datos = await obtenerConToken(`${API_BASE_URL}/api/seguimiento/resumen`);
  return datos ?? [];
}

export async function obtenerMateriasSeguimiento(trimestre: string): Promise<MateriaSeguimiento[]> {
  const datos = await obtenerConToken(`${API_BASE_URL}/api/seguimiento/${trimestre}/materias`);
  return datos ?? [];
}

export async function obtenerNotasMateria(
  trimestre: string,
  idCompetencia: number,
): Promise<DetalleMateria | null> {
  return obtenerConToken(`${API_BASE_URL}/api/seguimiento/${trimestre}/materias/${idCompetencia}`);
}
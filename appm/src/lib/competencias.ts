import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/** GET /api/competencias/mis-competencias — refleja schemas/competencia.py::CompetenciaResponse */
export type Competencia = {
  id_competencia: number;
  nombre: string;
  descripcion: string | null;
  trimestre: string;
  fecha_carga: string;
  id_programa: number | null;
  id_instructor: number | null;
  nombre_instructor: string | null;
};

export async function obtenerMisCompetencias(): Promise<Competencia[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(`${API_BASE_URL}/api/competencias/mis-competencias`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las competencias.');
  }

  return respuesta.json();
}

/** Agrupa la lista plana de competencias por trimestre (T1..T4, en ese orden). */
/** Agrupa la lista plana de competencias por trimestre. Siempre devuelve
 * los 4 trimestres (T1..T4), incluso vacíos, para que la pantalla
 * muestre la estructura completa aunque a un trimestre no se le haya
 * asignado ninguna competencia todavía. */
export function agruparPorTrimestre(
  competencias: Competencia[]
): { trimestre: string; competencias: Competencia[] }[] {
  const orden = ['T1', 'T2', 'T3', 'T4'];
  const grupos = new Map<string, Competencia[]>();

  for (const t of orden) {
    grupos.set(t, []);
  }
  for (const c of competencias) {
    const lista = grupos.get(c.trimestre) ?? [];
    lista.push(c);
    grupos.set(c.trimestre, lista);
  }

  return orden.map((t) => ({ trimestre: t, competencias: grupos.get(t)! }));
}

/** "Base de datos" -> "base-de-datos". Sin columna de slug en la BD: se
 * genera igual en el link (index.tsx) y en la búsqueda ([materia].tsx). */
export function slugificar(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
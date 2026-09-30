import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/**
 * CRUD de Competencia -- crear/editar/borrar (POST/PUT/DELETE
 * /api/competencias/), exclusivo de coordinador/instructor. La lectura de
 * solo-vista para el aprendiz vive aparte en lib/competencias.ts (más
 * simple, sin trimestre) -- no se toca ese archivo para no romper esa
 * pantalla.
 */
export type CompetenciaGestion = {
  id_competencia: number;
  nombre: string;
  descripcion: string | null;
  trimestre: string;
  fecha_carga: string;
};

export type CompetenciaInput = {
  nombre: string;
  descripcion?: string;
  trimestre: 'T1' | 'T2' | 'T3' | 'T4';
  fecha_carga: string; // ISO 8601
};

async function authHeaders(json = true): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new Error('Debes iniciar sesión de nuevo.');
  return json
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { Authorization: `Bearer ${token}` };
}

export async function obtenerCompetenciasGestion(): Promise<CompetenciaGestion[]> {
  const r = await fetch(`${API_BASE_URL}/api/competencias/`, { headers: await authHeaders(false) });
  if (!r.ok) throw new Error('No se pudieron cargar las competencias.');
  return r.json();
}

export async function crearCompetencia(data: CompetenciaInput): Promise<CompetenciaGestion> {
  const r = await fetch(`${API_BASE_URL}/api/competencias/`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail ?? 'No se pudo crear la competencia.');
  return d;
}

export async function actualizarCompetencia(id: number, data: CompetenciaInput): Promise<CompetenciaGestion> {
  const r = await fetch(`${API_BASE_URL}/api/competencias/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail ?? 'No se pudo actualizar la competencia.');
  return d;
}

export async function eliminarCompetencia(id: number): Promise<void> {
  const r = await fetch(`${API_BASE_URL}/api/competencias/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  if (!r.ok) throw new Error('No se pudo eliminar la competencia.');
}

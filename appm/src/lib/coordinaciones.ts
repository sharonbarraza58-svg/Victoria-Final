import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/**
 * Refleja schemas/coordinacion.py::CoordinacionResponse -- la
 * "Coordinación académica" (ej. "Coordinación de TIC"), NO confundir con
 * el modelo Sede (sede física del SENA, ver lib/sedes.ts) ni con las
 * pantallas de sedes/instructores de lib/coordinador.ts.
 */
export type Coordinacion = {
  id_coordinacion: number;
  nombre_coordinacion: string;
  descripcion_coordinacion: string;
  area_enfoque: string;
};

export type CoordinacionInput = {
  nombre_coordinacion: string;
  descripcion_coordinacion: string;
  area_enfoque: string;
};

async function authHeaders(json = true): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new Error('Debes iniciar sesión de nuevo.');
  return json
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { Authorization: `Bearer ${token}` };
}

export async function obtenerCoordinaciones(): Promise<Coordinacion[]> {
  const r = await fetch(`${API_BASE_URL}/api/coordinaciones/`, { headers: await authHeaders(false) });
  if (!r.ok) throw new Error('No se pudieron cargar las coordinaciones.');
  return r.json();
}

export async function obtenerCoordinacion(id: number): Promise<Coordinacion> {
  const r = await fetch(`${API_BASE_URL}/api/coordinaciones/${id}`, { headers: await authHeaders(false) });
  if (!r.ok) throw new Error('No se pudo cargar la coordinación.');
  return r.json();
}

export async function crearCoordinacion(data: CoordinacionInput): Promise<Coordinacion> {
  const r = await fetch(`${API_BASE_URL}/api/coordinaciones/`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail ?? 'No se pudo crear la coordinación.');
  return d;
}

export async function actualizarCoordinacion(id: number, data: CoordinacionInput): Promise<Coordinacion> {
  const r = await fetch(`${API_BASE_URL}/api/coordinaciones/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail ?? 'No se pudo actualizar la coordinación.');
  return d;
}

export async function eliminarCoordinacion(id: number): Promise<void> {
  const r = await fetch(`${API_BASE_URL}/api/coordinaciones/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  if (!r.ok) throw new Error('No se pudo eliminar la coordinación.');
}

import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/** Refleja schemas/nota.py::NotaResponse */
export type Nota = {
  id_nota: number;
  titulo: string;
  materia: string | null;
  contenido: string;
  fecha_creacion: string;
  id_usuario: number;
};

export type NotaInput = {
  titulo: string;
  materia?: string;
  contenido: string;
};

async function authHeaders() {
  const token = await getToken();
  if (!token) throw new Error('Debes iniciar sesión de nuevo.');
  return { Authorization: `Bearer ${token}` };
}

export async function obtenerNotas(): Promise<Nota[]> {
  const respuesta = await fetch(`${API_BASE_URL}/api/notas/`, {
    headers: await authHeaders(),
  });
  if (!respuesta.ok) throw new Error('No se pudieron cargar tus notas.');
  return respuesta.json();
}

export async function crearNota(data: NotaInput): Promise<Nota> {
  const respuesta = await fetch(`${API_BASE_URL}/api/notas/`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.detail ?? 'No se pudo guardar la nota.');
  return datos;
}

export async function eliminarNota(idNota: number): Promise<void> {
  const respuesta = await fetch(`${API_BASE_URL}/api/notas/${idNota}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!respuesta.ok) throw new Error('No se pudo eliminar la nota.');
}

import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/** Refleja schemas/usuario.py::UsuarioResponse */
export type Usuario = {
  id_usuario: number;
  nombre: string;
  apellido: string | null;
  id_rol: number;
  estado: string | null;
  fecha_nacimiento: string;
  numero_documento: string;
  tipo_documento: string;
  telefono: string | null;
  correo_personal: string;
  correo_sena: string;
  id_ficha: number | null;
  id_coordinacion: number | null;
  fecha_creacion: string;
};

/** Lo que pide UsuarioCreate — para el alta MANUAL de un aprendiz.
 * id_rol lo fija el propio código (busca el rol "aprendiz" al vuelo). */
export type AprendizManualInput = {
  nombre: string;
  apellido?: string;
  fecha_nacimiento: string; // AAAA-MM-DD
  numero_documento: string;
  tipo_documento: string;
  telefono?: string;
  correo_personal: string;
  correo_sena: string;
  contrasena: string;
  id_ficha: number;
};

async function authHeaders(json = true): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new Error('Debes iniciar sesión de nuevo.');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}
let idRolAprendizCache: number | null = null;

/** Busca dinámicamente el id_rol de "aprendiz" en /api/roles, en vez de
 * asumir un número fijo (el orden de creación de roles puede variar). */
async function obtenerIdRolAprendiz(): Promise<number> {
  if (idRolAprendizCache !== null) return idRolAprendizCache;
  const r = await fetch(`${API_BASE_URL}/api/roles/`, { headers: await authHeaders(false) });
  if (!r.ok) throw new Error('No se pudo determinar el rol de aprendiz.');
  const roles: { id_rol: number; nombre_rol: string }[] = await r.json();
  const rol = roles.find((x) => x.nombre_rol.toLowerCase() === 'aprendiz');
  if (!rol) throw new Error('No existe el rol "aprendiz" en la base de datos.');
  idRolAprendizCache = rol.id_rol;
  return rol.id_rol;
}

export async function obtenerAprendicesDeFicha(idFicha: number): Promise<Usuario[]> {
  const r = await fetch(`${API_BASE_URL}/api/usuarios/`, { headers: await authHeaders(false) });
  if (!r.ok) throw new Error('No se pudieron cargar los aprendices.');
  const todos: Usuario[] = await r.json();
  const idRolAprendiz = await obtenerIdRolAprendiz();
  return todos.filter((u) => u.id_ficha === idFicha && u.id_rol === idRolAprendiz);
}

export async function crearAprendizManual(data: AprendizManualInput): Promise<Usuario> {
  const r = await fetch(`${API_BASE_URL}/api/usuarios/`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ ...data, id_rol: await obtenerIdRolAprendiz(), estado: 'activo' }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail ?? 'No se pudo crear el aprendiz.');
  return d;
}

export type ResultadoCargaMasiva = {
  creados: string[];
  errores: { fila: number; error: string }[];
};

/** Sube un CSV con varios aprendices de una vez — POST /api/usuarios/carga-masiva */
export async function cargarAprendicesDesdeArchivo(
  idFicha: number,
  archivo: { uri: string; name: string; mimeType?: string | null }
): Promise<ResultadoCargaMasiva> {
  const token = await getToken();
  if (!token) throw new Error('Debes iniciar sesión de nuevo.');

  const form = new FormData();
  form.append('id_ficha', String(idFicha));
  form.append('archivo', {
    uri: archivo.uri,
    name: archivo.name,
    type: archivo.mimeType ?? 'text/csv',
  } as unknown as Blob);

  const r = await fetch(`${API_BASE_URL}/api/usuarios/carga-masiva`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail ?? 'No se pudo procesar el archivo.');
  return d;
}

export async function eliminarAprendiz(idUsuario: number): Promise<void> {
  const r = await fetch(`${API_BASE_URL}/api/usuarios/${idUsuario}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  if (!r.ok) throw new Error('No se pudo eliminar el aprendiz.');
}

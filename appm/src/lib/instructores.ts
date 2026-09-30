import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';
import { Usuario } from '@/lib/aprendices';

export type InstructorManualInput = {
  nombre: string;
  apellido?: string;
  fecha_nacimiento: string;
  numero_documento: string;
  tipo_documento: string;
  telefono?: string;
  correo_personal: string;
  correo_sena: string;
  contrasena: string;
  id_coordinacion: number;
};

async function authHeaders(json = true): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new Error('Debes iniciar sesión de nuevo.');
  return json
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { Authorization: `Bearer ${token}` };
}

let idRolInstructorCache: number | null = null;

async function obtenerIdRolInstructor(): Promise<number> {
  if (idRolInstructorCache !== null) return idRolInstructorCache;
  const r = await fetch(`${API_BASE_URL}/api/roles/`, { headers: await authHeaders(false) });
  if (!r.ok) throw new Error('No se pudo determinar el rol de instructor.');
  const roles: { id_rol: number; nombre_rol: string }[] = await r.json();
  const rol = roles.find((x) => x.nombre_rol.toLowerCase() === 'instructor');
  if (!rol) throw new Error('No existe el rol "instructor" en la base de datos.');
  idRolInstructorCache = rol.id_rol;
  return rol.id_rol;
}

export async function obtenerInstructores(): Promise<Usuario[]> {
  const r = await fetch(`${API_BASE_URL}/api/usuarios/`, { headers: await authHeaders(false) });
  if (!r.ok) throw new Error('No se pudieron cargar los instructores.');
  const todos: Usuario[] = await r.json();
  const idRolInstructor = await obtenerIdRolInstructor();
  return todos.filter((u) => u.id_rol === idRolInstructor);
}

export async function crearInstructor(data: InstructorManualInput): Promise<Usuario> {
  const r = await fetch(`${API_BASE_URL}/api/usuarios/`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ ...data, id_rol: await obtenerIdRolInstructor(), estado: 'activo' }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail ?? 'No se pudo crear el instructor.');
  return d;
}

export async function eliminarInstructor(idUsuario: number): Promise<void> {
  const r = await fetch(`${API_BASE_URL}/api/usuarios/${idUsuario}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  if (!r.ok) throw new Error('No se pudo eliminar el instructor.');
}

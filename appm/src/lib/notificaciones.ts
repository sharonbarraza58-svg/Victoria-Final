import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';
import { mensajeDeError } from '@/lib/api-error';

/**
 * Servicio de notificaciones ("novedades") de VICTORIA.
 *
 * El backend YA tenía todo esto listo y probado (backend/routes/notificaciones.py:
 * GET /api/notificaciones/, PUT /api/notificaciones/{id}/leer y
 * DELETE /api/notificaciones/{id}) pero el front nunca lo consumía -- el panel de
 * la campana (components/victoria/panels.tsx) mostraba un arreglo de 3
 * notificaciones de ejemplo, siempre igual, para cualquier usuario. Este
 * archivo es la capa de servicio que faltaba para conectar ese panel con las
 * notificaciones reales de cada usuario (las que ya se disparan solas al
 * crear una tarea o calificar una entrega, según services/notificacion_service.py).
 *
 * No se tocó nada del backend: los 3 endpoints ya existían tal cual se usan
 * aquí.
 */

/** Refleja backend/schemas/notificacion.py::NotificacionResponse */
export type Notificacion = {
  id_notificacion: number;
  titulo_notificacion: string;
  tipo: string;
  mensaje: string | null;
  origen: string;
  estado: string; // 'no_leida' | 'leida' (tal como lo guarda el backend)
  fecha_creacion: string;
};

export class NotificacionesError extends Error {}

/** Sesión vencida o token inválido: quien llama debe cerrar sesión y volver a /login. */
export class SesionExpiradaError extends NotificacionesError {}

async function authHeaders() {
  const token = await getToken();
  if (!token) throw new SesionExpiradaError('Debes iniciar sesión de nuevo.');
  return { Authorization: `Bearer ${token}` };
}

async function verificarSesion(respuesta: Response) {
  if (respuesta.status === 401) {
    throw new SesionExpiradaError('Tu sesión venció. Inicia sesión de nuevo.');
  }
}

export function esNoLeida(n: Notificacion): boolean {
  return n.estado.toLowerCase() !== 'leida';
}

/** GET /api/notificaciones/ — notificaciones del usuario autenticado. */
export async function obtenerNotificaciones(): Promise<Notificacion[]> {
  const respuesta = await fetch(`${API_BASE_URL}/api/notificaciones/`, {
    headers: await authHeaders(),
  });
  await verificarSesion(respuesta);
  if (!respuesta.ok) {
    throw new NotificacionesError('No se pudieron cargar tus notificaciones.');
  }
  return respuesta.json();
}

/** PUT /api/notificaciones/{id}/leer */
export async function marcarNotificacionLeida(idNotificacion: number): Promise<Notificacion> {
  const respuesta = await fetch(`${API_BASE_URL}/api/notificaciones/${idNotificacion}/leer`, {
    method: 'PUT',
    headers: await authHeaders(),
  });
  await verificarSesion(respuesta);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new NotificacionesError(mensajeDeError(datos.detail, 'No se pudo marcar como leída.'));
  }
  return datos;
}

/** DELETE /api/notificaciones/{id} */
export async function eliminarNotificacion(idNotificacion: number): Promise<void> {
  const respuesta = await fetch(`${API_BASE_URL}/api/notificaciones/${idNotificacion}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  await verificarSesion(respuesta);
  if (!respuesta.ok) {
    throw new NotificacionesError('No se pudo eliminar la notificación.');
  }
}

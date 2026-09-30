/**
 * Convierte lo que venga en el campo "detail" de una respuesta de FastAPI
 * en un texto legible para mostrar en pantalla.
 *
 * El bug que esto arregla: cuando el backend rechaza una petición por una
 * validación automática de Pydantic (422 Unprocessable Entity — por
 * ejemplo, una fecha con el mes fuera de 1-12), "detail" NO es un texto,
 * es un ARREGLO de objetos: [{ loc: [...], msg: "...", type: "..." }].
 * Antes, el código hacía `new Error(detail)` directo; JavaScript convierte
 * ese arreglo a texto con su propio toString(), y como cada elemento es un
 * objeto, el resultado literalmente es la palabra "[object Object]" — eso
 * es lo que se veía en pantalla, sin decir nada útil sobre qué campo
 * estaba mal.
 *
 * Esta función SIEMPRE devuelve un string útil, sin importar la forma que
 * traiga "detail" (texto simple, arreglo de Pydantic, o algo inesperado).
 */

// Nombres de campo -> como se llaman en el formulario, para que el
// mensaje diga "la fecha de nacimiento" en vez de "fecha_nacimiento".
const NOMBRES_CAMPO: Record<string, string> = {
  fecha_nacimiento: 'la fecha de nacimiento',
  fecha_limite: 'la fecha límite',
  fecha_inicio: 'la fecha de inicio',
  fecha_fin: 'la fecha de fin',
  fecha_carga: 'la fecha de carga',
  vigencia_contrato: 'la vigencia del contrato',
  correo_personal: 'el correo personal',
  correo_sena: 'el correo SENA',
  numero_documento: 'el número de documento',
  contrasena: 'la contraseña',
  nueva_contrasena: 'la nueva contraseña',
};

function nombreLegibleDeCampo(loc: unknown): string | null {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  const campo = String(loc[loc.length - 1]);
  return NOMBRES_CAMPO[campo] ?? campo;
}

export function mensajeDeError(detail: unknown, fallback: string): string {
  if (!detail) return fallback;

  // Caso normal: el backend mandó HTTPException(detail="texto").
  if (typeof detail === 'string') return detail;

  // Caso validación automática de Pydantic (422): detail es un arreglo.
  if (Array.isArray(detail)) {
    const mensajes = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const campo = nombreLegibleDeCampo((item as any).loc);
          const msg = (item as any).msg ?? 'valor inválido';
          return campo ? `${campo}: ${msg}` : String(msg);
        }
        return null;
      })
      .filter(Boolean);
    return mensajes.length > 0 ? mensajes.join(' · ') : fallback;
  }

  // Cualquier otra forma inesperada: nunca mostrar "[object Object]".
  if (typeof detail === 'object') {
    try {
      const texto = JSON.stringify(detail);
      return texto && texto !== '{}' ? texto : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

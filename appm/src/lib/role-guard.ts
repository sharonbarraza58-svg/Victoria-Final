import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { obtenerPerfil, type Perfil } from '@/lib/auth';

/**
 * Guardia de rol para el FRONT. Esto es un complemento de la seguridad
 * real (que vive en el backend, en require_instructor -- ver
 * core/security.py): aunque alguien manipule la app o navegue directo a
 * una URL de instructor, la API igual rechaza con 403 cualquier llamada
 * que no venga de un token con rol instructor. Este hook solo evita que
 * un usuario con otro rol SIQUIERA VEA la pantalla — mejor experiencia,
 * no el candado real.
 *
 * - undefined: todavía cargando el perfil.
 * - null: no autorizado (ya se disparó el redirect).
 * - Perfil: autorizado, listo para pintar la pantalla.
 */
export function useRoleGuard(rolesPermitidos: string[], redirectHref = '/victoria/dashboard') {
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const permitidos = rolesPermitidos.map((r) => r.toLowerCase());

  const cargar = useCallback(() => {
    let cancelado = false;
    obtenerPerfil().then((datos) => {
      if (cancelado) return;
      if (!datos) {
        router.replace('/login');
        return;
      }
      const rol = (datos.nombre_rol ?? '').toLowerCase();
      if (!permitidos.includes(rol)) {
        router.replace(redirectHref as never);
        setPerfil(null);
        return;
      }
      setPerfil(datos);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectHref, rolesPermitidos.join(',')]);

  useEffect(cargar, [cargar]);
  useFocusEffect(cargar);

  return perfil;
}

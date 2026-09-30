import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * "/portafolio" sin trimestre no es una vista en sí misma: redirige al
 * trimestre 1, igual que victoria/portafolio/index.tsx hace para el
 * propio instructor. El detalle del instructor (con el botón "Ir a
 * Portafolio" que apunta acá) vive en ../index.tsx.
 */
export default function CoordinadorPortafolioIndex() {
  const { idInstructor } = useLocalSearchParams<{ idInstructor: string }>();
  return (
    <Redirect href={`/victoria/coordinador/instructores/${idInstructor}/portafolio/1` as never} />
  );
}

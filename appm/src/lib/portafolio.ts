import { API_BASE_URL } from '@/lib/api-config';
import { getToken } from '@/lib/auth';

/** GET /api/portafolio/carpetas — refleja schemas/portafolio.py::CarpetaPortafolio */
export type Carpeta = {
  categoria: string;
  nombre: string;
  total_archivos: number;
  ultima_modificacion: string | null;
};

/** GET /api/portafolio/carpetas/{categoria}/subcarpetas — refleja schemas/portafolio.py::SubcarpetaPortafolio */
export type Subcarpeta = {
  subcarpeta: string;
  nombre: string;
  total_archivos: number;
  ultima_modificacion: string | null;
};

/** Carpeta creada por el aprendiz dentro de un trimestre — refleja schemas/portafolio.py::CarpetaAprendizResponse */
export type CarpetaAprendiz = {
  id_carpeta: number;
  nombre: string;
  total_archivos: number;
  ultima_modificacion: string;
};

/** refleja schemas/portafolio.py::ArchivoPortafolioResponse */
export type ArchivoPortafolio = {
  id_archivo: number;
  categoria: string;
  subcarpeta: string | null;
  id_carpeta: number | null;
  nombre_archivo: string;
  url: string;
  fecha_subida: string;
};

export async function obtenerCarpetas(): Promise<Carpeta[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(`${API_BASE_URL}/api/portafolio/carpetas`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las carpetas del portafolio.');
  }

  return respuesta.json();
}

export async function obtenerSubcarpetas(categoria: string): Promise<Subcarpeta[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(`${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las subcarpetas.');
  }

  return respuesta.json();
}

export async function obtenerArchivosDeSubcarpeta(
  categoria: string,
  subcarpeta: string,
): Promise<ArchivoPortafolio[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(
    `${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas/${subcarpeta}/archivos`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los archivos de esta subcarpeta.');
  }

  return respuesta.json();
}

export async function subirArchivoASubcarpeta(
  categoria: string,
  subcarpeta: string,
  archivo: File,
): Promise<ArchivoPortafolio> {
  const token = await getToken();
  if (!token) throw new Error('No hay sesión activa.');

  const formData = new FormData();
  formData.append('archivo', archivo);

  const respuesta = await fetch(
    `${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas/${subcarpeta}/archivos`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData },
  );

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(datos.detail ?? 'No se pudo subir el archivo.');
  }

  return respuesta.json();
}

export async function obtenerCarpetasDeSubcarpeta(
  categoria: string,
  subcarpeta: string,
): Promise<CarpetaAprendiz[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(
    `${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas/${subcarpeta}/carpetas`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las carpetas de este trimestre.');
  }

  return respuesta.json();
}

export async function crearCarpetaEnSubcarpeta(
  categoria: string,
  subcarpeta: string,
  nombre: string,
): Promise<CarpetaAprendiz> {
  const token = await getToken();
  if (!token) throw new Error('No hay sesión activa.');

  const respuesta = await fetch(
    `${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas/${subcarpeta}/carpetas`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre }),
    },
  );

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(typeof datos.detail === 'string' ? datos.detail : 'No se pudo crear la carpeta.');
  }

  return respuesta.json();
}

export async function obtenerDetalleCarpeta(
  categoria: string,
  subcarpeta: string,
  idCarpeta: number,
): Promise<CarpetaAprendiz> {
  const token = await getToken();
  if (!token) throw new Error('No hay sesión activa.');

  const respuesta = await fetch(
    `${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas/${subcarpeta}/carpetas/${idCarpeta}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!respuesta.ok) {
    throw new Error('No se pudo cargar esta carpeta.');
  }

  return respuesta.json();
}

export async function obtenerArchivosDeCarpeta(
  categoria: string,
  subcarpeta: string,
  idCarpeta: number,
): Promise<ArchivoPortafolio[]> {
  const token = await getToken();
  if (!token) return [];

  const respuesta = await fetch(
    `${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas/${subcarpeta}/carpetas/${idCarpeta}/archivos`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los archivos de esta carpeta.');
  }

  return respuesta.json();
}

export async function subirArchivoACarpeta(
  categoria: string,
  subcarpeta: string,
  idCarpeta: number,
  archivo: File,
): Promise<ArchivoPortafolio> {
  const token = await getToken();
  if (!token) throw new Error('No hay sesión activa.');

  const formData = new FormData();
  formData.append('archivo', archivo);

  const respuesta = await fetch(
    `${API_BASE_URL}/api/portafolio/carpetas/${categoria}/subcarpetas/${subcarpeta}/carpetas/${idCarpeta}/archivos`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData },
  );

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(datos.detail ?? 'No se pudo subir el archivo.');
  }

  return respuesta.json();
}
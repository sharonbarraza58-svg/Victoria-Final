/**
 * Datos de ejemplo migrados desde victoriadiseño/app.py (los diccionarios
 * PORTAFOLIO, SEGUIMIENTO, NOTAS, COMPETENCIAS y TAREAS que Flask pasaba
 * a las plantillas Jinja2). Aquí viven como constantes tipadas para que
 * las pantallas de Expo Router tengan la misma información de ejemplo.
 */

export type Materia = {
  nombre: string;
  archivos: number;
  slug: string;
};

export type Trimestre = {
  numero: number;
  evidencias: number;
  competencias: number;
  materias: Materia[];
};

export const PORTAFOLIO: Record<string, Trimestre> = {
  T1: {
    numero: 1,
    evidencias: 1,
    competencias: 4,
    materias: [
      { nombre: 'Base de datos', archivos: 0, slug: 'base-de-datos' },
      { nombre: 'Python', archivos: 1, slug: 'python' },
      { nombre: 'Fast API', archivos: 0, slug: 'fast-api' },
    ],
  },
  T2: {
    numero: 2,
    evidencias: 2,
    competencias: 2,
    materias: [
      { nombre: 'Base de datos', archivos: 1, slug: 'base-de-datos' },
      { nombre: 'Python', archivos: 3, slug: 'python' },
    ],
  },
  T3: {
    numero: 3,
    evidencias: 3,
    competencias: 5,
    materias: [
      { nombre: 'Base de datos', archivos: 3, slug: 'base-de-datos' },
      { nombre: 'Python', archivos: 1, slug: 'python' },
      { nombre: 'Fast API', archivos: 3, slug: 'fast-api' },
    ],
  },
  T4: {
    numero: 4,
    evidencias: 1,
    competencias: 2,
    materias: [
      { nombre: 'Base de datos', archivos: 0, slug: 'base-de-datos' },
      { nombre: 'Python', archivos: 1, slug: 'python' },
    ],
  },
};

// Seguimiento reutiliza la misma info de trimestres/materias que el Portafolio.
export const SEGUIMIENTO: Record<string, Trimestre> = PORTAFOLIO;

export type Nota = {
  actividad: string;
  descripcion: string;
  fecha: string;
  nota: string;
  estado: string;
};

export const NOTAS: Record<string, Nota[]> = {
  'T1:base-de-datos': [
    {
      actividad: 'Modelo Relacional',
      descripcion: 'Diseñar el modelo entidad-relación para un sistema de gestión de biblioteca.',
      fecha: '29 de mayo, 2026',
      nota: '4.5',
      estado: 'Aprobado',
    },
    {
      actividad: 'Consultas SQL',
      descripcion: 'Evaluación práctica de consultas SQL sobre la base de datos de biblioteca.',
      fecha: '30 de mayo, 2026',
      nota: '—',
      estado: 'Pendiente',
    },
  ],
  'T1:python': [
    {
      actividad: 'Estructuras de control',
      descripcion: 'Ejercicios prácticos usando condicionales y ciclos en Python.',
      fecha: '12 de junio, 2026',
      nota: '4.8',
      estado: 'Aprobado',
    },
  ],
};

export type MateriaCompetencia = {
  nombre: string;
  profe: string;
  slug: string;
  icono: string;
};

export type GrupoCompetencia = {
  numero: number;
  materias: MateriaCompetencia[];
};

export const COMPETENCIAS: Record<string, GrupoCompetencia> = {
  T1: {
    numero: 1,
    materias: [
      { nombre: 'Base de datos', profe: 'Sandra profe', slug: 'base-de-datos', icono: 'grid' },
      { nombre: 'Python', profe: 'Uldarico profe', slug: 'python', icono: 'grid' },
    ],
  },
  T2: {
    numero: 2,
    materias: [
      { nombre: 'Base de datos', profe: 'Sandra profe', slug: 'base-de-datos', icono: 'grid' },
      { nombre: 'Python', profe: 'Uldarico profe', slug: 'python', icono: 'grid' },
    ],
  },
  T3: {
    numero: 3,
    materias: [
      { nombre: 'Base de datos', profe: 'Sandra profe', slug: 'base-de-datos', icono: 'grid' },
      { nombre: 'Fast API', profe: 'Uldarico profe', slug: 'fast-api', icono: 'grid' },
    ],
  },
  T4: {
    numero: 4,
    materias: [
      { nombre: 'Base de datos', profe: 'Sandra profe', slug: 'base-de-datos', icono: 'grid' },
      { nombre: 'Python', profe: 'Uldarico profe', slug: 'python', icono: 'grid' },
      { nombre: 'Fast API', profe: 'Uldarico profe', slug: 'fast-api', icono: 'grid' },
      {
        nombre: 'Proyecto integrador',
        profe: 'Sandra profe',
        slug: 'proyecto-integrador',
        icono: 'grid',
      },
    ],
  },
};

export type Tarea = {
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado: string;
  sub_estado: string;
};

export const TAREAS: Record<string, Tarea[]> = {
  'T1:base-de-datos': [
    {
      tipo: 'Proyecto',
      titulo: 'Modelo Relacional',
      descripcion: 'Diseñar el modelo entidad-relación para un sistema de gestión de biblioteca.',
      fecha: '29 de mayo, 2026',
      estado: 'Asignada',
      sub_estado: 'Pendiente',
    },
    {
      tipo: 'Laboratorio',
      titulo: 'Consultas SQL',
      descripcion: 'Diseñar el modelo entidad-relación para un sistema de gestión de biblioteca.',
      fecha: '30 de mayo, 2026',
      estado: 'Asignada',
      sub_estado: 'Pendiente',
    },
    {
      tipo: 'Atividad inicial',
      titulo: 'Postgres',
      descripcion: 'Diseñar el modelo entidad-relación para un sistema de gestión de biblioteca.',
      fecha: '4 de julio, 2026',
      estado: 'Asignada',
      sub_estado: 'Pendiente',
    },
  ],
  'T1:python': [
    {
      tipo: 'Laboratorio',
      titulo: 'Estructuras de control',
      descripcion: 'Resolver ejercicios prácticos usando condicionales y ciclos en Python.',
      fecha: '12 de junio, 2026',
      estado: 'Asignada',
      sub_estado: 'Pendiente',
    },
  ],
};


export const PERFIL = {
  nombre: 'Aslhi Valentina Castañeda Zabala',
  documento: 'T.I. 1016954827',
  correoInstitucional: 'aslhi.casta@soy.sena.edu.co',
  correoPersonal: 'aslhicast123@gmail.com',
};

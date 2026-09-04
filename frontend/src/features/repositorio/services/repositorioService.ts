import type { DocumentoDigital, AreaCurso, Institucion } from '../types/Repositorio';
import { apiFetch } from '../../../config/api';

const API_BASE = 'http://localhost:8080/api';

export const repositorioService = {
  async getDocumentos(): Promise<DocumentoDigital[]> {
    const res = await apiFetch(`${API_BASE}/documentos-digital`);
    if (!res.ok) throw new Error('Error al obtener documentos');
    return res.json();
  },

  async getAreas(): Promise<AreaCurso[]> {
    const res = await apiFetch(`${API_BASE}/areas-curso`);
    if (!res.ok) throw new Error('Error al obtener áreas/cátedras');
    return res.json();
  },

  async getInstituciones(): Promise<Institucion[]> {
    const res = await apiFetch(`${API_BASE}/instituciones`);
    if (!res.ok) throw new Error('Error al obtener instituciones');
    return res.json();
  },

  async crearInstitucion(nombreInstitucion: string, tipoInstitucion?: string): Promise<Institucion> {
    const res = await apiFetch(`${API_BASE}/instituciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreInstitucion, tipoInstitucion }),
    });
    if (!res.ok) throw new Error('Error al crear institución');
    return res.json();
  },

  async crearArea(nombreArea: string, idInstitucion: number): Promise<AreaCurso> {
    const res = await apiFetch(`${API_BASE}/areas-curso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreArea, institucion: { idInstitucion } }),
    });
    if (!res.ok) throw new Error('Error al crear cátedra/área');
    return res.json();
  },

  async subirDocumento(formData: FormData): Promise<DocumentoDigital> {
    const res = await apiFetch(`${API_BASE}/documentos-digital`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Error al subir el archivo digital');
    return res.json();
  },

  async eliminarDocumento(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/documentos-digital/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar el documento');
  },

  getUrlArchivo: (nombreArchivo?: string) => {
  if (!nombreArchivo) return '';
  return `http://localhost:8080/api/documentos-digital/archivo/${encodeURIComponent(nombreArchivo)}`;
}
};
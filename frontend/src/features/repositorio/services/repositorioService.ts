import type { DocumentoDigital, AreaCurso, Institucion } from '../types/Repositorio';
import { API_BASE_URL, apiFetch } from '../../../config/api';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const repositorioService = {
  async getDocumentos(): Promise<DocumentoDigital[]> {
    const res = await apiFetch(`${API_BASE_URL}/documentos-digital`);
    if (!res.ok) throw new Error('Error al obtener documentos');
    return res.json();
  },

  async getAreas(): Promise<AreaCurso[]> {
    const res = await apiFetch(`${API_BASE_URL}/areas-curso`);
    if (!res.ok) throw new Error('Error al obtener áreas/cátedras');
    return res.json();
  },

  async getInstituciones(): Promise<Institucion[]> {
    const res = await apiFetch(`${API_BASE_URL}/instituciones`);
    if (!res.ok) throw new Error('Error al obtener instituciones');
    return res.json();
  },

  

  async crearInstitucion(nombreInstitucion: string, tipoInstitucion?: string): Promise<Institucion> {
    const res = await apiFetch(`${API_BASE_URL}/instituciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreInstitucion, tipoInstitucion }),
    });
    if (!res.ok) throw new Error('Error al crear institución');
    return res.json();
  },

  async crearArea(nombreArea: string, idInstitucion: number): Promise<AreaCurso> {
    const res = await apiFetch(`${API_BASE_URL}/areas-curso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreArea, institucion: { idInstitucion } }),
    });
    if (!res.ok) throw new Error('Error al crear cátedra/área');
    return res.json();
  },

  async subirDocumento(formData: FormData): Promise<DocumentoDigital> {
    const res = await apiFetch(`${API_BASE_URL}/documentos-digital`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Error al subir el archivo digital');
    return res.json();
  },

  async eliminarDocumento(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/documentos-digital/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar el documento');
  },

  async obtenerArchivoBlob(nombreArchivoLocal: string): Promise<Blob> {
    const response = await apiFetch(`${API_BASE_URL}/documentos-digital/archivo/${encodeURIComponent(nombreArchivoLocal)}`);
    if (!response.ok) throw new Error('No se pudo obtener el archivo');
    return response.blob();
  },

  async renderizarPaginaPdf(
    nombreArchivoLocal: string,
    canvas: HTMLCanvasElement,
    container: HTMLDivElement
  ): Promise<void> {
    const response = await apiFetch(`${API_BASE_URL}/documentos-digital/archivo/${encodeURIComponent(nombreArchivoLocal)}`);
    if (!response.ok) throw new Error('No se pudo obtener el PDF');
    const arrayBuffer = await response.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const context = canvas.getContext('2d');
    if (!context) return;

    const containerWidth = container.clientWidth || 300;
    const containerHeight = container.clientHeight || 400;
    const unscaledViewport = page.getViewport({ scale: 1 });

    const scaleX = containerWidth / unscaledViewport.width;
    const scaleY = containerHeight / unscaledViewport.height;
    const scale = Math.min(scaleX, scaleY);

    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport, canvas }).promise;
  }
};
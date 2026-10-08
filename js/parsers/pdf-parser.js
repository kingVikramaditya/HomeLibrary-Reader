/**
 * HomeLibrary - PDF Parser & Renderer
 * Handles PDF rendering with Mozilla PDF.js
 */

const PdfParser = {
  initialized: false,
  currentDoc: null,

  init() {
    if (this.initialized) return;
    if (window.pdfjsLib) {
      const base = window.location.origin ? window.location.origin + '/' : '';
      pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'assets/libs/pdf.worker.min.js';
      this.initialized = true;
    }
  },

  async loadDocument(source) {
    this.init();
    console.log('[PdfParser] loadDocument starting...');
    const cMapOptions = {
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/standard_fonts/'
    };

    let loadingTask;
    try {
      if (typeof source === 'string') {
        loadingTask = pdfjsLib.getDocument({ url: source, ...cMapOptions });
      } else if (source instanceof Blob) {
        const buffer = await source.arrayBuffer();
        console.log('[PdfParser] Blob buffer loaded, length:', buffer.byteLength);
        loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer), ...cMapOptions });
      } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
        const data = source instanceof Uint8Array ? source.slice(0) : new Uint8Array(source).slice(0);
        loadingTask = pdfjsLib.getDocument({ data: data, ...cMapOptions });
      } else if (source && source.url) {
        loadingTask = pdfjsLib.getDocument({ url: source.url, ...cMapOptions });
      } else {
        throw new Error('Invalid PDF source format');
      }

      this.currentDoc = await loadingTask.promise;
      console.log('[PdfParser] Document promise resolved, numPages:', this.currentDoc.numPages);
      return this.currentDoc;
    } catch (err) {
      console.error('[PdfParser] loadDocument failed:', err);
      throw err;
    }
  },

  async getMetadata(doc) {
    try {
      const meta = await doc.getMetadata();
      const numPages = doc.numPages;
      const info = meta.info || {};
      return {
        title: info.Title || 'Untitled PDF',
        author: info.Author || 'Unknown Author',
        creator: info.Creator || '',
        numPages: numPages
      };
    } catch (e) {
      return {
        title: 'PDF Document',
        author: 'Unknown Author',
        numPages: doc.numPages || 1
      };
    }
  },

  async renderPageToCanvas(doc, pageNum, canvas, options = 800) {
    const page = await doc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    let scale = 1.0;
    const zoom = (typeof options === 'object' && options.zoom) ? options.zoom : 1.0;
    const fitMode = (typeof options === 'object' && options.fitMode) ? options.fitMode : (typeof options === 'number' ? 'width' : 'page');

    if (typeof options === 'number') {
      scale = (options / unscaledViewport.width);
    } else if (fitMode === 'page' && options.maxWidth && options.maxHeight) {
      const scaleW = (options.maxWidth - 20) / unscaledViewport.width;
      const scaleH = (options.maxHeight - 20) / unscaledViewport.height;
      scale = Math.min(scaleW, scaleH) * zoom;
    } else if (fitMode === 'width' && options.maxWidth) {
      scale = ((options.maxWidth - 24) / unscaledViewport.width) * zoom;
    } else if (options && options.targetWidth) {
      scale = (options.targetWidth / unscaledViewport.width) * zoom;
    } else {
      scale = 1.0 * zoom;
    }

    // Clamp scale to prevent rendering issues
    scale = Math.max(0.2, Math.min(4.0, scale));

    const viewport = page.getViewport({ scale });
    const outputScale = Math.min(2.0, window.devicePixelRatio || 1);

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    await page.render(renderContext).promise;
    return canvas;
  },

  async extractPageText(doc, pageNum) {
    try {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      return content.items.map(item => item.str).join(' ');
    } catch (e) {
      console.warn('[PdfParser] extractPageText failed for page', pageNum, e);
      return '';
    }
  },

  async generateThumbnail(source) {
    try {
      const doc = await this.loadDocument(source);
      const canvas = document.createElement('canvas');
      await this.renderPageToCanvas(doc, 1, canvas, 200);
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('PDF thumbnail generation failed:', e);
      return null;
    }
  },

  async extractChapters(doc) {
    console.log('[PdfParser] extractChapters starting...');
    try {
      const outline = await Promise.race([
        doc.getOutline(),
        new Promise(resolve => setTimeout(() => resolve(null), 1500))
      ]);
      console.log('[PdfParser] outline result:', outline ? outline.length : 'none');
      if (outline && outline.length > 0) {
        const chapters = [];
        for (const item of outline) {
          let dest = item.dest;
          let pageIndex = 1;
          if (typeof dest === 'string') {
            dest = await doc.getDestination(dest);
          }
          if (Array.isArray(dest)) {
            const ref = dest[0];
            pageIndex = (await doc.getPageIndex(ref)) + 1;
          }
          chapters.push({
            title: item.title,
            page: pageIndex
          });
        }
        return chapters;
      }
    } catch (e) {
      console.warn('[PdfParser] Outline retrieval failed:', e);
    }
    // Fallback: create sections every 10 pages
    const numPages = doc.numPages || 1;
    const chapters = [];
    for (let p = 1; p <= numPages; p += 10) {
      chapters.push({
        title: `Pages ${p} - ${Math.min(p + 9, numPages)}`,
        page: p
      });
    }
    console.log('[PdfParser] Generated fallback chapters count:', chapters.length);
    return chapters;
  }
};

/**
 * HomeLibrary - Internet Archive Book Importer & OCR Engine
 * Replicates the Python Internet Archive Book Importer:
 * - URL identifier extraction
 * - Metadata fetching
 * - Smart detection of best PDF, best DjVu XML OCR, and other formats
 * - Chunked stream downloading with live progress tracking
 * - DjVu XML page-by-page OCR extraction & Unicode NFC normalization
 * - Word (.docx) generation with Nirmala UI font & page scan breaks
 * - Clean TXT and JSON exports
 * - Offline backend storage in "Internet Archive Books/{title}" and IndexedDB
 * - Automatic addition of PDF to the main dashboard shelves!
 */

const OCR_STORE_NAME = 'ocr_books';

const ArchiveImporter = {
  currentTask: null,

  extractIdentifier(url) {
    if (!url) return null;
    const cleanUrl = url.trim();

    // Check if user entered direct identifier
    if (!cleanUrl.includes('/') && !cleanUrl.includes('.')) {
      return cleanUrl;
    }

    try {
      const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
      const parts = urlObj.pathname.split('/').filter(p => p.length > 0);

      if (parts.includes('details')) {
        return parts[parts.indexOf('details') + 1] || null;
      }
      if (parts.includes('download')) {
        return parts[parts.indexOf('download') + 1] || null;
      }
      if (parts.includes('stream')) {
        return parts[parts.indexOf('stream') + 1] || null;
      }
      // If path is just /id
      if (parts.length === 1) {
        return parts[0];
      }
    } catch (e) {
      // Regex fallback
      const match = cleanUrl.match(/archive\.org\/(?:details|download|stream)\/([^\/\?#]+)/);
      if (match) return match[1];
    }
    return null;
  },

  async fetchMetadata(identifier) {
    const localEndpoint = `/api/archive/metadata?id=${encodeURIComponent(identifier)}`;
    const remoteEndpoint = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;

    let data;
    try {
      const resp = await fetch(localEndpoint);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = await resp.json();
    } catch (localErr) {
      console.warn('Local API proxy unavailable, trying direct archive.org metadata...', localErr);
      const resp = await fetch(remoteEndpoint);
      if (!resp.ok) throw new Error(`Could not fetch metadata from Internet Archive (HTTP ${resp.status})`);
      data = await resp.json();
    }

    const meta = data.metadata || {};
    let author = meta.creator || '';
    if (Array.isArray(author)) author = author.join(', ');

    const title = meta.title || identifier;
    const files = data.files || [];

    const detected = this.findFiles(files);

    return {
      identifier,
      title,
      author,
      description: meta.description || 'No description provided.',
      date: meta.date || meta.year || '',
      publisher: meta.publisher || '',
      imagecount: meta.imagecount || null,
      coverUrl: `https://archive.org/services/img/${identifier}`,
      detectedFiles: detected,
      rawFiles: files,
      rawMetadata: meta
    };
  },

  findFiles(files) {
    let ocr = null;
    let pdf = null;
    let epub = null;
    let txt = null;

    for (const f of files) {
      const name = f.name || '';
      // Best OCR: _djvu.xml
      if (name.endsWith('_djvu.xml')) {
        ocr = f;
      }
      // Best PDF: _text.pdf
      if (name.endsWith('_text.pdf')) {
        pdf = f;
      }
      if (name.endsWith('.epub') && !epub) {
        epub = f;
      }
      if (name.endsWith('_djvu.txt') || name.endsWith('_text.txt')) {
        txt = f;
      }
    }

    // Fallback PDF
    if (!pdf) {
      for (const f of files) {
        if ((f.name || '').endsWith('.pdf')) {
          pdf = f;
          break;
        }
      }
    }

    // Fallback OCR XML
    if (!ocr) {
      for (const f of files) {
        if ((f.name || '').endsWith('.xml') && (f.name || '').toLowerCase().includes('djvu')) {
          ocr = f;
          break;
        }
      }
    }

    return { ocr, pdf, epub, txt };
  },

  async downloadWithProgress(identifier, filename, onProgress) {
    const localUrl = `/api/archive/download?id=${encodeURIComponent(identifier)}&file=${encodeURIComponent(filename)}`;
    const remoteUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(filename)}`;

    let response;
    try {
      response = await fetch(localUrl);
      if (!response.ok) throw new Error(`Proxy error ${response.status}`);
    } catch (e) {
      console.warn('Proxy download failed, trying direct archive.org download...', e);
      response = await fetch(remoteUrl);
      if (!response.ok) throw new Error(`Direct download failed: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body.getReader();
    const chunks = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedBytes += value.length;

      if (onProgress) {
        const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0;
        onProgress({
          loaded: receivedBytes,
          total: totalBytes,
          percent: percent
        });
      }
    }

    const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
    return blob;
  },

  cleanText(text) {
    if (!text) return '';
    let t = text.normalize('NFC');
    t = t.replace(/\n/g, ' ');
    t = t.replace(/\s+/g, ' ');
    return t.trim();
  },

  parseDjVuXml(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const pages = [];
    const objects = xmlDoc.querySelectorAll('OBJECT');

    objects.forEach((pageObj, idx) => {
      const lines = [];
      const lineEls = pageObj.querySelectorAll('LINE');

      lineEls.forEach(line => {
        const wordEls = line.querySelectorAll('WORD');
        const words = [];
        wordEls.forEach(w => words.push(w.textContent));
        if (words.length > 0) {
          lines.push(words.join(' '));
        }
      });

      const rawText = lines.join('\n');
      const cleaned = this.cleanText(rawText);

      if (cleaned.length > 5) {
        pages.push({
          page: idx + 1,
          text: cleaned
        });
      }
    });

    return pages;
  },

  generateTxt(pages) {
    let txt = '';
    for (const page of pages) {
      txt += `\n\n===== PAGE ${page.page} =====\n\n`;
      txt += page.text;
    }
    return txt.trim();
  },

  generateJson(pages) {
    return JSON.stringify(pages, null, 2);
  },

  async startImport(options, callbacks) {
    const { identifier, metadata, options: selectedOptions } = options;
    const { onStep, onProgress, onError, onSuccess } = callbacks;

    try {
      const cleanTitle = metadata.title.replace(/[^\w\s-]/g, '').trim() || identifier;
      const detected = metadata.detectedFiles;

      let pdfBlob = null;
      let ocrPages = [];
      let txtContent = '';
      let jsonContent = '';
      let docxBlob = null;
      let docxBase64 = null;

      // 1. Download PDF if selected & available
      if (selectedOptions.downloadPdf && detected.pdf) {
        onStep('Downloading PDF Document...', 20);
        pdfBlob = await this.downloadWithProgress(identifier, detected.pdf.name, (p) => {
          onProgress(`Downloading PDF: ${(p.loaded / 1024 / 1024).toFixed(1)} MB / ${(p.total / 1024 / 1024).toFixed(1)} MB (${p.percent}%)`, p.percent);
        });
      }

      // 2. Download OCR DjVu XML if selected & available
      if (selectedOptions.processOcr && detected.ocr) {
        onStep('Downloading DjVu OCR XML...', 50);
        const xmlBlob = await this.downloadWithProgress(identifier, detected.ocr.name, (p) => {
          onProgress(`Downloading OCR XML: ${(p.loaded / 1024 / 1024).toFixed(1)} MB / ${(p.total / 1024 / 1024).toFixed(1)} MB (${p.percent}%)`, p.percent);
        });

        onStep('Extracting & Cleaning OCR Pages (Unicode NFC)...', 70);
        const xmlText = await xmlBlob.text();
        ocrPages = this.parseDjVuXml(xmlText);
        console.log(`[ArchiveImporter] Extracted ${ocrPages.length} pages from DjVu XML.`);

        // 3. Generate Formats
        if (ocrPages.length > 0) {
          onStep('Generating Clean TXT and JSON exports...', 80);
          txtContent = this.generateTxt(ocrPages);
          jsonContent = this.generateJson(ocrPages);

          if (selectedOptions.generateDocx) {
            onStep('Building Microsoft Word DOCX (Nirmala UI)...', 85);
            docxBlob = await DocxGenerator.createDocument(ocrPages, metadata.title, 'Nirmala UI');

            // Convert to base64 for backend saving
            const reader = new FileReader();
            docxBase64 = await new Promise(resolve => {
              reader.onloadend = () => {
                const b64 = reader.result.split(',')[1];
                resolve(b64);
              };
              reader.readAsDataURL(docxBlob);
            });
          }
        }
      }

      // 4. Save to Backend Filesystem "Internet Archive Books/{title}"
      onStep('Saving to offline storage folders & database...', 92);
      try {
        await fetch('/api/archive/save_extracted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            metadata: metadata.rawMetadata,
            txtContent: txtContent,
            jsonContent: jsonContent,
            docxBase64: docxBase64
          })
        });
        console.log('[ArchiveImporter] Saved to local filesystem folders.');
      } catch (fsErr) {
        console.warn('[ArchiveImporter] Backend filesystem save skipped/failed:', fsErr);
      }

      // 5. Add PDF to Main Dashboard Library
      let libraryBook = null;
      if (pdfBlob) {
        onStep('Adding PDF to your main bookshelf...', 96);
        const bookId = 'ia_pdf_' + identifier + '_' + Date.now();
        libraryBook = {
          id: bookId,
          title: metadata.title,
          author: metadata.author || 'Internet Archive',
          cover: metadata.coverUrl,
          rating: 5,
          reviewsCount: 1,
          genre: 'Archive Literature',
          pages: metadata.imagecount ? parseInt(metadata.imagecount, 10) : 100,
          format: 'PDF',
          language: metadata.rawMetadata.language || 'English',
          published: metadata.date || 'Historic',
          readingTime: '6h',
          shelf: 'imported',
          progress: 0,
          currentPage: 1,
          isImported: true,
          fileBlob: pdfBlob,
          chapters: []
        };

        // Render Page 1 thumbnail if possible
        try {
          const doc = await PdfParser.loadDocument(pdfBlob);
          const canvas = document.createElement('canvas');
          await PdfParser.renderPageToCanvas(doc, 1, canvas, 200);
          libraryBook.cover = canvas.toDataURL('image/png');
          libraryBook.chapters = await PdfParser.extractChapters(doc);
        } catch (thErr) {
          console.warn('Could not generate canvas thumb, using Archive cover image:', thErr);
        }

        await LibraryApp.saveToDB(libraryBook);
        LibraryApp.books.unshift(libraryBook);
        LibraryApp.renderShelves();
      }

      // 6. Save OCR Book Record into IndexedDB
      if (ocrPages.length > 0) {
        const ocrRecord = {
          id: 'ocr_' + identifier + '_' + Date.now(),
          identifier: identifier,
          title: metadata.title,
          author: metadata.author || 'Internet Archive Scan',
          cover: metadata.coverUrl,
          dateImported: new Date().toLocaleDateString(),
          pageCount: ocrPages.length,
          pages: ocrPages,
          txtContent: txtContent,
          jsonContent: jsonContent,
          docxBlob: docxBlob,
          hasPdf: !!pdfBlob,
          isOcrRecord: true,
          format: 'DOCX',
          chapters: ocrPages.map(p => ({
            title: `Scan Page ${p.page}`,
            content: `[Scan Page ${p.page}]\n\n${p.text}`,
            html: `<div style="padding: 10px 0;"><h3 style="font-size: 15px; font-weight: 700; color: var(--reader-accent); margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">Original Scan Page ${p.page}</h3><p style="line-height: 1.8; font-size: 15px;">${p.text.replace(/\n\n/g, '</p><p style="line-height: 1.8; font-size: 15px;">')}</p></div>`
          }))
        };

        await this.saveOcrRecordToDB(ocrRecord);
      }

      onStep('Import completed successfully!', 100);
      onSuccess({
        title: metadata.title,
        cleanTitle: cleanTitle,
        pagesCount: ocrPages.length,
        hasPdf: !!pdfBlob,
        hasOcr: ocrPages.length > 0,
        txtContent,
        jsonContent,
        docxBlob
      });

    } catch (err) {
      console.error('[ArchiveImporter] Error during import:', err);
      onError(err);
    }
  },

  async saveOcrRecordToDB(record) {
    if (!LibraryApp.db) return;
    try {
      record.isOcrRecord = true;
      await LibraryApp.saveToDB(record);
    } catch (e) {
      console.error('[ArchiveImporter] Error saving OCR record:', e);
    }
  },

  async getAllOcrRecords() {
    if (!LibraryApp.db) return [];
    try {
      const all = await LibraryApp.getAllFromDB();
      return all.filter(item => item.isOcrRecord);
    } catch (e) {
      return [];
    }
  },

  async deleteOcrRecord(id) {
    if (!LibraryApp.db) return;
    try {
      await LibraryApp.removeFromDB(id);
    } catch (e) {
      console.error('[ArchiveImporter] Error deleting OCR record:', e);
    }
  },

  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

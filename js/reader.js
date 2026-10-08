/**
 * HomeLibrary - Reader Engine Controller
 * Manages realistic 3D page flip, scroll mode, PDF rendering, themes, night light,
 * progress scrubber, TTS read-aloud, and persistent bookmarks.
 */

const ReaderEngine = {
  activeBook: null,
  viewMode: 'pageFlip', // 'pageFlip' | 'scroll' | 'pdf'
  currentPage: 1,
  totalPages: 1,
  currentChapterIdx: 0,
  pageFlipInstance: null,
  pdfDoc: null,
  pdfSpreadMode: 'single', // 'single' | 'dual'
  pdfFitMode: 'page', // 'page' | 'width'
  pdfZoom: 1.0,
  pdfTextReflow: false,
  pdfViewLayout: 'flip', // 'flip' | 'scroll'
  soundEnabled: true,
  audioCtx: null,
  synth: window.speechSynthesis,
  isSpeaking: false,
  utterance: null,

  init() {
    this.bindEvents();
    this.initAudio();
  },

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  },

  playPageTurnSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      // Synthesize realistic subtle paper rustle sound
      const bufferSize = this.audioCtx.sampleRate * 0.12; // 120ms
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.25));
        data[i] = (Math.random() * 2 - 1) * decay * 0.15;
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Filter for soft paper frequency
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.12);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start();
    } catch (e) {
      // Audio fallback silent
    }
  },

  async openBook(book, startPage = null) {
    this.activeBook = book;
    const readerEl = document.getElementById('reader-view');
    readerEl.classList.add('is-active');

    // Update header info
    document.getElementById('reader-book-title').textContent = book.title;
    document.getElementById('reader-chapter-title').textContent = book.author;

    // Setup TOC drawer
    this.renderTocDrawer();
    this.renderBookmarksDrawer();

    const format = (book.format || 'TXT').toUpperCase();
    const isPdf = (format === 'PDF');
    const pdfTools = document.getElementById('pdf-tools-group');
    if (pdfTools) {
      pdfTools.style.display = isPdf ? 'flex' : 'none';
    }

    // Auto-detect optimal spread mode: dual on wide screens
    if (isPdf) {
      this.pdfSpreadMode = (window.innerWidth >= 1100) ? 'dual' : 'single';
      const badge = document.getElementById('pdf-spread-badge');
      if (badge) badge.textContent = (this.pdfSpreadMode === 'dual') ? '2P' : '1P';
      this.pdfZoom = 1.0;
      const zoomVal = document.getElementById('pdf-zoom-val');
      if (zoomVal) zoomVal.textContent = '100%';
      this.pdfTextReflow = false;
      const textBadge = document.getElementById('scan-text-badge');
      if (textBadge) textBadge.textContent = 'TXT';

      this.viewMode = 'pdf';
      this.pdfViewLayout = 'flip';
      await this.loadPdfView();
    } else {
      if (this.viewMode === 'pdf') this.viewMode = 'pageFlip';
      this.loadHtmlBookView();
    }

    // Determine initial page clamped to totalPages
    if (startPage !== null) {
      this.currentPage = Math.min(this.totalPages, Math.max(1, startPage));
    } else if (book.currentPage && book.currentPage <= this.totalPages) {
      this.currentPage = book.currentPage;
    } else {
      this.currentPage = 1;
    }

    this.updateControlsState();
  },

  closeReader() {
    this.stopSpeaking();
    if (this.pageFlipInstance) {
      try { this.pageFlipInstance.destroy(); } catch (e) {}
      this.pageFlipInstance = null;
    }
    const readerEl = document.getElementById('reader-view');
    readerEl.classList.remove('is-active');

    // Save reading progress back to library
    if (this.activeBook) {
      this.activeBook.currentPage = this.currentPage;
      this.activeBook.progress = Math.min(100, Math.round((this.currentPage / Math.max(1, this.totalPages)) * 100));
      if (window.LibraryApp) {
        LibraryApp.saveBookProgress(this.activeBook.id, this.currentPage, this.activeBook.progress);
      }
    }
  },

  loadHtmlBookView() {
    const flipContainer = document.getElementById('page-flip-container');
    const scrollContainer = document.getElementById('reader-scroll-container');
    const pdfContainer = document.getElementById('reader-pdf-container');

    pdfContainer.classList.remove('is-active');

    if (this.viewMode === 'scroll') {
      flipContainer.style.display = 'none';
      scrollContainer.classList.add('is-active');
      this.renderScrollContent();
    } else {
      scrollContainer.classList.remove('is-active');
      flipContainer.style.display = 'flex';
      this.renderPageFlipContent();
    }
  },

  renderPageFlipContent() {
    const flipContainer = document.getElementById('page-flip-container');
    flipContainer.innerHTML = '';

    if (this.pageFlipInstance) {
      try { this.pageFlipInstance.destroy(); } catch (e) {}
      this.pageFlipInstance = null;
    }

    // Split chapters into pages
    const pages = this.generateBookPages();
    this.totalPages = pages.length;
    this.currentPage = Math.min(this.totalPages, Math.max(1, this.currentPage));

    // Create book wrapper
    const bookEl = document.createElement('div');
    bookEl.id = 'st-book-flip';
    bookEl.className = 'st-page-flip';
    flipContainer.appendChild(bookEl);

    // Build page DOM elements
    pages.forEach((pageHtml, idx) => {
      const pageEl = document.createElement('div');
      pageEl.className = `book-page ${idx % 2 === 0 ? 'page-left' : 'page-right'}`;
      pageEl.setAttribute('data-density', 'hard');
      pageEl.innerHTML = `
        <div class="page-header-mark">
          <span>${this.escape(this.activeBook.title)}</span>
          <span>${this.escape(this.activeBook.author)}</span>
        </div>
        <div class="page-body-content">
          ${pageHtml}
        </div>
        <div class="page-footer-mark">
          - ${idx + 1} -
        </div>
      `;
      bookEl.appendChild(pageEl);
    });

    // Initialize PageFlip
    if (window.St && window.St.PageFlip) {
      const stageRect = document.querySelector('.reader-stage').getBoundingClientRect();
      const pageW = Math.min(480, Math.floor(stageRect.width / 2.1));
      const pageH = Math.min(680, Math.floor(stageRect.height * 0.88));

      this.pageFlipInstance = new St.PageFlip(bookEl, {
        width: pageW,
        height: pageH,
        size: 'fixed',
        minWidth: 320,
        maxWidth: 550,
        minHeight: 450,
        maxHeight: 750,
        maxShadowOpacity: 0.6,
        showCover: true,
        mobileScrollSupport: false,
        flippingTime: 700,
        usePortrait: false,
        startPage: Math.max(0, this.currentPage - 1)
      });

      this.pageFlipInstance.loadFromHTML(bookEl.querySelectorAll('.book-page'));

      this.pageFlipInstance.on('flip', (e) => {
        this.currentPage = e.data + 1;
        this.playPageTurnSound();
        this.updateProgressDisplay();
      });
    }

    this.updateProgressDisplay();
  },

  renderScrollContent() {
    const scrollContainer = document.getElementById('reader-scroll-container');
    const scrollBody = document.getElementById('scroll-text-body');
    scrollBody.innerHTML = '';

    const chapters = this.activeBook.chapters || [];
    this.totalPages = Math.max(1, chapters.length * 4);

    chapters.forEach((ch, idx) => {
      const chSection = document.createElement('section');
      chSection.className = 'scroll-chapter';
      chSection.id = `scroll-ch-${idx}`;
      chSection.innerHTML = `
        <h2 style="font-size: 24px; margin: 40px 0 20px; color: var(--reader-accent);">${this.escape(ch.title)}</h2>
        ${ch.content}
      `;
      scrollBody.appendChild(chSection);
    });

    scrollContainer.onscroll = () => {
      const scrollPos = scrollContainer.scrollTop;
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      if (maxScroll > 0) {
        const pct = Math.round((scrollPos / maxScroll) * 100);
        this.currentPage = Math.max(1, Math.round((pct / 100) * this.totalPages));
        this.updateProgressDisplay();
      }
    };
  },

  async loadPdfView() {
    const flipContainer = document.getElementById('page-flip-container');
    const scrollContainer = document.getElementById('reader-scroll-container');
    const pdfContainer = document.getElementById('reader-pdf-container');

    flipContainer.style.display = 'none';
    scrollContainer.classList.remove('is-active');
    pdfContainer.classList.add('is-active');

    try {
      const source = this.activeBook.fileBlob || this.activeBook.fileData || this.activeBook.url || 'assets/sample-books/The_Keeper_of_Lost_Things.pdf';
      this.pdfDoc = await PdfParser.loadDocument(source);
      this.totalPages = this.pdfDoc.numPages;

      if (this.pdfViewLayout === 'scroll') {
        await this.renderPdfScrollList();
      } else {
        await this.renderPdfCurrentPage();
      }
      this.updateProgressDisplay();
    } catch (e) {
      console.error('Error loading PDF:', e);
      pdfContainer.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-primary);"><h3>Unable to load PDF document</h3><p style="opacity:0.7; margin-top:8px;">${e.message}</p></div>`;
    }
  },

  togglePdfSpread() {
    this.pdfSpreadMode = (this.pdfSpreadMode === 'dual') ? 'single' : 'dual';
    const badge = document.getElementById('pdf-spread-badge');
    if (badge) badge.textContent = (this.pdfSpreadMode === 'dual') ? '2P' : '1P';
    if (this.viewMode === 'pdf') {
      this.renderPdfCurrentPage();
    }
  },

  togglePdfFit() {
    this.pdfFitMode = (this.pdfFitMode === 'page') ? 'width' : 'page';
    const btn = document.getElementById('btn-pdf-fit');
    if (btn) btn.classList.toggle('active', this.pdfFitMode === 'width');
    if (this.viewMode === 'pdf') {
      this.renderPdfCurrentPage();
    }
  },

  zoomPdf(delta) {
    this.pdfZoom = Math.max(0.5, Math.min(2.5, Math.round((this.pdfZoom + delta) * 100) / 100));
    const valEl = document.getElementById('pdf-zoom-val');
    if (valEl) valEl.textContent = `${Math.round(this.pdfZoom * 100)}%`;
    if (this.viewMode === 'pdf') {
      if (this.pdfViewLayout === 'scroll') {
        this.renderPdfScrollList();
      } else {
        this.renderPdfCurrentPage();
      }
    }
  },

  toggleScanOrText() {
    this.pdfTextReflow = !this.pdfTextReflow;
    const badge = document.getElementById('scan-text-badge');
    if (badge) badge.textContent = this.pdfTextReflow ? 'SCAN' : 'TXT';
    const btn = document.getElementById('btn-toggle-scan-text');
    if (btn) btn.classList.toggle('active', this.pdfTextReflow);
    if (this.viewMode === 'pdf') {
      this.renderPdfCurrentPage();
    }
  },

  async renderPdfCurrentPage() {
    if (!this.pdfDoc) return;
    const pdfContainer = document.getElementById('reader-pdf-container');
    if (!pdfContainer) return;
    pdfContainer.innerHTML = '';
    pdfContainer.classList.remove('align-top');

    // 1. Text Reflow (OCR / Clean Reflow) Mode with Indic Typography
    if (this.pdfTextReflow) {
      pdfContainer.classList.add('align-top');
      const reflowCard = document.createElement('div');
      reflowCard.className = 'pdf-reflow-view';

      const pageText = await PdfParser.extractPageText(this.pdfDoc, this.currentPage);
      const isIndic = /[\u0900-\u097F\u0B00-\u0B7F]/.test(pageText) || (this.activeBook.language && /odia|hindi|sanskrit/i.test(this.activeBook.language));

      const paragraphs = pageText.trim() ? pageText.split(/(?:\r?\n){2,}/).filter(Boolean) : [];

      reflowCard.innerHTML = `
        <div class="pdf-reflow-header">
          <span>${this.escape(this.activeBook.title)} &bull; Page ${this.currentPage} of ${this.totalPages}</span>
          <span style="color:var(--reader-accent); font-weight:600;">Clean OCR Reflow Mode</span>
        </div>
        <div class="pdf-reflow-content ${isIndic ? 'font-indic' : ''}">
          ${paragraphs.length > 0 ? paragraphs.map(p => `<p>${this.escape(p)}</p>`).join('') : (pageText.trim() ? `<p>${this.escape(pageText)}</p>` : '<p style="text-align:center; opacity:0.6; padding: 40px 0;">No extractable text layer on this page. Switch back to "SCAN" mode to view the original high-resolution scanned page.</p>')}
        </div>
      `;
      pdfContainer.appendChild(reflowCard);
      this.updateProgressDisplay();
      return;
    }

    // 2. High-DPI Scanned / Digital Canvas Mode
    const stage = document.querySelector('.reader-stage');
    const stageWidth = Math.max(400, (stage ? stage.clientWidth : window.innerWidth) - 80);
    const stageHeight = Math.max(400, (stage ? stage.clientHeight : window.innerHeight) - 40);

    const isDual = (this.pdfSpreadMode === 'dual' && stageWidth >= 780 && this.totalPages > 1);

    const spreadContainer = document.createElement('div');
    spreadContainer.className = 'pdf-spread-container';

    if (this.pdfFitMode === 'width') {
      pdfContainer.classList.add('align-top');
    }

    if (isDual) {
      // Determine pages to show
      let p1 = this.currentPage;
      let p2 = (p1 + 1 <= this.totalPages) ? p1 + 1 : null;

      const availWidth = (stageWidth - 24) / 2;
      const renderOptions = {
        fitMode: this.pdfFitMode,
        maxWidth: availWidth,
        maxHeight: stageHeight,
        zoom: this.pdfZoom
      };

      // Left Page Card
      const leftWrap = document.createElement('div');
      leftWrap.className = 'pdf-spread-left';
      const leftCard = document.createElement('div');
      leftCard.className = 'pdf-page-card';
      const canvas1 = document.createElement('canvas');
      canvas1.className = 'pdf-canvas';
      leftCard.appendChild(canvas1);
      leftWrap.appendChild(leftCard);
      spreadContainer.appendChild(leftWrap);

      // Center spine and right page
      let canvas2 = null;
      if (p2) {
        const spine = document.createElement('div');
        spine.className = 'pdf-spread-spine';
        spreadContainer.appendChild(spine);

        // Right Page Card
        const rightWrap = document.createElement('div');
        rightWrap.className = 'pdf-spread-right';
        const rightCard = document.createElement('div');
        rightCard.className = 'pdf-page-card';
        canvas2 = document.createElement('canvas');
        canvas2.className = 'pdf-canvas';
        rightCard.appendChild(canvas2);
        rightWrap.appendChild(rightCard);
        spreadContainer.appendChild(rightWrap);
      }

      pdfContainer.appendChild(spreadContainer);

      await PdfParser.renderPageToCanvas(this.pdfDoc, p1, canvas1, renderOptions);
      if (p2 && canvas2) {
        await PdfParser.renderPageToCanvas(this.pdfDoc, p2, canvas2, renderOptions);
      }
    } else {
      // Single Page
      const renderOptions = {
        fitMode: this.pdfFitMode,
        maxWidth: stageWidth,
        maxHeight: stageHeight,
        zoom: this.pdfZoom
      };

      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-canvas';
      card.appendChild(canvas);
      spreadContainer.appendChild(card);
      pdfContainer.appendChild(spreadContainer);

      await PdfParser.renderPageToCanvas(this.pdfDoc, this.currentPage, canvas, renderOptions);
    }

    this.updateProgressDisplay();
  },

  async renderPdfScrollList() {
    if (!this.pdfDoc) return;
    const pdfContainer = document.getElementById('reader-pdf-container');
    if (!pdfContainer) return;
    pdfContainer.innerHTML = '';
    pdfContainer.classList.add('align-top');

    const scrollList = document.createElement('div');
    scrollList.className = 'pdf-scroll-list';
    pdfContainer.appendChild(scrollList);

    const stage = document.querySelector('.reader-stage');
    const stageWidth = Math.max(400, (stage ? stage.clientWidth : window.innerWidth) - 120);

    const renderOptions = {
      fitMode: 'width',
      maxWidth: Math.min(840, stageWidth),
      zoom: this.pdfZoom
    };

    // Render each page into scroll list
    for (let p = 1; p <= this.totalPages; p++) {
      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      card.setAttribute('data-pdf-page', p);

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-canvas';
      card.appendChild(canvas);
      scrollList.appendChild(card);

      await PdfParser.renderPageToCanvas(this.pdfDoc, p, canvas, renderOptions);
    }

    pdfContainer.onscroll = () => {
      const cards = scrollList.querySelectorAll('.pdf-page-card');
      const containerTop = pdfContainer.scrollTop;
      let currentVisible = 1;
      cards.forEach(c => {
        if (c.offsetTop <= containerTop + 200) {
          currentVisible = parseInt(c.getAttribute('data-pdf-page')) || 1;
        }
      });
      if (this.currentPage !== currentVisible) {
        this.currentPage = currentVisible;
        this.updateProgressDisplay();
      }
    };
  },

  generateBookPages() {
    const pages = [];
    // Page 1: Cover / Title page
    pages.push(`
      <div style="text-align: center; margin-top: 60px;">
        <h1 style="font-size: 26px; font-weight: 800; margin-bottom: 12px; color: var(--reader-accent);">${this.escape(this.activeBook.title)}</h1>
        <p style="font-size: 15px; opacity: 0.8; margin-bottom: 24px;">By ${this.escape(this.activeBook.author)}</p>
        <div style="width: 50px; height: 2px; background: var(--reader-accent); margin: 0 auto 30px;"></div>
        <p style="font-size: 13px; font-style: italic; opacity: 0.7; max-width: 320px; margin: 0 auto;">${this.escape(this.activeBook.genre)} &bull; ${this.escape(this.activeBook.published || '')}</p>
      </div>
    `);

    const chapters = this.activeBook.chapters || [];
    if (chapters.length === 0) {
      pages.push(`<p>${this.activeBook.synopsis || 'No text available.'}</p>`);
      return pages;
    }

    chapters.forEach(ch => {
      // Split chapter content into chunks suitable for single pages
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = ch.content;

      const paragraphs = Array.from(tempDiv.querySelectorAll('p, h1, h2, h3, blockquote, div'));
      if (paragraphs.length === 0) {
        pages.push(`<h2>${this.escape(ch.title)}</h2><p>${tempDiv.textContent}</p>`);
      } else {
        let currentPageHtml = `<h2>${this.escape(ch.title)}</h2>`;
        let wordsCount = 0;

        paragraphs.forEach(p => {
          const textWords = p.textContent.trim().split(/\s+/).length;
          if (wordsCount + textWords > 220 && wordsCount > 0) {
            pages.push(currentPageHtml);
            currentPageHtml = '';
            wordsCount = 0;
          }
          currentPageHtml += p.outerHTML;
          wordsCount += textWords;
        });

        if (currentPageHtml.trim().length > 0) {
          pages.push(currentPageHtml);
        }
      }
    });

    return pages;
  },

  nextPage() {
    if (this.viewMode === 'pdf') {
      if (this.pdfViewLayout === 'scroll') {
        const pdfContainer = document.getElementById('reader-pdf-container');
        if (pdfContainer) pdfContainer.scrollBy({ top: 400, behavior: 'smooth' });
        return;
      }
      const step = (this.pdfSpreadMode === 'dual' && this.totalPages > 1) ? 2 : 1;
      if (this.currentPage + step <= this.totalPages) {
        this.currentPage += step;
      } else if (this.currentPage < this.totalPages) {
        this.currentPage = this.totalPages;
      } else {
        return;
      }
      this.renderPdfCurrentPage();
      this.playPageTurnSound();
      this.updateProgressDisplay();
    } else if (this.viewMode === 'pageFlip' && this.pageFlipInstance) {
      this.pageFlipInstance.flipNext();
    } else if (this.viewMode === 'scroll') {
      const scrollEl = document.getElementById('reader-scroll-container');
      scrollEl.scrollBy({ top: 350, behavior: 'smooth' });
    }
  },

  prevPage() {
    if (this.viewMode === 'pdf') {
      if (this.pdfViewLayout === 'scroll') {
        const pdfContainer = document.getElementById('reader-pdf-container');
        if (pdfContainer) pdfContainer.scrollBy({ top: -400, behavior: 'smooth' });
        return;
      }
      const step = (this.pdfSpreadMode === 'dual' && this.totalPages > 1) ? 2 : 1;
      if (this.currentPage - step >= 1) {
        this.currentPage -= step;
      } else if (this.currentPage > 1) {
        this.currentPage = 1;
      } else {
        return;
      }
      this.renderPdfCurrentPage();
      this.playPageTurnSound();
      this.updateProgressDisplay();
    } else if (this.viewMode === 'pageFlip' && this.pageFlipInstance) {
      this.pageFlipInstance.flipPrev();
    } else if (this.viewMode === 'scroll') {
      const scrollEl = document.getElementById('reader-scroll-container');
      scrollEl.scrollBy({ top: -350, behavior: 'smooth' });
    }
  },

  jumpToPage(targetPage) {
    const page = Math.max(1, Math.min(this.totalPages, parseInt(targetPage) || 1));
    this.currentPage = page;

    if (this.viewMode === 'pdf') {
      if (this.pdfViewLayout === 'scroll') {
        const targetCard = document.querySelector(`[data-pdf-page="${page}"]`);
        if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth' });
      } else {
        this.renderPdfCurrentPage();
      }
    } else if (this.viewMode === 'pageFlip' && this.pageFlipInstance) {
      this.pageFlipInstance.flip(page - 1);
    } else if (this.viewMode === 'scroll') {
      const scrollEl = document.getElementById('reader-scroll-container');
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      scrollEl.scrollTop = ((page - 1) / (this.totalPages - 1)) * maxScroll;
    }
    this.updateProgressDisplay();
  },

  updateProgressDisplay() {
    const scrubber = document.getElementById('reader-scrubber');
    const pct = Math.round((this.currentPage / Math.max(1, this.totalPages)) * 100);

    if (scrubber) {
      scrubber.min = 1;
      scrubber.max = this.totalPages;
      scrubber.value = this.currentPage;
    }

    const pageCountEl = document.getElementById('reader-page-count');
    if (pageCountEl) {
      pageCountEl.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    }

    const pctEl = document.getElementById('reader-percent');
    if (pctEl) {
      pctEl.textContent = `${pct}%`;
    }

    // Estimate time left (assume ~250 words/min = ~1 min per page)
    const minsLeft = Math.max(1, (this.totalPages - this.currentPage));
    const timeEl = document.getElementById('reader-time-left');
    if (timeEl) {
      timeEl.textContent = `~${minsLeft} mins left`;
    }
  },

  setTheme(themeName) {
    const readerEl = document.getElementById('reader-view');
    readerEl.setAttribute('data-theme', themeName);

    document.querySelectorAll('.theme-circle').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-set-theme') === themeName);
    });
  },

  setViewMode(mode) {
    this.viewMode = mode;
    document.querySelectorAll('[data-view-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view-mode') === mode);
    });
    if (this.activeBook) {
      const isPdf = ((this.activeBook.format || '').toUpperCase() === 'PDF');
      if (isPdf) {
        this.viewMode = 'pdf';
        if (mode === 'scroll') {
          this.pdfViewLayout = 'scroll';
          this.renderPdfScrollList();
        } else {
          this.pdfViewLayout = 'flip';
          this.renderPdfCurrentPage();
        }
      } else {
        this.loadHtmlBookView();
      }
    }
  },

  setWarmth(val) {
    const overlay = document.getElementById('night-light-overlay');
    if (overlay) {
      overlay.style.opacity = (val / 100) * 0.45;
    }
    const label = document.getElementById('warmth-value-label');
    if (label) label.textContent = `${val}%`;
  },

  setFont(fontFamily) {
    document.documentElement.style.setProperty('--reader-font-family', fontFamily);
    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-font') === fontFamily);
    });
  },

  setFontSize(sizePx) {
    document.documentElement.style.setProperty('--reader-font-size', `${sizePx}px`);
    const label = document.getElementById('font-size-label');
    if (label) label.textContent = `${sizePx}px`;
  },

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById('btn-toggle-sound');
    if (btn) btn.classList.toggle('active', this.soundEnabled);
  },

  // Drawers
  toggleDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;
    const isOpen = drawer.classList.contains('is-open');
    document.querySelectorAll('.reader-drawer').forEach(d => d.classList.remove('is-open'));
    if (!isOpen) {
      drawer.classList.add('is-open');
    }
  },

  renderTocDrawer() {
    const container = document.getElementById('toc-drawer-list');
    if (!container) return;
    container.innerHTML = '';

    const chapters = this.activeBook.chapters || [];
    chapters.forEach((ch, idx) => {
      const item = document.createElement('div');
      item.className = 'drawer-item';
      item.innerHTML = `
        <span>${this.escape(ch.title)}</span>
        <span style="opacity:0.5; font-size:10px;">Ch ${idx + 1}</span>
      `;
      item.onclick = () => {
        // Jump to chapter
        if (this.viewMode === 'scroll') {
          const target = document.getElementById(`scroll-ch-${idx}`);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else {
          this.jumpToPage(idx * 2 + 1);
        }
        document.getElementById('toc-drawer').classList.remove('is-open');
      };
      container.appendChild(item);
    });
  },

  renderBookmarksDrawer() {
    const container = document.getElementById('bookmarks-drawer-list');
    if (!container) return;
    container.innerHTML = '';

    const bookmarks = this.getBookmarks();
    if (bookmarks.length === 0) {
      container.innerHTML = '<p style="font-size:12px; opacity:0.6; text-align:center; padding:20px;">No bookmarks yet. Click the ribbon icon to bookmark the current page.</p>';
      return;
    }

    bookmarks.forEach(bm => {
      const item = document.createElement('div');
      item.className = 'drawer-item';
      item.innerHTML = `
        <div>
          <div style="font-weight:600;">Page ${bm.page}</div>
          <div style="font-size:10px; opacity:0.5;">${bm.time}</div>
        </div>
        <button style="background:none; border:none; color:var(--reader-accent); cursor:pointer;">&times;</button>
      `;
      item.querySelector('button').onclick = (e) => {
        e.stopPropagation();
        this.removeBookmark(bm.id);
      };
      item.onclick = () => {
        this.jumpToPage(bm.page);
        document.getElementById('bookmarks-drawer').classList.remove('is-open');
      };
      container.appendChild(item);
    });
  },

  addBookmark() {
    if (!this.activeBook) return;
    const key = `bookmarks_${this.activeBook.id}`;
    const list = this.getBookmarks();
    const newBm = {
      id: Date.now(),
      page: this.currentPage,
      time: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    list.push(newBm);
    localStorage.setItem(key, JSON.stringify(list));
    this.renderBookmarksDrawer();
    alert(`Bookmarked Page ${this.currentPage}`);
  },

  getBookmarks() {
    if (!this.activeBook) return [];
    const key = `bookmarks_${this.activeBook.id}`;
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  },

  removeBookmark(bmId) {
    if (!this.activeBook) return;
    const key = `bookmarks_${this.activeBook.id}`;
    let list = this.getBookmarks();
    list = list.filter(b => b.id !== bmId);
    localStorage.setItem(key, JSON.stringify(list));
    this.renderBookmarksDrawer();
  },

  // Text-To-Speech (TTS) Read Aloud
  async startSpeaking() {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis not supported by your system.');
      return;
    }
    this.stopSpeaking();

    // Get current page text
    let textToSpeak = '';
    if (this.viewMode === 'pdf' && this.pdfDoc) {
      textToSpeak = await PdfParser.extractPageText(this.pdfDoc, this.currentPage);
      if (!textToSpeak.trim()) {
        textToSpeak = this.activeBook.title + '. ' + (this.activeBook.synopsis || '');
      }
    } else {
      const activePage = document.querySelector('.book-page.page-right .page-body-content') || document.querySelector('.page-body-content');
      if (activePage) {
        textToSpeak = activePage.textContent;
      } else {
        textToSpeak = this.activeBook.title + '. ' + (this.activeBook.synopsis || '');
      }
    }

    if (!textToSpeak.trim()) return;

    this.utterance = new SpeechSynthesisUtterance(textToSpeak);
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    // Detect Indic language (Devanagari, Odia) and select matching voice
    try {
      const voices = window.speechSynthesis.getVoices();
      const isIndic = /[\u0900-\u097F\u0B00-\u0B7F]/.test(textToSpeak) || (this.activeBook && this.activeBook.language && /odia|hindi|sanskrit/i.test(this.activeBook.language));
      if (isIndic && voices.length > 0) {
        const indicVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('sa') || v.lang.startsWith('or') || v.lang.startsWith('bn') || v.lang.includes('IN'));
        if (indicVoice) {
          this.utterance.voice = indicVoice;
        }
      }
    } catch (e) {}

    this.utterance.onend = () => {
      this.isSpeaking = false;
      document.getElementById('tts-player-bar').classList.remove('is-active');
    };

    window.speechSynthesis.speak(this.utterance);
    this.isSpeaking = true;
    document.getElementById('tts-player-bar').classList.add('is-active');
  },

  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    const bar = document.getElementById('tts-player-bar');
    if (bar) bar.classList.remove('is-active');
  },

  bindEvents() {
    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      const readerEl = document.getElementById('reader-view');
      if (!readerEl.classList.contains('is-active')) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prevPage();
      } else if (e.key === 'Escape') {
        this.closeReader();
      }
    });

    // Scrubber drag / input
    const scrubber = document.getElementById('reader-scrubber');
    if (scrubber) {
      scrubber.oninput = (e) => {
        this.jumpToPage(e.target.value);
      };
    }
  },

  updateControlsState() {
    this.updateProgressDisplay();
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

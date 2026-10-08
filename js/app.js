/**
 * HomeLibrary - Desktop Library Application Controller
 * Manages shelves, searching, filtering, book details modal, file import, and IndexedDB storage.
 */

const DB_NAME = 'HomeLibraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';

const LibraryApp = {
  db: null,
  books: [],
  selectedGenre: null,
  selectedShelf: 'all',
  searchQuery: '',
  activeModalBook: null,
  appTheme: 'dark',
  currentMainView: 'library',

  userProfile: {
    name: 'Jessica Chastain',
    bio: 'HomeLibrary Pro Member',
    avatar: 'assets/avatars/user_jessica.png',
    yearlyGoal: 30
  },

  presetAvatars: [
    { name: 'Jessica', path: 'assets/avatars/user_jessica.png' },
    { name: 'Amelia', path: 'assets/avatars/author_amelia.png' },
    { name: 'Christopher', path: 'assets/avatars/author_christopher.png' },
    { name: 'Jonathan', path: 'assets/avatars/author_jonathan.png' }
  ],

  tempSelectedAvatar: null,

  async init() {
    await this.initDB();
    await this.loadBooks();
    this.initProfile();
    this.renderSidebar();
    this.renderShelves();
    this.bindEvents();
    this.initDragAndDrop();

    // Check system or saved theme
    const savedTheme = localStorage.getItem('homelibrary_theme') || 'dark';
    this.setAppTheme(savedTheme);

    // Initialize Reader Engine
    if (window.ReaderEngine) {
      ReaderEngine.init();
    }

    // Check URL hash for deep linking (e.g. #details=a_poem_for_every_night or #read=a_poem_for_every_night&theme=sepia)
    const hash = window.location.hash;
    const themeMatch = hash.match(/theme=([a-z]+)/);
    if (themeMatch) {
      this.setAppTheme(themeMatch[1]);
    }

    if (hash === '#profile') {
      this.openProfileStatsModal();
    } else if (hash === '#downloader') {
      this.switchMainView('downloader');
    } else if (hash.startsWith('#inspect=')) {
      const id = hash.replace('#inspect=', '').split('&')[0];
      this.switchMainView('downloader');
      setTimeout(() => {
        ArchiveApp.loadSample(id);
      }, 300);
    } else if (hash.startsWith('#start-import=')) {
      const id = hash.replace('#start-import=', '').split('&')[0];
      this.switchMainView('downloader');
      setTimeout(async () => {
        await ArchiveApp.loadSample(id);
        setTimeout(() => {
          ArchiveApp.startDownload();
        }, 1200);
      }, 300);
    } else if (hash === '#ocr') {
      this.switchMainView('ocr');
    } else if (hash.startsWith('#details=')) {
      const bookId = hash.replace('#details=', '').split('&')[0];
      const book = this.books.find(b => b.id === bookId);
      if (book) this.openBookDetails(book);
    } else if (hash.startsWith('#edit=')) {
      const bookId = hash.replace('#edit=', '').split('&')[0];
      const book = this.books.find(b => b.id === bookId);
      if (book) this.openEditCategoryModal(book);
    } else if (hash.startsWith('#read=')) {
      const bookId = hash.replace('#read=', '').split('&')[0];
      const pageMatch = hash.match(/page=(\d+)/);
      const startPage = pageMatch ? parseInt(pageMatch[1]) : 1;
      const viewMatch = hash.match(/view=([a-zA-Z]+)/);
      const book = this.books.find(b => b.id === bookId);
      if (book) {
        ReaderEngine.openBook(book, startPage);
        if (viewMatch) ReaderEngine.setViewMode(viewMatch[1]);
        if (themeMatch) ReaderEngine.setTheme(themeMatch[1]);
      }
    }
  },

  // View Navigation: 'library' | 'downloader' | 'ocr'
  switchMainView(viewName) {
    this.currentMainView = viewName;

    // Update active class on nav items
    document.querySelectorAll('#sidebar-main-nav .nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    const shelvesView = document.getElementById('shelves-view');
    const downloaderView = document.getElementById('archive-downloader-view');
    const ocrView = document.getElementById('ocr-files-view');

    if (shelvesView) shelvesView.style.display = (viewName === 'library') ? 'flex' : 'none';
    if (downloaderView) downloaderView.style.display = (viewName === 'downloader') ? 'flex' : 'none';
    if (ocrView) ocrView.style.display = (viewName === 'ocr') ? 'flex' : 'none';

    if (viewName === 'ocr' && window.ArchiveApp) {
      ArchiveApp.renderOcrList();
    }
  },

  // User Profile & Stats System
  initProfile() {
    const saved = localStorage.getItem('homelibrary_user_profile');
    if (saved) {
      try {
        this.userProfile = { ...this.userProfile, ...JSON.parse(saved) };
      } catch (e) {}
    }
    this.updateHeaderProfile();
  },

  updateHeaderProfile() {
    const nameEl = document.getElementById('header-user-name');
    const avatarEl = document.getElementById('header-user-avatar');
    if (nameEl) nameEl.textContent = this.userProfile.name;
    if (avatarEl) avatarEl.src = this.userProfile.avatar;
  },

  openProfileStatsModal() {
    this.tempSelectedAvatar = this.userProfile.avatar;

    const nameInput = document.getElementById('profile-name-input');
    const bioInput = document.getElementById('profile-bio-input');
    const goalInput = document.getElementById('profile-goal-input');
    const previewAvatar = document.getElementById('profile-preview-avatar');

    if (nameInput) nameInput.value = this.userProfile.name;
    if (bioInput) bioInput.value = this.userProfile.bio;
    if (goalInput) goalInput.value = this.userProfile.yearlyGoal;
    if (previewAvatar) previewAvatar.src = this.userProfile.avatar;

    // Render Preset Avatars
    const presetsList = document.getElementById('avatar-presets-list');
    if (presetsList) {
      presetsList.innerHTML = '';
      this.presetAvatars.forEach(p => {
        const img = document.createElement('img');
        img.src = p.path;
        img.alt = p.name;
        img.className = `preset-avatar-thumb ${this.tempSelectedAvatar === p.path ? 'active' : ''}`;
        img.title = `Choose ${p.name}`;
        img.onclick = () => {
          this.tempSelectedAvatar = p.path;
          if (previewAvatar) previewAvatar.src = p.path;
          presetsList.querySelectorAll('.preset-avatar-thumb').forEach(el => el.classList.remove('active'));
          img.classList.add('active');
        };
        presetsList.appendChild(img);
      });
    }

    // Real-time Total Reading Stats Calculation
    this.calculateAndRenderReadingStats();

    // Show modal
    const modal = document.getElementById('profile-stats-modal');
    if (modal) modal.classList.add('is-open');
  },

  closeProfileStatsModal() {
    const modal = document.getElementById('profile-stats-modal');
    if (modal) modal.classList.remove('is-open');
  },

  handleCustomAvatarUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.tempSelectedAvatar = e.target.result;
      const previewAvatar = document.getElementById('profile-preview-avatar');
      if (previewAvatar) previewAvatar.src = this.tempSelectedAvatar;

      const presetsList = document.getElementById('avatar-presets-list');
      if (presetsList) {
        presetsList.querySelectorAll('.preset-avatar-thumb').forEach(el => el.classList.remove('active'));
      }
    };
    reader.readAsDataURL(file);
  },

  saveProfile() {
    const nameInput = document.getElementById('profile-name-input');
    const bioInput = document.getElementById('profile-bio-input');
    const goalInput = document.getElementById('profile-goal-input');

    if (nameInput && nameInput.value.trim()) {
      this.userProfile.name = nameInput.value.trim();
    }
    if (bioInput && bioInput.value.trim()) {
      this.userProfile.bio = bioInput.value.trim();
    }
    if (goalInput && parseInt(goalInput.value, 10) > 0) {
      this.userProfile.yearlyGoal = parseInt(goalInput.value, 10);
    }
    if (this.tempSelectedAvatar) {
      this.userProfile.avatar = this.tempSelectedAvatar;
    }

    localStorage.setItem('homelibrary_user_profile', JSON.stringify(this.userProfile));
    this.updateHeaderProfile();
    this.calculateAndRenderReadingStats();
    alert('User Profile updated successfully!');
  },

  calculateAndRenderReadingStats() {
    let totalPagesRead = 0;
    let booksCompleted = 0;
    let booksInProgress = [];
    const formatsCount = { PDF: 0, EPUB: 0, DOCX: 0, TXT: 0 };

    this.books.forEach(b => {
      const fmt = (b.format || 'TXT').toUpperCase();
      formatsCount[fmt] = (formatsCount[fmt] || 0) + 1;

      if (b.progress && b.progress >= 100) {
        booksCompleted++;
        totalPagesRead += (b.pages || 320);
      } else if (b.currentPage && b.currentPage > 1) {
        totalPagesRead += b.currentPage;
        booksInProgress.push(b);
      }
    });

    // Approximate 2.2 minutes reading per page
    const totalMinutes = Math.max(90, Math.round(totalPagesRead * 2.2));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeFormatted = `${hours}h ${mins}m`;

    const timeEl = document.getElementById('stat-total-time');
    const pagesEl = document.getElementById('stat-pages-read');
    const completedEl = document.getElementById('stat-books-completed');
    const streakEl = document.getElementById('stat-streak-days');
    const goalRatioEl = document.getElementById('stat-goal-ratio');
    const goalFillEl = document.getElementById('stat-goal-fill');
    const formatSummaryEl = document.getElementById('stat-format-summary');
    const activityListEl = document.getElementById('stat-activity-list');

    if (timeEl) timeEl.textContent = timeFormatted;
    if (pagesEl) pagesEl.textContent = totalPagesRead.toLocaleString();
    if (completedEl) completedEl.textContent = booksCompleted;
    if (streakEl) streakEl.textContent = '7 Days';

    const goal = this.userProfile.yearlyGoal || 30;
    const pct = Math.min(100, Math.round((booksCompleted / goal) * 100));
    if (goalRatioEl) goalRatioEl.textContent = `${booksCompleted} / ${goal} Books (${pct}%)`;
    if (goalFillEl) goalFillEl.style.width = `${pct}%`;

    // Formats Breakdown
    if (formatSummaryEl) {
      formatSummaryEl.innerHTML = '';
      Object.entries(formatsCount).forEach(([fmt, count]) => {
        if (count > 0) {
          const chip = document.createElement('div');
          chip.className = 'format-stat-chip';
          chip.innerHTML = `${fmt}: <span>${count}</span>`;
          formatSummaryEl.appendChild(chip);
        }
      });
    }

    // Recent Activity List
    if (activityListEl) {
      activityListEl.innerHTML = '';
      if (booksInProgress.length === 0) {
        activityListEl.innerHTML = '<span style="font-size:11px; color:var(--text-muted); padding:6px 0;">No books in progress yet. Open any title to start reading!</span>';
      } else {
        booksInProgress.slice(0, 5).forEach(b => {
          const item = document.createElement('div');
          item.className = 'activity-item';
          item.innerHTML = `
            <span class="activity-item-title">${this.escape(b.title)}</span>
            <span style="color:var(--text-accent); font-weight:600;">${b.progress || 0}% (Pg ${b.currentPage})</span>
          `;
          activityListEl.appendChild(item);
        });
      }
    }
  },

  // IndexedDB Persistence
  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = (e) => {
        console.error('IndexedDB init error:', e);
        resolve(); // Continue even if fallback to memory
      };
    });
  },

  async loadBooks() {
    // 1. Start with default Dribbble concept books
    this.books = [...DEFAULT_BOOKS];

    // 2. Load custom imported books from IndexedDB (excluding OCR-only records)
    if (this.db) {
      try {
        const customBooks = await this.getAllFromDB();
        if (customBooks && customBooks.length > 0) {
          const regularBooks = customBooks.filter(b => !b.isOcrRecord);
          this.books = [...this.books, ...regularBooks];
        }
      } catch (e) {
        console.warn('Error reading from IndexedDB:', e);
      }
    }

    // 3. Load saved progresses, favorites, and category edits from localStorage
    this.books.forEach(book => {
      const savedProg = localStorage.getItem(`prog_${book.id}`);
      if (savedProg) {
        try {
          const parsed = JSON.parse(savedProg);
          book.currentPage = parsed.page;
          book.progress = parsed.progress;
        } catch (e) {}
      }
      const savedFav = localStorage.getItem(`fav_${book.id}`);
      if (savedFav !== null) {
        book.isFavorite = savedFav === 'true';
      }
      const savedCat = localStorage.getItem(`cat_${book.id}`);
      if (savedCat) {
        try {
          const parsed = JSON.parse(savedCat);
          if (parsed.genre) book.genre = parsed.genre;
          if (parsed.subGenres) book.subGenres = parsed.subGenres;
          if (parsed.shelf) book.shelf = parsed.shelf;
        } catch (e) {}
      }
    });
  },

  getAllFromDB() {
    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },

  saveToDB(book) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.warn('[IDB] Database not initialized, skipping saveToDB');
        return resolve();
      }
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(book);
        req.onsuccess = () => {
          console.log('[IDB] put request succeeded for:', book.title);
        };
        req.onerror = (e) => {
          console.error('[IDB] put request failed:', e.target.error);
          reject(e.target.error);
        };
        tx.oncomplete = () => {
          console.log('[IDB] transaction completed successfully for:', book.title);
          resolve();
        };
        tx.onerror = (e) => {
          console.error('[IDB] transaction failed:', e.target.error);
          reject(e.target.error);
        };
      } catch (err) {
        console.error('[IDB] Exception in saveToDB:', err);
        reject(err);
      }
    });
  },

  removeFromDB(bookId) {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(bookId);
      tx.oncomplete = () => resolve();
    });
  },

  saveBookProgress(bookId, page, progress) {
    localStorage.setItem(`prog_${bookId}`, JSON.stringify({ page, progress }));
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      book.currentPage = page;
      book.progress = progress;
      this.renderShelves();
    }
  },

  // --------------------------------------------------------------------------
  // UI RENDERING & GENRES
  // --------------------------------------------------------------------------
  getAllGenres() {
    let custom = [];
    try {
      custom = JSON.parse(localStorage.getItem('homelibrary_custom_genres')) || [];
    } catch (e) {}
    const set = new Set([...GENRES, ...custom]);
    this.books.forEach(b => {
      if (b.genre && b.genre.trim()) set.add(b.genre.trim());
      if (Array.isArray(b.subGenres)) {
        b.subGenres.forEach(sg => { if (sg && sg.trim()) set.add(sg.trim()); });
      }
    });
    return Array.from(set).filter(Boolean);
  },

  renderSidebar() {
    const genreContainer = document.getElementById('sidebar-genres');
    if (genreContainer) {
      genreContainer.innerHTML = '';
      const allGenres = this.getAllGenres();
      allGenres.forEach(g => {
        const li = document.createElement('li');
        li.className = `genre-item ${this.selectedGenre === g ? 'active' : ''}`;
        li.textContent = g;
        li.onclick = () => this.filterByGenre(g);
        genreContainer.appendChild(li);
      });
    }
  },

  renderShelves() {
    const popularRow = document.getElementById('row-most-popular');
    const recommendedRow = document.getElementById('row-recommended');
    const importedRow = document.getElementById('row-imported');
    const importedSection = document.getElementById('section-imported');

    // Filter books based on search, genre, writer, shelf
    let filtered = this.books;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (this.selectedGenre) {
      filtered = filtered.filter(b => b.genre === this.selectedGenre || (b.subGenres && b.subGenres.includes(this.selectedGenre)));
    }
    if (this.selectedWriter) {
      filtered = filtered.filter(b => b.author.toLowerCase().includes(this.selectedWriter.toLowerCase()));
    }
    if (this.selectedShelf === 'favorites') {
      filtered = filtered.filter(b => b.isFavorite);
    } else if (this.selectedShelf === 'reading') {
      filtered = filtered.filter(b => b.progress > 0 && b.progress < 100);
    } else if (this.selectedShelf === 'imported') {
      filtered = filtered.filter(b => b.isImported);
    }

    // Populate Popular Row
    const popularBooks = filtered.filter(b => b.shelf === 'popular' || (!this.selectedGenre && !this.searchQuery && b.shelf === 'popular'));
    this.renderBookRow(popularRow, popularBooks.length > 0 ? popularBooks : filtered.slice(0, 7));

    // Populate Recommended Row
    const recommendedBooks = filtered.filter(b => b.shelf === 'recommended' || (!this.selectedGenre && !this.searchQuery && b.shelf === 'recommended'));
    this.renderBookRow(recommendedRow, recommendedBooks.length > 0 ? recommendedBooks : filtered.slice(7));

    // Populate Imported Row
    const importedBooks = this.books.filter(b => b.isImported);
    if (importedRow && importedSection) {
      if (importedBooks.length > 0) {
        importedSection.style.display = 'flex';
        this.renderBookRow(importedRow, importedBooks);
      } else {
        importedSection.style.display = 'none';
      }
    }
  },

  renderBookRow(container, bookList) {
    if (!container) return;
    container.innerHTML = '';

    if (bookList.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:11.5px; padding:10px;">No books found matching this filter.</p>';
      return;
    }

    bookList.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';
      card.title = `${book.title} by ${book.author}`;

      // Star rating markup
      let starsHtml = '';
      for (let s = 1; s <= 5; s++) {
        starsHtml += `<span class="star ${s <= book.rating ? '' : 'empty'}">&#9733;</span>`;
      }

      // Progress bar if reading
      const progressStrip = book.progress > 0 ? `
        <div class="card-progress-strip">
          <div class="card-progress-fill" style="width: ${book.progress}%;"></div>
        </div>
      ` : '';

      card.innerHTML = `
        <div class="cover-wrapper">
          <img src="${book.cover || 'assets/covers/default_cover.png'}" class="cover-image" alt="${this.escape(book.title)}">
          <span class="format-chip">${this.escape(book.format || 'TXT')}</span>
          ${progressStrip}
        </div>
        <div class="card-info">
          <div class="card-title">${this.escape(book.title)}</div>
          <div class="card-rating">${starsHtml}</div>
        </div>
      `;

      card.onclick = () => this.openBookDetails(book);
      container.appendChild(card);
    });
  },

  // --------------------------------------------------------------------------
  // BOOK DETAILS MODAL
  // --------------------------------------------------------------------------
  openBookDetails(book) {
    this.activeModalBook = book;
    const modalBackdrop = document.getElementById('book-details-modal');

    // Populate fields
    document.getElementById('modal-book-cover').src = book.cover || 'assets/covers/default_cover.png';
    document.getElementById('modal-book-title').textContent = book.title;
    document.getElementById('modal-book-author').textContent = book.author;
    document.getElementById('modal-format-chip').textContent = book.format || 'EPUB';
    document.getElementById('modal-genre-chip').textContent = book.genre || 'General';
    document.getElementById('modal-pages-chip').textContent = `${book.pages || 320} Pages`;
    document.getElementById('modal-reading-time').textContent = book.readingTime || '5h 30m';
    document.getElementById('modal-synopsis').textContent = book.synopsis || 'An enthralling journey of discovery and literature.';

    // Star rating
    const starsContainer = document.getElementById('modal-stars');
    starsContainer.innerHTML = '';
    for (let s = 1; s <= 5; s++) {
      const star = document.createElement('span');
      star.className = `star ${s <= book.rating ? '' : 'empty'}`;
      star.innerHTML = '&#9733;';
      starsContainer.appendChild(star);
    }
    document.getElementById('modal-rating-score').textContent = `${(book.rating || 5).toFixed(1)}`;
    document.getElementById('modal-reviews-count').textContent = `(${book.reviewsCount || 820} ratings)`;

    // Progress bar
    const progTrack = document.getElementById('modal-progress-fill');
    const progPct = document.getElementById('modal-progress-percent');
    const readBtn = document.getElementById('modal-read-btn');

    const progress = book.progress || 0;
    progTrack.style.width = `${progress}%`;
    progPct.textContent = `${progress}% completed`;

    if (progress > 0) {
      readBtn.innerHTML = `<span>&#9654;</span> Continue Reading (Page ${book.currentPage || 1})`;
    } else {
      readBtn.innerHTML = `<span>&#128214;</span> Read Book`;
    }

    readBtn.onclick = () => {
      this.closeBookDetails();
      ReaderEngine.openBook(book, book.currentPage || 1);
    };

    // Favorite button state
    const favBtn = document.getElementById('modal-fav-btn');
    favBtn.classList.toggle('active', !!book.isFavorite);
    favBtn.onclick = () => {
      book.isFavorite = !book.isFavorite;
      favBtn.classList.toggle('active', book.isFavorite);
      localStorage.setItem(`fav_${book.id}`, String(book.isFavorite));
      this.renderShelves();
    };

    // Populate TOC preview
    const tocContainer = document.getElementById('modal-toc-preview');
    tocContainer.innerHTML = '';
    const chapters = book.chapters || [];
    if (chapters.length > 0) {
      chapters.forEach((ch, idx) => {
        const item = document.createElement('li');
        item.className = 'modal-toc-item';
        item.innerHTML = `
          <span>${this.escape(ch.title)}</span>
          <span style="opacity: 0.6; font-size: 11px;">Chapter ${idx + 1}</span>
        `;
        item.onclick = () => {
          this.closeBookDetails();
          ReaderEngine.openBook(book, idx * 2 + 1);
        };
        tocContainer.appendChild(item);
      });
    } else {
      tocContainer.innerHTML = '<li class="modal-toc-item"><span>Full Book Content</span></li>';
    }

    // Modal Details Grid
    document.getElementById('modal-spec-lang').textContent = book.language || 'English';
    document.getElementById('modal-spec-published').textContent = book.published || '2018';
    document.getElementById('modal-spec-format').textContent = (book.format || 'TXT').toUpperCase();
    document.getElementById('modal-spec-pages').textContent = book.pages || '320';

    modalBackdrop.classList.add('is-open');
  },

  closeBookDetails() {
    const modalBackdrop = document.getElementById('book-details-modal');
    modalBackdrop.classList.remove('is-open');
  },

  switchModalTab(tabName) {
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });
  },

  // --------------------------------------------------------------------------
  // EDIT CATEGORY & BOOKSHELF MODAL
  // --------------------------------------------------------------------------
  editingCategoryBook: null,

  openEditCategoryModal(book = null) {
    const targetBook = book || this.activeModalBook;
    if (!targetBook) return;
    this.editingCategoryBook = targetBook;

    const modal = document.getElementById('edit-category-modal');
    if (!modal) return;

    document.getElementById('edit-category-book-title').textContent = targetBook.title;
    document.getElementById('edit-category-author').textContent = targetBook.author;
    document.getElementById('edit-category-cover').src = targetBook.cover || 'assets/covers/default_cover.png';

    const shelfNameMap = {
      popular: 'Most Popular',
      recommended: 'Recommended for You',
      imported: 'Archive & Downloads'
    };
    document.getElementById('edit-category-curr-shelf').textContent = `Current Shelf: ${shelfNameMap[targetBook.shelf] || 'Most Popular'}`;

    // Populate category dropdown
    const select = document.getElementById('edit-category-select');
    select.innerHTML = '';
    const allGenres = this.getAllGenres();

    let matched = false;
    allGenres.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      if (g.toLowerCase() === (targetBook.genre || '').toLowerCase()) {
        opt.selected = true;
        matched = true;
      }
      select.appendChild(opt);
    });

    // Custom option
    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '➕ Add Custom Genre...';
    select.appendChild(customOpt);

    const customGroup = document.getElementById('edit-custom-category-group');
    const customInput = document.getElementById('edit-custom-category-input');
    if (!matched && targetBook.genre) {
      customOpt.selected = true;
      customGroup.style.display = 'flex';
      customInput.value = targetBook.genre;
    } else {
      customGroup.style.display = 'none';
      customInput.value = '';
    }

    // Subgenres
    const subgenresInput = document.getElementById('edit-subgenres-input');
    subgenresInput.value = (targetBook.subGenres || []).join(', ');

    // Shelf radio
    const shelfVal = targetBook.shelf || 'popular';
    const radio = document.getElementById(`shelf-radio-${shelfVal}`);
    if (radio) {
      radio.checked = true;
    } else {
      const defaultRadio = document.getElementById('shelf-radio-popular');
      if (defaultRadio) defaultRadio.checked = true;
    }

    modal.classList.add('is-open');
  },

  closeEditCategoryModal() {
    const modal = document.getElementById('edit-category-modal');
    if (modal) modal.classList.remove('is-open');
    this.editingCategoryBook = null;
  },

  onPrimaryCategoryChange(val) {
    const customGroup = document.getElementById('edit-custom-category-group');
    const customInput = document.getElementById('edit-custom-category-input');
    if (val === '__custom__') {
      customGroup.style.display = 'flex';
      customInput.focus();
    } else {
      customGroup.style.display = 'none';
    }
  },

  async saveCategoryEdit() {
    const book = this.editingCategoryBook || this.activeModalBook;
    if (!book) return;

    const select = document.getElementById('edit-category-select');
    let chosenGenre = select.value;

    if (chosenGenre === '__custom__') {
      const customVal = document.getElementById('edit-custom-category-input').value.trim();
      if (!customVal) {
        alert('Please enter a custom genre name or pick an existing one.');
        return;
      }
      chosenGenre = customVal;

      // Add to custom genres list
      try {
        let customList = JSON.parse(localStorage.getItem('homelibrary_custom_genres')) || [];
        if (!customList.includes(chosenGenre)) {
          customList.push(chosenGenre);
          localStorage.setItem('homelibrary_custom_genres', JSON.stringify(customList));
        }
      } catch (e) {}
    }

    const subgenresRaw = document.getElementById('edit-subgenres-input').value;
    const subGenres = subgenresRaw.split(',').map(s => s.trim()).filter(Boolean);

    // Selected shelf radio
    const selectedShelfRadio = document.querySelector('input[name="shelf-placement"]:checked');
    const newShelf = selectedShelfRadio ? selectedShelfRadio.value : (book.shelf || 'popular');

    // Update book object
    book.genre = chosenGenre;
    book.subGenres = subGenres;
    book.shelf = newShelf;

    // Save to IndexedDB if imported/IDB book
    if (this.db) {
      try {
        await this.saveToDB(book);
      } catch (e) {}
    }

    // Save override to localStorage
    localStorage.setItem(`cat_${book.id}`, JSON.stringify({
      genre: chosenGenre,
      subGenres: subGenres,
      shelf: newShelf
    }));

    // Update Details Modal if open
    const modalGenreChip = document.getElementById('modal-genre-chip');
    if (modalGenreChip) {
      modalGenreChip.textContent = `${chosenGenre} ✏️`;
    }

    // Refresh Sidebar & Shelves
    this.renderSidebar();
    this.renderShelves();

    this.closeEditCategoryModal();

    // Subtle feedback notification
    this.showToast(`Updated "${book.title}" category to "${chosenGenre}" on ${newShelf} shelf!`);
  },

  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:#1e1d29; color:#f5a623; border:1px solid rgba(245,166,35,0.4); padding:12px 20px; border-radius:10px; font-size:13px; font-weight:600; box-shadow:0 8px 30px rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; gap:8px; animation:fadeInView 0.2s ease;';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✓</span> <span>${this.escape(message)}</span>`;
    toast.style.display = 'flex';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  },

  // --------------------------------------------------------------------------
  // FILTERING & SEARCH
  // --------------------------------------------------------------------------
  filterByGenre(genreName) {
    if (this.selectedGenre === genreName) {
      this.selectedGenre = null; // Toggle off
    } else {
      this.selectedGenre = genreName;
      this.selectedWriter = null;
    }
    this.renderSidebar();
    this.renderShelves();
  },

  filterByWriter(writerName) {
    if (this.selectedWriter === writerName) {
      this.selectedWriter = null;
    } else {
      this.selectedWriter = writerName;
      this.selectedGenre = null;
    }
    this.renderSidebar();
    this.renderShelves();
  },

  resetFilters() {
    this.selectedGenre = null;
    this.selectedWriter = null;
    this.selectedShelf = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    this.renderSidebar();
    this.renderShelves();
  },

  // --------------------------------------------------------------------------
  // FILE IMPORT & DRAG AND DROP
  // --------------------------------------------------------------------------
  initDragAndDrop() {
    const overlay = document.getElementById('dropzone-overlay');
    if (!overlay) return;

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      overlay.classList.add('is-active');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.clientX <= 0 || e.clientY <= 0) {
        overlay.classList.remove('is-active');
      }
    });

    overlay.addEventListener('dragleave', () => {
      overlay.classList.remove('is-active');
    });

    overlay.addEventListener('drop', async (e) => {
      e.preventDefault();
      overlay.classList.remove('is-active');
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await this.handleFilesImport(files);
      }
    });
  },

  async handleFilesImport(files) {
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      try {
        let newBook = {
          id: bookId,
          title: baseName.replace(/_/g, ' '),
          author: 'Imported Author',
          cover: 'assets/covers/default_cover.png',
          rating: 5,
          reviewsCount: 1,
          genre: 'Fiction',
          pages: 100,
          format: ext.toUpperCase(),
          language: 'English',
          published: new Date().getFullYear().toString(),
          readingTime: '3h',
          shelf: 'imported',
          progress: 0,
          currentPage: 1,
          isImported: true,
          chapters: []
        };

        if (ext === 'pdf') {
          console.log('[Import] Starting PDF processing:', file.name, 'Size:', file.size);
          newBook.fileBlob = file;
          
          const doc = await PdfParser.loadDocument(file);
          console.log('[Import] PDF loaded successfully, total pages:', doc.numPages);
          
          const meta = await PdfParser.getMetadata(doc);
          if (meta.title && meta.title.trim() && !meta.title.toLowerCase().includes('untitled')) {
            newBook.title = meta.title.trim();
          }
          if (meta.author && meta.author.trim() && !meta.author.toLowerCase().includes('unknown')) {
            newBook.author = meta.author.trim();
          }
          newBook.pages = meta.numPages || 1;

          // Generate cover thumbnail directly from loaded doc Page 1
          console.log('[Import] Calling renderPageToCanvas for thumbnail...');
          try {
            const canvas = document.createElement('canvas');
            await PdfParser.renderPageToCanvas(doc, 1, canvas, 200);
            newBook.cover = canvas.toDataURL('image/png');
            console.log('[Import] Generated thumbnail from page 1');
          } catch (covErr) {
            console.warn('[Import] Cover generation fallback:', covErr);
          }

          try {
            newBook.chapters = await PdfParser.extractChapters(doc);
          } catch (chErr) {
            newBook.chapters = [];
          }
        } else if (ext === 'epub') {
          newBook.fileBlob = file;
          const buffer = await file.arrayBuffer();
          const parsed = await EpubParser.parse(buffer.slice(0));
          if (parsed.metadata.title) newBook.title = parsed.metadata.title;
          if (parsed.metadata.author) newBook.author = parsed.metadata.author;
          if (parsed.coverUrl) newBook.cover = parsed.coverUrl;
          newBook.chapters = parsed.chapters;
          newBook.pages = Math.max(50, parsed.chapters.length * 15);
        } else if (ext === 'docx') {
          newBook.fileBlob = file;
          const buffer = await file.arrayBuffer();
          const parsed = await DocxParser.parse(buffer.slice(0));
          newBook.chapters = parsed.chapters;
          newBook.pages = Math.max(20, parsed.chapters.length * 10);
        } else if (ext === 'txt' || ext === 'md') {
          const text = await file.text();
          const parsed = TxtParser.parse(text, newBook.title);
          newBook.chapters = parsed.chapters;
          newBook.pages = Math.max(15, parsed.chapters.length * 8);
        } else {
          alert(`File format .${ext} is not yet supported. Please import PDF, EPUB, DOCX, or TXT.`);
          continue;
        }

        console.log('[Import] Saving book to IndexedDB:', newBook.title);
        // Save into IndexedDB & state
        await this.saveToDB(newBook);
        console.log('[Import] Successfully saved to IndexedDB!');
        this.books.push(newBook);
        this.renderShelves();
        if (typeof window.onBookImported === 'function') {
          window.onBookImported(newBook);
        } else {
          alert(`Successfully added "${newBook.title}" to your Library!`);
        }
      } catch (err) {
        console.error('[Import] Error importing book:', err);
        alert(`Error importing ${file.name}: ${err.message}`);
      }
    }
  },

  // --------------------------------------------------------------------------
  // THEMES & CONTROLS
  // --------------------------------------------------------------------------
  setAppTheme(themeName) {
    this.appTheme = themeName;
    document.documentElement.setAttribute('data-app-theme', themeName);
    localStorage.setItem('homelibrary_theme', themeName);

    // Sync reader theme if open
    if (window.ReaderEngine) {
      ReaderEngine.setTheme(themeName);
    }
  },

  toggleWarmthPopover() {
    const popover = document.getElementById('warmth-popover');
    popover.classList.toggle('is-open');
  },

  toggleFullscreen() {
    const appWin = document.querySelector('.app-window');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      appWin.classList.add('is-fullscreen');
    } else {
      document.exitFullscreen().catch(() => {});
      appWin.classList.remove('is-fullscreen');
    }
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderShelves();
      });
    }

    // Import file button
    const filePicker = document.getElementById('file-picker-input');
    const importBtn = document.getElementById('btn-import-book');
    const sideImportBtn = document.getElementById('sidebar-import-btn');

    if (filePicker) {
      filePicker.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          await this.handleFilesImport(Array.from(e.target.files));
        }
      });
    }

    if (importBtn && filePicker) {
      importBtn.onclick = () => filePicker.click();
    }
    if (sideImportBtn && filePicker) {
      sideImportBtn.onclick = () => filePicker.click();
    }

    // Theme Switcher button
    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.onclick = () => {
        const themes = ['dark', 'light', 'sepia', 'night', 'amoled'];
        const nextIdx = (themes.indexOf(this.appTheme) + 1) % themes.length;
        this.setAppTheme(themes[nextIdx]);
      };
    }

    // Warmth slider
    const warmthSlider = document.getElementById('app-warmth-slider');
    if (warmthSlider) {
      warmthSlider.oninput = (e) => {
        const val = e.target.value;
        const overlay = document.getElementById('night-light-overlay');
        if (overlay) overlay.style.opacity = (val / 100) * 0.45;
        document.getElementById('warmth-popover-val').textContent = `${val}%`;
      };
    }

    // Book Details Modal Close
    const modalClose = document.getElementById('modal-close-btn');
    const modalBackdrop = document.getElementById('book-details-modal');
    if (modalClose) modalClose.onclick = () => this.closeBookDetails();
    if (modalBackdrop) {
      modalBackdrop.onclick = (e) => {
        if (e.target === modalBackdrop) this.closeBookDetails();
      };
    }

    // Profile Stats Modal Backdrop Close
    const profBackdrop = document.getElementById('profile-stats-modal');
    if (profBackdrop) {
      profBackdrop.onclick = (e) => {
        if (e.target === profBackdrop) this.closeProfileStatsModal();
      };
    }

    // Keyboard ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeBookDetails();
        this.closeProfileStatsModal();
      }
    });
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

/**
 * ArchiveApp - Controller for Internet Archive Downloader & OCR Files View
 */
const ArchiveApp = {
  activeMetadata: null,
  activeOcrRecords: [],

  loadSample(identifier) {
    const input = document.getElementById('archive-url-input');
    if (input) input.value = identifier;
    this.fetchMetadata();
  },

  async fetchMetadata() {
    const input = document.getElementById('archive-url-input');
    const url = input ? input.value.trim() : '';
    if (!url) {
      alert('Please enter an Internet Archive URL or book identifier.');
      return;
    }

    const identifier = ArchiveImporter.extractIdentifier(url);
    if (!identifier) {
      alert('Could not determine Archive Identifier from the provided link. Please check the URL.');
      return;
    }

    const btn = document.getElementById('archive-fetch-btn');
    const label = document.getElementById('fetch-btn-label');
    if (label) label.textContent = 'Inspecting...';
    if (btn) btn.disabled = true;

    try {
      const meta = await ArchiveImporter.fetchMetadata(identifier);
      this.activeMetadata = meta;
      this.renderMetadataCard(meta);
    } catch (err) {
      console.error('[ArchiveApp] Error fetching metadata:', err);
      alert(`Failed to fetch metadata for "${identifier}": ${err.message}`);
    } finally {
      if (label) label.textContent = 'Inspect Book';
      if (btn) btn.disabled = false;
    }
  },

  renderMetadataCard(meta) {
    const card = document.getElementById('archive-details-card');
    if (!card) return;

    const coverEl = document.getElementById('archive-preview-cover');
    if (coverEl) coverEl.src = meta.coverUrl;
    
    document.getElementById('archive-preview-title').textContent = meta.title;
    document.getElementById('archive-preview-author').textContent = meta.author || 'Internet Archive';
    document.getElementById('archive-preview-year').textContent = meta.date || 'Historic Edition';
    document.getElementById('archive-preview-pages').textContent = meta.imagecount ? `${meta.imagecount} Pages` : 'Scanned Document';
    
    // Clean description HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = meta.description || 'No description available.';
    document.getElementById('archive-preview-desc').textContent = tmp.textContent.trim().slice(0, 300) + '...';

    // Detected format pills
    const formatsRow = document.getElementById('archive-detected-formats');
    if (formatsRow) {
      formatsRow.innerHTML = '';
      const det = meta.detectedFiles;
      if (det.pdf) {
        formatsRow.innerHTML += `<span class="detected-format-badge">&#128196; PDF: ${this.escape(det.pdf.name)}</span>`;
      }
      if (det.ocr) {
        formatsRow.innerHTML += `<span class="detected-format-badge">&#128269; OCR DjVu: ${this.escape(det.ocr.name)}</span>`;
      }
      if (det.epub) {
        formatsRow.innerHTML += `<span class="detected-format-badge">&#128214; EPUB: ${this.escape(det.epub.name)}</span>`;
      }
      if (det.txt) {
        formatsRow.innerHTML += `<span class="detected-format-badge">&#128221; Text: ${this.escape(det.txt.name)}</span>`;
      }
    }

    // Toggle options availability based on detected files
    const optPdf = document.getElementById('opt-download-pdf');
    const optOcr = document.getElementById('opt-process-ocr');
    if (optPdf) optPdf.disabled = !meta.detectedFiles.pdf;
    if (optOcr) optOcr.disabled = !meta.detectedFiles.ocr;

    card.style.display = 'flex';
  },

  async startDownload() {
    if (!this.activeMetadata) {
      alert('Please inspect an Archive book first.');
      return;
    }

    const downloadPdf = document.getElementById('opt-download-pdf').checked;
    const processOcr = document.getElementById('opt-process-ocr').checked;
    const generateDocx = document.getElementById('opt-generate-docx').checked;
    const generateRag = document.getElementById('opt-generate-rag').checked;

    if (!downloadPdf && !processOcr && !generateDocx && !generateRag) {
      alert('Please select at least one format or action to perform.');
      return;
    }

    // Show Progress Card
    const progressCard = document.getElementById('archive-progress-card');
    const successBanner = document.getElementById('archive-success-banner');
    const logTerminal = document.getElementById('archive-log-terminal');
    const startBtn = document.getElementById('archive-start-btn');

    if (progressCard) progressCard.style.display = 'flex';
    if (successBanner) successBanner.style.display = 'none';
    if (logTerminal) logTerminal.innerHTML = '';
    if (startBtn) startBtn.disabled = true;

    const appendLog = (msg) => {
      if (!logTerminal) return;
      const time = new Date().toLocaleTimeString();
      logTerminal.innerHTML += `[${time}] ${msg}\n`;
      logTerminal.scrollTop = logTerminal.scrollHeight;
    };

    const updateStage = (stageId, status) => {
      const el = document.getElementById(stageId);
      if (el) {
        el.classList.remove('active', 'done');
        if (status) el.classList.add(status);
      }
    };

    appendLog(`Starting import pipeline for: ${this.activeMetadata.title}`);
    appendLog(`Identifier: ${this.activeMetadata.identifier}`);
    updateStage('stage-meta', 'active');

    const options = {
      identifier: this.activeMetadata.identifier,
      metadata: this.activeMetadata,
      options: { downloadPdf, processOcr, generateDocx, generateRag }
    };

    await ArchiveImporter.startImport(options, {
      onStep: (stepName, percent) => {
        const titleEl = document.getElementById('progress-step-title');
        const fillEl = document.getElementById('progress-bar-fill');
        const pctEl = document.getElementById('progress-percent-val');
        
        if (titleEl) titleEl.textContent = stepName;
        if (fillEl) fillEl.style.width = `${percent}%`;
        if (pctEl) pctEl.textContent = `${percent}%`;

        appendLog(stepName);

        // Highlight stages
        if (percent >= 20 && percent < 50) {
          updateStage('stage-meta', 'done');
          updateStage('stage-pdf', 'active');
        } else if (percent >= 50 && percent < 70) {
          updateStage('stage-pdf', 'done');
          updateStage('stage-ocr', 'active');
        } else if (percent >= 70 && percent < 85) {
          updateStage('stage-ocr', 'done');
          updateStage('stage-extract', 'active');
        } else if (percent >= 85 && percent < 92) {
          updateStage('stage-extract', 'done');
          updateStage('stage-docx', 'active');
        } else if (percent >= 92 && percent < 100) {
          updateStage('stage-docx', 'done');
          updateStage('stage-save', 'active');
        }
      },
      onProgress: (statusStr, pct) => {
        const substatusEl = document.getElementById('progress-substatus');
        if (substatusEl) substatusEl.textContent = statusStr;
      },
      onError: (err) => {
        appendLog(`ERROR: ${err.message}`);
        alert(`Download failed: ${err.message}`);
        if (startBtn) startBtn.disabled = false;
      },
      onSuccess: (result) => {
        // Complete all stages
        ['stage-meta', 'stage-pdf', 'stage-ocr', 'stage-extract', 'stage-docx', 'stage-save'].forEach(id => {
          updateStage(id, 'done');
        });

        const fillEl = document.getElementById('progress-bar-fill');
        const pctEl = document.getElementById('progress-percent-val');
        const titleEl = document.getElementById('progress-step-title');
        const substatusEl = document.getElementById('progress-substatus');

        if (fillEl) fillEl.style.width = '100%';
        if (pctEl) pctEl.textContent = '100%';
        if (titleEl) titleEl.textContent = 'Import & Extraction Complete!';
        if (substatusEl) substatusEl.textContent = 'All files organized offline & added to Library.';

        appendLog('SUCCESS: All files successfully organized in "Internet Archive Books/" and offline database.');
        if (successBanner) successBanner.style.display = 'flex';
        if (startBtn) startBtn.disabled = false;

        // Refresh library shelves
        LibraryApp.renderShelves();
      }
    });
  },

  async renderOcrList() {
    const grid = document.getElementById('ocr-cards-grid');
    const emptyState = document.getElementById('ocr-empty-state');
    const counterEl = document.getElementById('ocr-records-count');
    if (!grid) return;

    this.activeOcrRecords = await ArchiveImporter.getAllOcrRecords();
    if (counterEl) counterEl.textContent = `${this.activeOcrRecords.length} items`;

    if (this.activeOcrRecords.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    grid.innerHTML = '';

    this.activeOcrRecords.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'ocr-book-card';
      card.setAttribute('data-id', rec.id);

      const wordsCount = rec.txtContent ? rec.txtContent.split(/\s+/).length : (rec.pageCount * 300);

      card.innerHTML = `
        <div class="ocr-card-top">
          <img src="${rec.cover || 'assets/covers/default_cover.png'}" class="ocr-card-cover" alt="${this.escape(rec.title)}">
          <div class="ocr-card-meta">
            <span class="ocr-card-badge">&#128269; OCR Extracted</span>
            <div class="ocr-card-title">${this.escape(rec.title)}</div>
            <div class="ocr-card-author">by ${this.escape(rec.author || 'Archive Author')}</div>
          </div>
        </div>

        <div class="ocr-card-stats-row">
          <span><strong>${rec.pageCount}</strong> Pages</span>
          <span>&bull;</span>
          <span>~<strong>${wordsCount.toLocaleString()}</strong> Words</span>
          <span>&bull;</span>
          <span>${rec.dateImported || 'Today'}</span>
        </div>

        <div class="ocr-card-actions">
          <button class="ocr-read-btn" onclick="ArchiveApp.readOcrBook('${rec.id}')">
            &#128214; Read as Book
          </button>
          <button class="ocr-dl-btn" onclick="ArchiveApp.downloadOcrDocx('${rec.id}')" title="Download Word DOCX (Nirmala UI)">
            .DOCX
          </button>
          <button class="ocr-dl-btn" onclick="ArchiveApp.downloadOcrTxt('${rec.id}')" title="Download Clean Text">
            .TXT
          </button>
          <button class="ocr-dl-btn" onclick="ArchiveApp.downloadOcrJson('${rec.id}')" title="Download Structured JSON">
            .JSON
          </button>
          <button class="ocr-del-btn" onclick="ArchiveApp.deleteOcrRecord('${rec.id}')" title="Delete record">
            &times;
          </button>
        </div>
      `;

      grid.appendChild(card);
    });
  },

  filterOcrCards(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('.ocr-book-card').forEach(card => {
      const title = card.querySelector('.ocr-card-title')?.textContent.toLowerCase() || '';
      const author = card.querySelector('.ocr-card-author')?.textContent.toLowerCase() || '';
      card.style.display = (title.includes(q) || author.includes(q)) ? 'flex' : 'none';
    });
  },

  async readOcrBook(id) {
    const rec = this.activeOcrRecords.find(r => r.id === id);
    if (!rec) return;

    // Open directly in ReaderEngine!
    ReaderEngine.openBook(rec, 1);
  },

  downloadOcrDocx(id) {
    const rec = this.activeOcrRecords.find(r => r.id === id);
    if (!rec || !rec.docxBlob) {
      alert('Word document (.docx) was not generated for this item.');
      return;
    }
    const filename = `${rec.title.replace(/[^\w\s-]/g, '').trim() || 'book'}_Extracted.docx`;
    ArchiveImporter.downloadFile(rec.docxBlob, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  },

  downloadOcrTxt(id) {
    const rec = this.activeOcrRecords.find(r => r.id === id);
    if (!rec || !rec.txtContent) {
      alert('TXT content is empty.');
      return;
    }
    const filename = `${rec.title.replace(/[^\w\s-]/g, '').trim() || 'book'}_Clean.txt`;
    ArchiveImporter.downloadFile(rec.txtContent, filename, 'text/plain;charset=utf-8');
  },

  downloadOcrJson(id) {
    const rec = this.activeOcrRecords.find(r => r.id === id);
    if (!rec || !rec.jsonContent) {
      alert('JSON content is empty.');
      return;
    }
    const filename = `${rec.title.replace(/[^\w\s-]/g, '').trim() || 'book'}_RAG.json`;
    ArchiveImporter.downloadFile(rec.jsonContent, filename, 'application/json;charset=utf-8');
  },

  async deleteOcrRecord(id) {
    if (!confirm('Are you sure you want to remove this extracted OCR record?')) return;
    await ArchiveImporter.deleteOcrRecord(id);
    this.renderOcrList();
  },

  escape(str) {
    return LibraryApp.escape(str);
  }
};

window.ArchiveApp = ArchiveApp;

window.addEventListener('DOMContentLoaded', () => {
  LibraryApp.init();
});

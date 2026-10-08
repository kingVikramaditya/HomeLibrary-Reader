/**
 * HomeLibrary - EPUB Parser
 * Parses EPUB archives using JSZip
 * Extracts metadata, cover image, spine, and chapter XHTML
 */

const EpubParser = {
  async parse(fileOrBuffer) {
    if (!window.JSZip) {
      throw new Error('JSZip library is not loaded.');
    }

    const zip = await JSZip.loadAsync(fileOrBuffer);

    // 1. Read META-INF/container.xml
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) {
      throw new Error('Invalid EPUB: META-INF/container.xml missing');
    }
    const containerXml = await containerFile.async('text');
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const rootfileEl = containerDoc.querySelector('rootfile');
    const opfPath = rootfileEl ? rootfileEl.getAttribute('full-path') : 'OEBPS/content.opf';

    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

    // 2. Read OPF file
    const opfFile = zip.file(opfPath);
    if (!opfFile) {
      throw new Error(`OPF file not found at ${opfPath}`);
    }
    const opfXml = await opfFile.async('text');
    const opfDoc = parser.parseFromString(opfXml, 'application/xml');

    // 3. Extract Metadata
    const titleEl = opfDoc.querySelector('title') || opfDoc.querySelector('dc\\:title');
    const creatorEl = opfDoc.querySelector('creator') || opfDoc.querySelector('dc\\:creator');
    const langEl = opfDoc.querySelector('language') || opfDoc.querySelector('dc\\:language');

    const metadata = {
      title: titleEl ? titleEl.textContent.trim() : 'Untitled EPUB',
      author: creatorEl ? creatorEl.textContent.trim() : 'Unknown Author',
      language: langEl ? langEl.textContent.trim() : 'en'
    };

    // 4. Extract Manifest Items
    const manifestItems = {};
    const itemEls = opfDoc.querySelectorAll('manifest > item');
    itemEls.forEach(el => {
      const id = el.getAttribute('id');
      const href = el.getAttribute('href');
      const mediaType = el.getAttribute('media-type');
      manifestItems[id] = { id, href, mediaType };
    });

    // 5. Extract Cover Image if available
    let coverUrl = null;
    let coverItemId = null;

    // Check meta name="cover"
    const metaCover = opfDoc.querySelector('meta[name="cover"]');
    if (metaCover) {
      coverItemId = metaCover.getAttribute('content');
    }
    // Check item with properties="cover-image"
    if (!coverItemId) {
      const itemWithCoverProp = opfDoc.querySelector('item[properties~="cover-image"]');
      if (itemWithCoverProp) {
        coverItemId = itemWithCoverProp.getAttribute('id');
      }
    }
    // Check manifest for cover id or image filename containing 'cover'
    if (!coverItemId) {
      for (const id in manifestItems) {
        if (id.toLowerCase().includes('cover') && manifestItems[id].mediaType.startsWith('image/')) {
          coverItemId = id;
          break;
        }
      }
    }

    if (coverItemId && manifestItems[coverItemId]) {
      const coverItem = manifestItems[coverItemId];
      const fullCoverPath = opfDir + coverItem.href;
      const coverZipFile = zip.file(fullCoverPath) || zip.file(coverItem.href);
      if (coverZipFile) {
        const coverBlob = await coverZipFile.async('blob');
        coverUrl = URL.createObjectURL(coverBlob);
      }
    }

    // 6. Extract Spine / Chapters
    const spineEls = opfDoc.querySelectorAll('spine > itemref');
    const chapters = [];

    for (let i = 0; i < spineEls.length; i++) {
      const idref = spineEls[i].getAttribute('idref');
      const item = manifestItems[idref];
      if (item) {
        const chapterPath = opfDir + item.href;
        const chapterFile = zip.file(chapterPath) || zip.file(item.href);
        if (chapterFile) {
          const rawHtml = await chapterFile.async('text');
          const chDoc = parser.parseFromString(rawHtml, 'text/html');

          // Clean body content
          const bodyEl = chDoc.querySelector('body');
          const titleTag = chDoc.querySelector('title') || chDoc.querySelector('h1') || chDoc.querySelector('h2');
          const chapterTitle = titleTag ? titleTag.textContent.trim() : `Chapter ${i + 1}`;

          // Inline resolve relative images in this chapter
          const imgEls = bodyEl ? bodyEl.querySelectorAll('img') : [];
          for (const img of imgEls) {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('data:')) {
              const fullImgPath = (chapterPath.includes('/') ? chapterPath.substring(0, chapterPath.lastIndexOf('/') + 1) : '') + src;
              const imgFile = zip.file(fullImgPath) || zip.file(src);
              if (imgFile) {
                const imgBlob = await imgFile.async('blob');
                img.src = URL.createObjectURL(imgBlob);
              }
            }
          }

          chapters.push({
            title: chapterTitle,
            content: bodyEl ? bodyEl.innerHTML : rawHtml
          });
        }
      }
    }

    return {
      metadata,
      coverUrl,
      chapters
    };
  }
};

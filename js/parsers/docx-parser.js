/**
 * HomeLibrary - DOCX Parser
 * Parses Microsoft Word DOCX files into styled HTML and chapters using Mammoth.js
 */

const DocxParser = {
  async parse(fileOrBuffer) {
    if (!window.mammoth) {
      throw new Error('Mammoth.js library is not loaded.');
    }

    let arrayBuffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
      arrayBuffer = fileOrBuffer;
    } else if (fileOrBuffer instanceof Blob) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      throw new Error('Unsupported DOCX source');
    }

    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
    const fullHtml = result.value;

    // Split into chapters by <h1> or <h2> or default chunks
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;

    const chapters = [];
    let currentChapter = {
      title: 'Chapter 1: Introduction',
      content: ''
    };

    const children = Array.from(tempDiv.children);
    if (children.length === 0) {
      chapters.push({
        title: 'Document Content',
        content: fullHtml || '<p>Empty document</p>'
      });
    } else {
      let isFirst = true;
      for (const el of children) {
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'h1' || (tagName === 'h2' && el.textContent.toLowerCase().includes('chapter'))) {
          if (!isFirst && currentChapter.content.trim().length > 0) {
            chapters.push(currentChapter);
          }
          isFirst = false;
          currentChapter = {
            title: el.textContent.trim(),
            content: el.outerHTML
          };
        } else {
          currentChapter.content += el.outerHTML;
        }
      }
      if (currentChapter.content.trim().length > 0) {
        chapters.push(currentChapter);
      }
    }

    return {
      chapters: chapters.length > 0 ? chapters : [{ title: 'Chapter 1', content: fullHtml }]
    };
  }
};

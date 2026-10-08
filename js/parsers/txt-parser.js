/**
 * HomeLibrary - TXT & Markdown Parser
 * Parses plain text and Markdown into beautifully formatted book chapters
 */

const TxtParser = {
  parse(rawText, title = 'Untitled Book') {
    if (!rawText) {
      return { chapters: [{ title: 'Chapter 1', content: '<p>No content</p>' }] };
    }

    // Normalize line endings
    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Regex to match chapter markers (e.g., CHAPTER 1, Chapter I, Part 1, Act I, etc.)
    const chapterPattern = /(?:^|\n\n)(?:#+\s+|)(CHAPTER\s+[0-9IVXLCDM]+[^\n]*|PART\s+[0-9IVXLCDM]+[^\n]*|PROLOGUE[^\n]*|EPILOGUE[^\n]*)(?:\n|$)/gi;

    const sections = [];
    let lastIndex = 0;
    let match;

    const matches = [];
    while ((match = chapterPattern.exec(text)) !== null) {
      matches.push({
        title: match[1].replace(/^#+\s*/, '').trim(),
        index: match.index
      });
    }

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
        const chapterBody = text.substring(start, end).trim();

        // Convert chapterBody to paragraphs
        const lines = chapterBody.split(/\n\s*\n/);
        let html = '';
        lines.forEach(para => {
          const clean = para.trim();
          if (clean.length > 0) {
            if (clean.toLowerCase().startsWith('chapter') || clean.toLowerCase().startsWith('part') || clean.toLowerCase().startsWith('prologue') || clean.toLowerCase().startsWith('epilogue')) {
              html += `<h2>${this.escapeHtml(clean)}</h2>`;
            } else {
              html += `<p>${this.formatTypography(clean)}</p>`;
            }
          }
        });

        sections.push({
          title: matches[i].title,
          content: html
        });
      }
    } else {
      // No explicit chapter markers; split every ~800 words into readable chapters
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      let currentChapter = {
        title: 'Chapter 1',
        content: ''
      };
      let wordCount = 0;
      let chapterNum = 1;

      paragraphs.forEach(para => {
        const words = para.trim().split(/\s+/).length;
        wordCount += words;
        currentChapter.content += `<p>${this.formatTypography(para.trim())}</p>`;

        if (wordCount > 750) {
          sections.push(currentChapter);
          chapterNum++;
          currentChapter = {
            title: `Chapter ${chapterNum}`,
            content: ''
          };
          wordCount = 0;
        }
      });

      if (currentChapter.content.length > 0) {
        sections.push(currentChapter);
      }
    }

    return {
      chapters: sections.length > 0 ? sections : [{ title: 'Chapter 1', content: `<p>${this.escapeHtml(text)}</p>` }]
    };
  },

  formatTypography(str) {
    let s = this.escapeHtml(str);
    // Convert *italic* or _italic_
    s = s.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    // Convert **bold** or __bold__
    s = s.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
    // Convert quotes to smart quotes
    s = s.replace(/"([^"]*)"/g, '&ldquo;$1&rdquo;');
    s = s.replace(/'([^']*)'/g, '&lsquo;$1&rsquo;');
    // Preserve single line breaks inside paragraph
    s = s.replace(/\n/g, '<br>');
    return s;
  },

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

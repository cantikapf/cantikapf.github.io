/**
 * Editor — WYSIWYG Content Editor with Template Forms
 * Portfolio CMS for cantikapf.github.io
 */
window.CMS = window.CMS || {};

window.CMS.Editor = (function () {
  'use strict';

  let currentItem = null; // { sectionKey, itemId }

  function init() {
    // No-op for now
  }

  /* ---- Open editor modal ---- */
  function open(sectionKey, itemId) {
    const data = window.CMS.state.data;
    if (!data[sectionKey] || !data[sectionKey][itemId]) {
      window.CMS.toast('Item tidak ditemukan di data.js', 'error');
      return;
    }

    currentItem = { sectionKey, itemId };
    const item = data[sectionKey][itemId];
    const cfg = window.CMS.Core.getSectionConfig(sectionKey);

    const overlay = document.createElement('div');
    overlay.className = 'cms-modal-overlay';
    overlay.id = 'editor-modal';
    overlay.innerHTML = `
      <div class="cms-modal cms-modal-lg" style="max-height: 92vh;">
        <div class="cms-modal-header">
          <h3>📝 Edit Detail — ${escapeHtml(item.title || itemId)}</h3>
          <button class="cms-modal-close" onclick="CMS.Editor.close()">✕</button>
        </div>
        <div class="cms-modal-body" style="padding: 0;">
          <div class="cms-tabs" style="padding: 0 24px; margin-bottom: 0;">
            <button class="cms-tab active" onclick="CMS.Editor.switchEditorTab(this, 'form')">📋 Form Editor</button>
            <button class="cms-tab" onclick="CMS.Editor.switchEditorTab(this, 'source')">💻 HTML Source</button>
            <button class="cms-tab" onclick="CMS.Editor.switchEditorTab(this, 'preview')">👁️ Preview</button>
          </div>

          <!-- Form Editor Tab -->
          <div id="editor-tab-form" style="padding: 24px; max-height: 60vh; overflow-y: auto;">
            ${renderFormFields(sectionKey, itemId, item)}
          </div>

          <!-- Source Editor Tab -->
          <div id="editor-tab-source" style="display: none; padding: 0;">
            <div class="cms-form-group" style="padding: 16px 24px 0;">
              <label class="cms-form-label">Title (judul tab browser)</label>
              <input class="cms-form-input" id="editor-title" value="${escapeHtml(item.title || '')}">
            </div>
            <textarea class="cms-editor-source" id="editor-source" style="padding: 16px 24px;">${escapeHtml(item.content || '')}</textarea>
          </div>

          <!-- Preview Tab -->
          <div id="editor-tab-preview" style="display: none; padding: 24px;">
            <div style="background: #fff; border-radius: 8px; padding: 24px; color: #333; min-height: 300px;" id="editor-preview-content">
              <!-- Preview will be rendered here -->
            </div>
          </div>
        </div>
        <div class="cms-modal-footer">
          <button class="cms-btn cms-btn-secondary" onclick="CMS.Editor.close()">Batal</button>
          <button class="cms-btn cms-btn-primary" onclick="CMS.Editor.save()">💾 Simpan Perubahan</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /* ---- Render form fields based on section type ---- */
  function renderFormFields(sectionKey, itemId, item) {
    // Parse existing content to pre-fill form fields
    const parsed = parseContent(sectionKey, item.content || '');

    let html = `
      <div class="cms-form-group">
        <label class="cms-form-label">Title (judul tab browser)</label>
        <input class="cms-form-input" id="form-title" value="${escapeHtml(item.title || '')}">
      </div>
    `;

    if (sectionKey === 'projects') {
      html += `
        <div class="cms-form-group">
          <label class="cms-form-label">Nama Project</label>
          <input class="cms-form-input" id="form-name" value="${escapeHtml(parsed.name || '')}">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="cms-form-group">
            <label class="cms-form-label">Kategori</label>
            <input class="cms-form-input" id="form-category" value="${escapeHtml(parsed.category || '')}" placeholder="Web Development, Data Analytics, dll">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Tahun</label>
            <input class="cms-form-input" id="form-year" value="${escapeHtml(parsed.year || '')}" placeholder="2026">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="cms-form-group">
            <label class="cms-form-label">Website URL</label>
            <input class="cms-form-input" id="form-url" value="${escapeHtml(parsed.url || '')}" placeholder="https://...">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">GitHub URL</label>
            <input class="cms-form-input" id="form-github" value="${escapeHtml(parsed.github || '')}" placeholder="https://github.com/...">
          </div>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Deskripsi Singkat (1 baris)</label>
          <input class="cms-form-input" id="form-oneliner" value="${escapeHtml(parsed.oneliner || '')}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Deskripsi Lengkap</label>
          <textarea class="cms-form-textarea" id="form-description" rows="5">${escapeHtml(parsed.description || '')}</textarea>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Banner Image Path</label>
          <div style="display: flex; gap: 8px;">
            <input class="cms-form-input" id="form-banner" value="${escapeHtml(parsed.banner || '')}" style="flex:1;">
            <button class="cms-btn cms-btn-sm cms-btn-secondary" onclick="CMS.Editor.pickImage('form-banner')">🖼️</button>
          </div>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Screenshot Image Path (untuk browser frame)</label>
          <div style="display: flex; gap: 8px;">
            <input class="cms-form-input" id="form-screenshot" value="${escapeHtml(parsed.screenshot || '')}" style="flex:1;">
            <button class="cms-btn cms-btn-sm cms-btn-secondary" onclick="CMS.Editor.pickImage('form-screenshot')">🖼️</button>
          </div>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Project Highlights (satu per baris)</label>
          <textarea class="cms-form-textarea" id="form-highlights" rows="4" placeholder="Satu highlight per baris">${escapeHtml((parsed.highlights || []).join('\n'))}</textarea>
        </div>
      `;
    } else if (sectionKey === 'experience') {
      html += `
        <div class="cms-form-group">
          <label class="cms-form-label">Nama Perusahaan</label>
          <input class="cms-form-input" id="form-name" value="${escapeHtml(parsed.name || '')}">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="cms-form-group">
            <label class="cms-form-label">Posisi / Jabatan</label>
            <input class="cms-form-input" id="form-position" value="${escapeHtml(parsed.position || '')}">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Lokasi</label>
            <input class="cms-form-input" id="form-location" value="${escapeHtml(parsed.location || 'Jakarta, Indonesia')}">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="cms-form-group">
            <label class="cms-form-label">Tanggal Mulai</label>
            <input class="cms-form-input" id="form-start" value="${escapeHtml(parsed.start || '')}" placeholder="Jan 2025">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Tanggal Selesai</label>
            <input class="cms-form-input" id="form-end" value="${escapeHtml(parsed.end || '')}" placeholder="Jul 2025">
          </div>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Deskripsi Perusahaan</label>
          <textarea class="cms-form-textarea" id="form-company-desc" rows="3">${escapeHtml(parsed.companyDesc || '')}</textarea>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Foto Perusahaan</label>
          <div style="display: flex; gap: 8px;">
            <input class="cms-form-input" id="form-company-img" value="${escapeHtml(parsed.companyImg || '')}" style="flex:1;">
            <button class="cms-btn cms-btn-sm cms-btn-secondary" onclick="CMS.Editor.pickImage('form-company-img')">🖼️</button>
          </div>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Deskripsi Pekerjaan</label>
          <textarea class="cms-form-textarea" id="form-description" rows="5">${escapeHtml(parsed.description || '')}</textarea>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Work Portfolio / Achievements (satu per baris)</label>
          <textarea class="cms-form-textarea" id="form-highlights" rows="4" placeholder="Satu achievement per baris">${escapeHtml((parsed.highlights || []).join('\n'))}</textarea>
        </div>
      `;
    } else if (sectionKey === 'works') {
      html += `
        <div class="cms-form-group">
          <label class="cms-form-label">Judul Paper / Research</label>
          <input class="cms-form-input" id="form-name" value="${escapeHtml(parsed.name || '')}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Abstrak / Penjelasan</label>
          <textarea class="cms-form-textarea" id="form-description" rows="8">${escapeHtml(parsed.description || '')}</textarea>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">URL Paper (ResearchGate / Medium / Google Drive)</label>
          <input class="cms-form-input" id="form-url" value="${escapeHtml(parsed.url || '')}" placeholder="https://...">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Quote (opsional)</label>
          <textarea class="cms-form-textarea" id="form-quote" rows="2">${escapeHtml(parsed.quote || '')}</textarea>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Sumber Quote</label>
          <input class="cms-form-input" id="form-quote-source" value="${escapeHtml(parsed.quoteSource || '')}">
        </div>
      `;
    } else if (sectionKey === 'certification') {
      html += `
        <div class="cms-form-group">
          <label class="cms-form-label">Nama Sertifikasi</label>
          <input class="cms-form-input" id="form-name" value="${escapeHtml(parsed.name || '')}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Google Drive File ID (untuk embed preview)</label>
          <input class="cms-form-input" id="form-drive-id" value="${escapeHtml(parsed.driveId || '')}" placeholder="1l3zWyVflEebpOpBHQNXAftUO_ulLek69">
          <div class="cms-form-help">ID file dari URL Google Drive: drive.google.com/file/d/<b>FILE_ID</b>/view</div>
        </div>
      `;
    }

    // Always show raw HTML fallback
    html += `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--cms-border);">
        <div class="cms-form-help" style="margin-bottom: 8px;">💡 Untuk kontrol penuh, gunakan tab "HTML Source" untuk edit HTML mentah.</div>
      </div>
    `;

    return html;
  }

  /* ---- Parse content HTML to extract fields ---- */
  function parseContent(sectionKey, contentHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${contentHtml}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    const result = {};

    try {
      // Extract name from h1
      const h1 = root.querySelector('h1');
      if (h1) {
        const titleText = h1.textContent.trim();
        // Remove leading number prefix like "001 : "
        result.name = titleText.replace(/^\d+\s*:\s*/, '');
      }

      // Extract banner image
      const bannerImg = root.querySelector(':scope > img');
      if (bannerImg) result.banner = bannerImg.getAttribute('src') || '';

      if (sectionKey === 'projects') {
        // Parse project fields from content
        const pTags = root.querySelectorAll('p');
        pTags.forEach(p => {
          const text = p.innerHTML;
          const catMatch = text.match(/<b>Category:<\/b>\s*([^<]+)/);
          if (catMatch) result.category = catMatch[1].trim();
          const yearMatch = text.match(/<b>Year:<\/b>\s*([^<]+)/);
          if (yearMatch) result.year = yearMatch[1].trim();
        });

        // Extract URLs
        const links = root.querySelectorAll('a[target="_blank"]');
        links.forEach(link => {
          const href = link.getAttribute('href') || '';
          const text = link.textContent.toLowerCase();
          if (text.includes('visit') || text.includes('website')) result.url = href;
          if (text.includes('github')) result.github = href;
        });

        // Extract screenshot
        const screenshotImg = root.querySelector('img[src*="screenshot"]');
        if (screenshotImg) result.screenshot = screenshotImg.getAttribute('src') || '';

        // Extract one-liner (bold text after link paragraph)
        const bTags = root.querySelectorAll('.text-center > b');
        if (bTags.length > 0) result.oneliner = bTags[bTags.length - 1].textContent.trim();

        // Extract description paragraphs
        const descParagraphs = [];
        root.querySelectorAll('.col-xs-12 ~ p, .text-center > p:not(:first-child)').forEach(p => {
          if (p.textContent.trim() && !p.innerHTML.includes('<b>Category')) {
            descParagraphs.push(p.textContent.trim());
          }
        });
        result.description = descParagraphs.join('\n\n');

        // Extract highlights
        result.highlights = [];
        root.querySelectorAll('ol li').forEach(li => {
          result.highlights.push(li.textContent.trim());
        });

      } else if (sectionKey === 'experience') {
        const pTags = root.querySelectorAll('p');
        pTags.forEach(p => {
          const text = p.innerHTML;
          const posMatch = text.match(/<b>Position:<\/b>\s*([^<]+)/);
          if (posMatch) result.position = posMatch[1].trim();
          const durMatch = text.match(/<b>Duration:<\/b>\s*([^<]+)/);
          if (durMatch) {
            const parts = durMatch[1].split('-').map(s => s.trim());
            result.start = parts[0] || '';
            result.end = parts[1] || '';
          }
          const locMatch = text.match(/<b>Location:<\/b>\s*([^<]+)/);
          if (locMatch) result.location = locMatch[1].trim();
        });

        // Company description (bold text)
        const bTags = root.querySelectorAll('.text-center > b');
        if (bTags.length > 0) result.companyDesc = bTags[0].textContent.trim();

        // Company image
        const compImg = root.querySelector('.col-xs-12 img, [class*="col-xs"] img');
        if (compImg && compImg !== bannerImg) result.companyImg = compImg.getAttribute('src') || '';

        // Job description
        const descPs = [];
        root.querySelectorAll('.text-center > p').forEach(p => {
          if (!p.innerHTML.includes('<b>Position') && !p.innerHTML.includes('Source:') && p.textContent.trim()) {
            descPs.push(p.textContent.trim());
          }
        });
        result.description = descPs.join('\n\n');

        // Achievements
        result.highlights = [];
        root.querySelectorAll('ol li').forEach(li => {
          result.highlights.push(li.textContent.trim());
        });

      } else if (sectionKey === 'works') {
        // Description
        const paragraphs = [];
        root.querySelectorAll('p').forEach(p => {
          if (p.textContent.trim() && !p.querySelector('a.btn')) {
            paragraphs.push(p.textContent.trim());
          }
        });
        result.description = paragraphs.join('\n\n');

        // Paper URL
        const btn = root.querySelector('a.btn, a[target="_blank"]');
        if (btn) result.url = btn.getAttribute('href') || '';

        // Quote
        const blockquote = root.querySelector('blockquote p');
        if (blockquote) result.quote = blockquote.textContent.trim();
        const small = root.querySelector('blockquote small');
        if (small) result.quoteSource = small.textContent.trim();

      } else if (sectionKey === 'certification') {
        // Drive ID
        const iframe = root.querySelector('iframe');
        if (iframe) {
          const src = iframe.getAttribute('src') || '';
          const match = src.match(/\/file\/d\/([^/]+)/);
          if (match) result.driveId = match[1];
        }
      }
    } catch (e) {
      console.warn('Content parsing error:', e);
    }

    return result;
  }

  /* ---- Generate content HTML from form fields ---- */
  function generateContent(sectionKey) {
    const title = getVal('form-title') || getVal('editor-title') || '';
    const numMatch = title.match(/^(\d+)/);
    const num = numMatch ? numMatch[1] : '001';

    if (sectionKey === 'projects') {
      const name = getVal('form-name');
      const category = getVal('form-category');
      const year = getVal('form-year');
      const url = getVal('form-url');
      const github = getVal('form-github');
      const oneliner = getVal('form-oneliner');
      const description = getVal('form-description');
      const banner = getVal('form-banner') || './assets/images/work001-01.jpg';
      const screenshot = getVal('form-screenshot');
      const highlights = (getVal('form-highlights') || '').split('\n').filter(l => l.trim());

      let content = `<img src="${banner}" class="img-responsive" alt="" style="aspect-ratio: 770/498; object-fit: cover; width: 100%;">\n`;
      content += `<div class="card-container"><div class="text-center"><h1 class="h2">${num} : ${name}</h1>\n<br><br>\n`;
      content += `<p><b>Category:</b> ${category}<br><b>Year:</b> ${year}<br>`;
      if (url) content += `<b>Link:</b> <a href="${url}" target="_blank">Visit Website</a>`;
      if (github) content += ` | <a href="${github}" target="_blank">GitHub Repository</a>`;
      content += `<br></p>\n<br><b>${oneliner}</b>\n<br><br>\n`;

      if (screenshot) {
        content += `<div class="col-xs-12">\n`;
        content += `<div style="background: #e0e0e0; border-radius: 8px 8px 0 0; padding: 10px; display: flex; align-items: center; border: 1px solid #ccc; border-bottom: none;">\n`;
        content += `<span style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56; margin-right: 8px;"></span>\n`;
        content += `<span style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; margin-right: 8px;"></span>\n`;
        content += `<span style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f; margin-right: 15px;"></span>\n`;
        content += `<div style="background: #fff; flex-grow: 1; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #666; font-family: monospace;">${url || ''}</div>\n`;
        content += `</div>\n`;
        content += `<div style="border: 1px solid #ccc; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">\n`;
        content += `<img src="${screenshot}" class="img-responsive" alt="${name}" style="width: 100%; display: block;">\n`;
        content += `</div></div>\n<br>\n`;
      }

      if (description) content += `<p>${description.replace(/\n\n/g, '</p>\n<p>')}</p><br>\n`;
      content += `</div>\n`;

      if (highlights.length > 0) {
        content += `<div class=""><h3 class="template-title-example">Project Highlights</h3>\n<ol>`;
        highlights.forEach(h => { content += `<li>${h}</li>`; });
        content += `</ol></div>`;
      }

      return content;

    } else if (sectionKey === 'experience') {
      const name = getVal('form-name');
      const position = getVal('form-position');
      const location = getVal('form-location') || 'Jakarta, Indonesia';
      const start = getVal('form-start');
      const end = getVal('form-end');
      const companyDesc = getVal('form-company-desc');
      const companyImg = getVal('form-company-img') || './assets/images/work001-01.jpg';
      const description = getVal('form-description');
      const highlights = (getVal('form-highlights') || '').split('\n').filter(l => l.trim());

      let content = `<img src="./assets/images/work001-01.jpg" class="img-responsive" alt="">\n`;
      content += `<div class="card-container"><div class="text-center"><h1 class="h2">${num} : ${name}</h1>\n<br><br>\n`;
      content += `<p><b>Position:</b> ${position}<br><b>Duration:</b> ${start} - ${end}<br><b>Location:</b> ${location}</p>\n<br>\n`;
      if (companyDesc) content += `<b>${companyDesc}</b>\n<br><br>\n`;
      content += `<div class="col-xs-12"><img src="${companyImg}" class="img-responsive" alt="" width="100%" height="100%"></div>\n<br>`;
      if (description) content += `<p>${description.replace(/\n\n/g, '</p>\n<p>')}</p><br>\n`;
      content += `</div>\n`;

      if (highlights.length > 0) {
        content += `<div class=""><h3 class="template-title-example">Work Portfolio</h3>\n<ol>`;
        highlights.forEach(h => { content += `<li>${h}</li>`; });
        content += `</ol></div>`;
      }

      return content;

    } else if (sectionKey === 'works') {
      const name = getVal('form-name');
      const description = getVal('form-description');
      const url = getVal('form-url');
      const quote = getVal('form-quote');
      const quoteSource = getVal('form-quote-source');

      let content = `<img src="./assets/images/work001-01.jpg" class="img-responsive" alt="">\n`;
      content += `<div class="card-container"><div class="text-center"><h1 class="h2">${num} : ${name}</h1></div>\n`;
      if (description) content += `<p>${description.replace(/\n\n/g, '</p>\n<p>')}</p>\n`;
      if (quote) {
        content += `<blockquote><p>${quote}</p>`;
        if (quoteSource) content += `<small class="pull-right">${quoteSource}</small>`;
        content += `</blockquote>\n`;
      }
      if (url) {
        content += `<h2 class="template-title-example">Check out my paper for more information:</h2>\n`;
        content += `<p><a href="${url}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Read Paper</a></p>`;
      }

      return content;

    } else if (sectionKey === 'certification') {
      const name = getVal('form-name');
      const driveId = getVal('form-drive-id');

      let content = `<img src="./assets/images/work001-01.jpg" class="img-responsive" alt="">\n`;
      content += `<div class="card-container"><div class="text-center"><h1 class="h2">${num} : ${name}</h1>\n<br><br><br><br>\n`;
      if (driveId) {
        content += `<iframe src="https://drive.google.com/file/d/${driveId}/preview" width="850" height="950" allow="autoplay"></iframe>\n`;
      }
      content += `</div></div>`;

      return content;
    }

    return '';
  }

  /* ---- Helper: get form value ---- */
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* ---- Switch editor tabs ---- */
  function switchEditorTab(btn, tabName) {
    document.querySelectorAll('#editor-modal .cms-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('editor-tab-form').style.display = tabName === 'form' ? 'block' : 'none';
    document.getElementById('editor-tab-source').style.display = tabName === 'source' ? 'block' : 'none';
    document.getElementById('editor-tab-preview').style.display = tabName === 'preview' ? 'block' : 'none';

    if (tabName === 'source') {
      // Sync form → source
      syncFormToSource();
    }

    if (tabName === 'preview') {
      renderPreview();
    }
  }

  /* ---- Sync form fields to source textarea ---- */
  function syncFormToSource() {
    if (!currentItem) return;
    const formContent = generateContent(currentItem.sectionKey);
    const sourceEl = document.getElementById('editor-source');
    const titleEl = document.getElementById('editor-title');
    const formTitleEl = document.getElementById('form-title');

    if (formContent && sourceEl) {
      sourceEl.value = formContent;
    }
    if (formTitleEl && titleEl) {
      titleEl.value = formTitleEl.value;
    }
  }

  /* ---- Render preview ---- */
  function renderPreview() {
    const previewDiv = document.getElementById('editor-preview-content');
    if (!previewDiv) return;

    // Try to use source if it's visible, otherwise generate from form
    const sourceEl = document.getElementById('editor-source');
    let html = '';

    if (document.getElementById('editor-tab-source').style.display !== 'none' && sourceEl) {
      html = sourceEl.value;
    } else if (currentItem) {
      html = generateContent(currentItem.sectionKey);
    }

    if (html && window.CMS.MediaManager) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.querySelectorAll('img').forEach(img => {
        const originalSrc = img.getAttribute('src');
        if (originalSrc) {
          img.setAttribute('src', window.CMS.MediaManager.getPreviewUrl(originalSrc));
          img.setAttribute('loading', 'lazy');
          img.setAttribute('decoding', 'async');
          img.setAttribute('onerror', `this.onerror=null; this.src='${originalSrc}';`);
        }
      });
      html = tempDiv.innerHTML;
    }

    previewDiv.innerHTML = html || '<p style="color: #999;">Tidak ada konten untuk di-preview</p>';
  }

  /* ---- Pick image for form field ---- */
  function pickImage(inputId) {
    if (window.CMS.MediaManager && window.CMS.MediaManager.openPicker) {
      window.CMS.MediaManager.openPicker(function (path) {
        const input = document.getElementById(inputId);
        if (input) input.value = path;
      });
    } else {
      window.CMS.toast('Media Manager belum dimuat', 'warning');
    }
  }

  /* ---- Save content ---- */
  function save() {
    if (!currentItem) return;
    const { sectionKey, itemId } = currentItem;
    const data = window.CMS.state.data;

    // Determine source: if source tab was last active, use that; otherwise generate from form
    const sourceEl = document.getElementById('editor-source');
    const titleEl = document.getElementById('editor-title');
    const formTitleEl = document.getElementById('form-title');

    let newContent = '';
    let newTitle = '';

    // Check if source tab is visible
    if (document.getElementById('editor-tab-source').style.display !== 'none' && sourceEl) {
      newContent = sourceEl.value;
      newTitle = titleEl ? titleEl.value : '';
    } else {
      newContent = generateContent(sectionKey);
      newTitle = formTitleEl ? formTitleEl.value : '';
    }

    data[sectionKey][itemId] = {
      title: newTitle,
      content: newContent,
    };

    window.CMS.markChanged();
    window.CMS.toast('Konten berhasil disimpan! ✅', 'success');
    close();

    // Re-render current section
    if (window.CMS.CardManager) {
      window.CMS.CardManager.render(document.getElementById('page-section'), sectionKey);
    }
  }

  /* ---- Close editor ---- */
  function close() {
    const modal = document.getElementById('editor-modal');
    if (modal) modal.remove();
    currentItem = null;
  }

  /* ---- HTML escape ---- */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return {
    init,
    open,
    close,
    save,
    switchEditorTab,
    pickImage,
  };
})();

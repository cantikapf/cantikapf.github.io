window.CMS = window.CMS || {};

window.CMS.PageEditor = (function() {
  'use strict';

  async function init() {
    window.CMS.state.pages = window.CMS.state.pages || {};
    window.CMS.state.htmlTemplates = window.CMS.state.htmlTemplates || {};

    const pages = ['about', 'contact'];
    for (const pageKey of pages) {
      if (!window.CMS.state.pages[pageKey]) {
        try {
          const filename = pageKey === 'about' ? 'about.html' : 'contact.html';
          const res = await fetch(`./${filename}?v=${Date.now()}`);
          if (res.ok) {
            const html = await res.text();
            window.CMS.state.htmlTemplates[pageKey] = html;
            
            const startMarker = `<!--cms-${pageKey}-content-->`;
            const endMarker = `<!--/cms-${pageKey}-content-->`;
            
            if (html.includes(startMarker) && html.includes(endMarker)) {
              const content = html.split(startMarker)[1].split(endMarker)[0].trim();
              window.CMS.state.pages[pageKey] = { content: content };
            }
          }
        } catch (e) {
          console.error(`Failed to fetch ${pageKey}.html for init`, e);
        }
      }
    }
  }

  function render(container, pageKey) {
    if (!window.CMS.state.pages || !window.CMS.state.pages[pageKey]) {
        container.innerHTML = `<div class="cms-empty-state"><p>Page data not loaded. Please try refreshing.</p></div>`;
        return;
    }

    const title = pageKey === 'about' ? 'About Me Page Editor' : 'Contact Page Editor';
    const icon = pageKey === 'about' ? '👤' : '📧';
    
    container.innerHTML = `
      <div class="cms-section-header">
        <div>
          <h2>${icon} ${title}</h2>
          <p style="color: var(--cms-text-secondary); font-size: 14px; margin-top: 4px;">Edit the HTML content of the ${pageKey} page</p>
        </div>
        <div class="cms-section-actions">
          <button class="cms-btn cms-btn-success" id="page-editor-save">💾 Save Changes</button>
        </div>
      </div>
      
      <div class="cms-editor-split" style="display: flex; gap: 20px; margin-top: 20px; align-items: stretch; min-height: 500px;">
        <div class="cms-editor-pane" style="flex: 1; display: flex; flex-direction: column;">
          <h3 style="font-size: 14px; margin-bottom: 10px; color: var(--cms-text-secondary);">Raw HTML Content</h3>
          <textarea id="page-editor-textarea" class="cms-form-input" style="flex: 1; min-height: 400px; font-family: monospace; font-size: 13px; line-height: 1.5; resize: vertical;" wrap="off"></textarea>
        </div>
        <div class="cms-preview-pane" style="flex: 1; display: flex; flex-direction: column; background: var(--cms-background); border: 1px solid var(--cms-border); border-radius: var(--cms-radius);">
          <div style="padding: 10px 15px; border-bottom: 1px solid var(--cms-border); background: var(--cms-surface); border-radius: var(--cms-radius) var(--cms-radius) 0 0;">
            <h3 style="font-size: 14px; margin: 0; color: var(--cms-text-secondary);">Live Preview</h3>
          </div>
          <div id="page-editor-preview" style="flex: 1; padding: 20px; overflow-y: auto; background: white;">
          </div>
        </div>
      </div>
    `;

    const textarea = container.querySelector('#page-editor-textarea');
    const preview = container.querySelector('#page-editor-preview');
    const saveBtn = container.querySelector('#page-editor-save');

    // Set initial content
    textarea.value = window.CMS.state.pages[pageKey].content || '';
    
    function updatePreview() {
      preview.innerHTML = textarea.value;
    }

    textarea.addEventListener('input', updatePreview);
    updatePreview(); // initial render

    saveBtn.addEventListener('click', () => {
      window.CMS.state.pages[pageKey].content = textarea.value;
      window.CMS.markChanged();
      if (window.CMS.toast) window.CMS.toast(`Changes saved to ${pageKey} page. Don't forget to Export & Deploy.`, 'success');
      
      // log audit
      if (window.CMS.AuditLog) {
          window.CMS.AuditLog.log('EDIT_PAGE', `Edited ${pageKey} page content`);
      }
    });
  }

  return { init, render };
})();

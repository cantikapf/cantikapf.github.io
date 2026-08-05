/**
 * CMS Core — State Management, Navigation, Toast System
 * Portfolio CMS for cantikapf.github.io
 */
window.CMS = window.CMS || {};

window.CMS.Core = (function () {
  'use strict';

  /* ---- Configuration ---- */
  const SECTIONS = {
    works: {
      label: 'Research',
      icon: '📄',
      pageNum: '02',
      htmlFile: 'works.html',
      idPrefix: 'work',
      accentColor: '#818cf8',
    },
    experience: {
      label: 'Work Experience',
      icon: '💼',
      pageNum: '03',
      htmlFile: 'experience.html',
      idPrefix: 'experience',
      accentColor: '#34d399',
    },
    certification: {
      label: 'Certification',
      icon: '🏅',
      pageNum: '04',
      htmlFile: 'certification.html',
      idPrefix: 'certification',
      accentColor: '#fbbf24',
    },
    projects: {
      label: 'Projects',
      icon: '🚀',
      pageNum: '05',
      htmlFile: 'projects.html',
      idPrefix: 'project',
      accentColor: '#f87171',
    },
  };

  const PASSWORD_KEY = 'cms_password_hash';
  const CMS_PASSWORD = 'cantika2026'; // simple default password

  /* ---- State ---- */
  const state = {
    data: null,          // deep copy of portfolioData
    originalData: null,  // original portfolioData for diff
    carouselCards: {},   // parsed carousel card info per section
    currentPage: 'dashboard',
    currentSection: null,
    pendingChanges: false,
    authenticated: false,
  };
  window.CMS.state = state;

  /* ---- Toast system ---- */
  function toast(message, type = 'info') {
    const container = document.getElementById('cms-toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `cms-toast ${type}`;
    el.innerHTML = `<span class="cms-toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }
  window.CMS.toast = toast;

  /* ---- Confirm dialog ---- */
  function confirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'cms-confirm-overlay';
      overlay.innerHTML = `
        <div class="cms-confirm-dialog">
          <h4>${title}</h4>
          <p>${message}</p>
          <div class="cms-confirm-actions">
            <button class="cms-btn cms-btn-secondary" data-action="cancel">Batal</button>
            <button class="cms-btn cms-btn-danger" data-action="confirm">Ya, Lanjutkan</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('[data-action="cancel"]').onclick = () => { overlay.remove(); resolve(false); };
      overlay.querySelector('[data-action="confirm"]').onclick = () => { overlay.remove(); resolve(true); };
    });
  }
  window.CMS.confirm = confirm;

  /* ---- Deep clone ---- */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ---- Mark pending changes ---- */
  function markChanged() {
    state.pendingChanges = true;
    const dots = document.querySelectorAll('.cms-pending-indicator');
    dots.forEach(d => d.style.display = 'inline-block');
  }
  window.CMS.markChanged = markChanged;

  /* ---- Get section config ---- */
  function getSectionConfig(sectionKey) {
    return SECTIONS[sectionKey] || null;
  }

  /* ---- Count real items (exclude section header and coming soon) ---- */
  function countRealItems(sectionKey) {
    const section = state.data[sectionKey];
    if (!section) return 0;
    let count = 0;
    for (const key of Object.keys(section)) {
      // Skip the section header item (key equals the section name exactly)
      if (key === sectionKey) continue;
      // Skip coming soon items
      const item = section[key];
      if (item.title && item.title.toLowerCase().includes('coming soon')) continue;
      count++;
    }
    return count;
  }

  /* ---- Count all items (including coming soon, excluding header) ---- */
  function countAllItems(sectionKey) {
    const section = state.data[sectionKey];
    if (!section) return 0;
    let count = 0;
    for (const key of Object.keys(section)) {
      if (key === sectionKey) continue;
      count++;
    }
    return count;
  }

  /* ---- Get item IDs (excluding section header) ---- */
  function getItemIds(sectionKey) {
    const section = state.data[sectionKey];
    if (!section) return [];
    return Object.keys(section).filter(k => k !== sectionKey);
  }

  /* ---- Navigation ---- */
  function navigateTo(page, section) {
    state.currentPage = page;
    state.currentSection = section || null;

    // Update active nav items
    document.querySelectorAll('.cms-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page && (!section || item.dataset.section === section));
    });

    // Update page visibility
    document.querySelectorAll('.cms-page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Update header breadcrumb
    const breadcrumb = document.getElementById('cms-breadcrumb');
    if (breadcrumb) {
      if (page === 'dashboard') {
        breadcrumb.innerHTML = '<span>Dashboard</span>';
      } else if (page === 'section' && section) {
        const cfg = getSectionConfig(section);
        breadcrumb.innerHTML = `<span>Sections</span> <span>›</span> <span>${cfg ? cfg.icon + ' ' + cfg.label : section}</span>`;
      } else if (page === 'media') {
        breadcrumb.innerHTML = '<span>Media Manager</span>';
      } else if (page === 'export') {
        breadcrumb.innerHTML = '<span>Export & Deploy</span>';
      }
    }

    // Render page content
    renderPage(page, section);
  }

  /* ---- Render page ---- */
  function renderPage(page, section) {
    if (page === 'dashboard') {
      renderDashboard();
    } else if (page === 'section' && section) {
      if (window.CMS.CardManager) {
        window.CMS.CardManager.render(document.getElementById('page-section'), section);
      }
    } else if (page === 'media') {
      if (window.CMS.MediaManager) {
        window.CMS.MediaManager.render(document.getElementById('page-media'));
      }
    } else if (page === 'export') {
      if (window.CMS.GitHubAPI) {
        window.CMS.GitHubAPI.render(document.getElementById('page-export'));
      }
    }
  }

  /* ---- Render Dashboard ---- */
  function renderDashboard() {
    const container = document.getElementById('page-dashboard');
    if (!container) return;

    const sectionKeys = Object.keys(SECTIONS);
    let statsHTML = '';
    let totalItems = 0;

    sectionKeys.forEach(key => {
      const cfg = SECTIONS[key];
      const real = countRealItems(key);
      const all = countAllItems(key);
      const comingSoon = all - real;
      totalItems += real;

      statsHTML += `
        <div class="cms-stat-card" style="--card-accent: ${cfg.accentColor}" data-page="section" data-section="${key}" onclick="CMS.Core.navigateTo('section', '${key}')">
          <div class="cms-stat-card-header">
            <div class="cms-stat-card-icon" style="background: ${cfg.accentColor}20; color: ${cfg.accentColor}">
              ${cfg.icon}
            </div>
            ${comingSoon > 0 ? `<span class="cms-badge cms-badge-warning">${comingSoon} placeholder</span>` : `<span class="cms-badge cms-badge-success">Complete</span>`}
          </div>
          <h3>${real}</h3>
          <p>${cfg.pageNum} : ${cfg.label}</p>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="cms-section-header">
        <div>
          <h2>Dashboard</h2>
          <p style="color: var(--cms-text-secondary); font-size: 14px; margin-top: 4px;">
            Kelola semua konten portfolio dari satu tempat
          </p>
        </div>
        <div class="cms-section-actions">
          <span class="cms-badge cms-badge-info" style="padding: 6px 14px; font-size: 13px;">
            Total: ${totalItems} item aktif
          </span>
        </div>
      </div>

      <div class="cms-dashboard-grid">
        ${statsHTML}
      </div>

      <div style="margin-top: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">Aksi Cepat</h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="cms-btn cms-btn-secondary" onclick="CMS.Core.navigateTo('media')">
            🖼️ Media Manager
          </button>
          <button class="cms-btn cms-btn-secondary" onclick="CMS.Core.navigateTo('export')">
            📦 Export & Deploy
          </button>
        </div>
      </div>

      <div style="margin-top: 32px;">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">Semua Item</h3>
        ${renderAllItemsTable()}
      </div>
    `;
  }

  /* ---- Render all items table ---- */
  function renderAllItemsTable() {
    let rows = '';
    Object.keys(SECTIONS).forEach(sectionKey => {
      const cfg = SECTIONS[sectionKey];
      const ids = getItemIds(sectionKey);
      ids.forEach(id => {
        const item = state.data[sectionKey][id];
        const isPlaceholder = item.title && item.title.toLowerCase().includes('coming soon');
        rows += `
          <tr style="cursor:pointer" onclick="CMS.Core.navigateTo('section', '${sectionKey}')">
            <td style="padding: 10px 12px;">
              <span style="color: ${cfg.accentColor}">${cfg.icon}</span> ${cfg.label}
            </td>
            <td style="padding: 10px 12px;">${id}</td>
            <td style="padding: 10px 12px;">${item.title || '-'}</td>
            <td style="padding: 10px 12px;">
              ${isPlaceholder ? '<span class="cms-badge cms-badge-warning">Placeholder</span>' : '<span class="cms-badge cms-badge-success">Active</span>'}
            </td>
          </tr>
        `;
      });
    });

    return `
      <div style="background: var(--cms-surface); border: 1px solid var(--cms-border); border-radius: var(--cms-radius); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--cms-border); color: var(--cms-text-muted); text-transform: uppercase; font-size: 11px; font-weight: 600;">
              <th style="padding: 12px; text-align: left;">Section</th>
              <th style="padding: 12px; text-align: left;">ID</th>
              <th style="padding: 12px; text-align: left;">Title</th>
              <th style="padding: 12px; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ---- Build sidebar ---- */
  function buildSidebar() {
    const nav = document.getElementById('cms-sidebar-nav');
    if (!nav) return;

    let html = `
      <div class="cms-nav-section">
        <div class="cms-nav-section-label">Menu</div>
        <button class="cms-nav-item active" data-page="dashboard" onclick="CMS.Core.navigateTo('dashboard')">
          <span class="cms-nav-icon">📊</span>
          Dashboard
        </button>
      </div>
      <div class="cms-nav-section">
        <div class="cms-nav-section-label">Sections</div>
    `;

    Object.keys(SECTIONS).forEach(key => {
      const cfg = SECTIONS[key];
      const count = countAllItems(key);
      html += `
        <button class="cms-nav-item" data-page="section" data-section="${key}" onclick="CMS.Core.navigateTo('section', '${key}')">
          <span class="cms-nav-icon">${cfg.icon}</span>
          ${cfg.label}
          <span class="cms-nav-badge">${count}</span>
        </button>
      `;
    });

    html += `
      </div>
      <div class="cms-nav-section">
        <div class="cms-nav-section-label">Tools</div>
        <button class="cms-nav-item" data-page="media" onclick="CMS.Core.navigateTo('media')">
          <span class="cms-nav-icon">🖼️</span>
          Media Manager
        </button>
        <button class="cms-nav-item" data-page="export" onclick="CMS.Core.navigateTo('export')">
          <span class="cms-nav-icon">📦</span>
          Export & Deploy
          <span class="cms-pending-indicator cms-pending-dot" style="display:none"></span>
        </button>
      </div>
    `;

    nav.innerHTML = html;
  }

  /* ---- Login ---- */
  function checkAuth() {
    const stored = localStorage.getItem(PASSWORD_KEY);
    return stored === CMS_PASSWORD;
  }

  function handleLogin() {
    const input = document.getElementById('cms-login-password');
    const error = document.getElementById('cms-login-error');
    if (!input) return;

    if (input.value === CMS_PASSWORD) {
      localStorage.setItem(PASSWORD_KEY, CMS_PASSWORD);
      state.authenticated = true;
      const overlay = document.getElementById('cms-login-overlay');
      if (overlay) overlay.remove();
      initCMS();
    } else {
      if (error) {
        error.textContent = 'Password salah. Coba lagi.';
        error.style.display = 'block';
      }
      input.value = '';
      input.focus();
    }
  }
  window.CMS.handleLogin = handleLogin;

  /* ---- Initialize CMS ---- */
  function initCMS() {
    // Load portfolioData
    if (typeof portfolioData !== 'undefined') {
      state.data = deepClone(portfolioData);
      state.originalData = deepClone(portfolioData);
    } else {
      toast('Gagal memuat data portfolio. Pastikan data.js ter-load.', 'error');
      return;
    }

    buildSidebar();

    // Init sub-modules
    if (window.CMS.MediaManager) window.CMS.MediaManager.init();
    if (window.CMS.CardManager) window.CMS.CardManager.init();
    if (window.CMS.Editor) window.CMS.Editor.init();
    if (window.CMS.GitHubAPI) window.CMS.GitHubAPI.init();

    // Navigate to dashboard
    navigateTo('dashboard');

    // Mobile sidebar toggle
    const toggle = document.getElementById('cms-mobile-toggle');
    if (toggle) {
      toggle.onclick = () => {
        document.getElementById('cms-sidebar').classList.toggle('open');
      };
    }

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (state.pendingChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    toast('CMS berhasil dimuat! 🎉', 'success');
  }

  /* ---- Boot ---- */
  function boot() {
    if (checkAuth()) {
      state.authenticated = true;
      const overlay = document.getElementById('cms-login-overlay');
      if (overlay) overlay.remove();
      initCMS();
    }
    // If not authenticated, login overlay remains visible
  }

  return {
    boot,
    navigateTo,
    getSectionConfig,
    countRealItems,
    countAllItems,
    getItemIds,
    handleLogin,
    SECTIONS,
    deepClone,
  };
})();

// Boot when DOM ready
document.addEventListener('DOMContentLoaded', function () {
  window.CMS.Core.boot();
});

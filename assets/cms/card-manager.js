/**
 * Card Manager — Carousel Card CRUD & Ordering
 * Portfolio CMS for cantikapf.github.io
 */
window.CMS = window.CMS || {};

window.CMS.CardManager = (function () {
  'use strict';

  /* ---- Carousel card metadata (parsed from HTML) ---- */
  // We derive cards from data.js keys + known metadata
  const CARD_META = {
    projects: [
      { id: 'project1', title: 'Tangsel Coffeeshop Business', subtitle: '2026', thumb: './assets/images/project1.png' },
      { id: 'project2', title: 'My Digital Academy 2025', subtitle: 'Jun 2025 - Jul 2025', thumb: './assets/images/project2.png' },
      { id: 'project3', title: "Indonesia's Export Destination", subtitle: 'Jul 2024', thumb: './assets/images/project3.png' },
      { id: 'project4', title: 'IR Study Companion', subtitle: 'Jan 2023 - Jan 2024', thumb: './assets/images/project4.png' },
      { id: 'project5', title: 'WhatBusinessInTangsel', subtitle: '2026', thumb: './assets/images/project5.png' },
      { id: 'project6', title: 'IPU144 Sentiment Analysis', subtitle: '2023', thumb: './assets/images/project6.png' },
    ],
    experience: [
      { id: 'experience1', title: 'PT Bank Mandiri (Persero) Tbk.', subtitle: 'Dec 2016 - Mar 2017', thumb: './assets/images/experience-01.jpg' },
      { id: 'experience2', title: 'Dewan Perwakilan Rakyat RI', subtitle: 'Feb 2021 - Jun 2021', thumb: './assets/images/dpr-ri.jpg' },
      { id: 'experience3', title: 'Lembaga Pembiayaan Ekspor Indonesia', subtitle: 'Jun 2023 - Aug 2023', thumb: './assets/images/lpei.jpg' },
      { id: 'experience4', title: 'PT Sumberdaya Andalan Mandiri', subtitle: 'Aug 2023 - Jan 2025', thumb: './assets/images/work001-01.jpg' },
      { id: 'experience5', title: 'PT Bank Mandiri (Persero) Tbk.', subtitle: 'Apr 2025 - Jul 2025', thumb: './assets/images/bank-mandiri.jpg' },
      { id: 'experience6', title: 'Coming soon.', subtitle: '-', thumb: './assets/images/coming-soon.jpg', placeholder: true },
    ],
    works: [
      { id: 'work', title: 'Indonesia Parliamentary Diplomacy', subtitle: 'Parliamentary Diplomacy', thumb: './assets/images/work01-hover.jpg' },
      { id: 'work2', title: 'Shinzo Abe Leadership Style', subtitle: 'Foreign Policy Analysis', thumb: './assets/images/work01-hover.jpg' },
      { id: 'work3', title: "Japan's Role in East Asia", subtitle: 'Regional Economic Integration', thumb: './assets/images/work01-hover.jpg' },
      { id: 'work4', title: "Neo-Liberal Approach in China's Development", subtitle: 'Challenges and Opportunities', thumb: './assets/images/work02-hover.jpg' },
      { id: 'work5', title: "Unveiling China's Transformation", subtitle: 'Globalization & State-Society', thumb: './assets/images/work03-hover.jpg' },
      { id: 'work6', title: 'Coming soon.', subtitle: '-', thumb: './assets/images/coming-soon.jpg', placeholder: true },
    ],
    certification: [
      { id: 'certification1', title: 'English Proficiency Online Test', subtitle: '2021', thumb: './assets/images/work001-01.jpg' },
      { id: 'certification2', title: 'Coming soon.', subtitle: '-', thumb: './assets/images/coming-soon.jpg', placeholder: true },
      { id: 'certification3', title: 'Coming soon.', subtitle: '-', thumb: './assets/images/coming-soon.jpg', placeholder: true },
      { id: 'certification4', title: 'Coming soon.', subtitle: '-', thumb: './assets/images/coming-soon.jpg', placeholder: true },
      { id: 'certification5', title: 'Coming soon.', subtitle: '-', thumb: './assets/images/coming-soon.jpg', placeholder: true },
      { id: 'certification6', title: 'Coming soon.', subtitle: '-', thumb: './assets/images/coming-soon.jpg', placeholder: true },
    ],
  };

  let currentEditCard = null;

  function init() {
    // Store card metadata in state for export
    window.CMS.state.carouselCards = JSON.parse(JSON.stringify(CARD_META));
  }

  /* ---- Render section page ---- */
  function render(container, sectionKey) {
    if (!container) return;
    const cfg = window.CMS.Core.getSectionConfig(sectionKey);
    if (!cfg) return;

    const cards = window.CMS.state.carouselCards[sectionKey] || [];
    const total = cards.length;

    let cardsHTML = '';
    cards.forEach((card, index) => {
      const num = String(index + 1).padStart(3, '0');
      const isPlaceholder = card.placeholder || false;

      cardsHTML += `
        <div class="cms-item-card ${isPlaceholder ? 'is-placeholder' : ''}" data-index="${index}" data-id="${card.id}">
          <img class="cms-item-card-thumb" src="${card.thumb}" alt="${card.title}" onerror="this.src='./assets/images/work001-01.jpg'">
          <div class="cms-item-card-body">
            <div class="cms-item-card-num">${num}/${String(total).padStart(3, '0')}</div>
            <div class="cms-item-card-title">${escapeHtml(card.title)}</div>
            <div class="cms-item-card-subtitle">${escapeHtml(card.subtitle)}</div>
            <div class="cms-item-card-actions">
              <button class="cms-btn cms-btn-sm cms-btn-secondary" onclick="CMS.CardManager.editCard('${sectionKey}', ${index})">
                ✏️ Edit Card
              </button>
              <button class="cms-btn cms-btn-sm cms-btn-secondary" onclick="CMS.CardManager.editContent('${sectionKey}', '${card.id}')">
                📝 Edit Detail
              </button>
              <button class="cms-btn cms-btn-sm cms-btn-danger" onclick="CMS.CardManager.deleteCard('${sectionKey}', ${index})">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="cms-section-header">
        <div>
          <h2>${cfg.icon} ${cfg.pageNum} : ${cfg.label}</h2>
          <p style="color: var(--cms-text-secondary); font-size: 14px; margin-top: 4px;">
            ${total} item total · Kelola card carousel dan konten detail
          </p>
        </div>
        <div class="cms-section-actions">
          <button class="cms-btn cms-btn-primary" onclick="CMS.CardManager.addCard('${sectionKey}')">
            ➕ Tambah Item
          </button>
        </div>
      </div>

      <div class="cms-tabs">
        <button class="cms-tab active" onclick="CMS.CardManager.switchTab(this, 'cards')">🃏 Carousel Cards</button>
        <button class="cms-tab" onclick="CMS.CardManager.switchTab(this, 'preview')">👁️ Preview Layout</button>
      </div>

      <div id="tab-cards">
        <div class="cms-card-grid">
          ${cardsHTML || '<div class="cms-empty-state"><div class="cms-empty-state-icon">📭</div><h3>Belum ada item</h3><p>Klik "Tambah Item" untuk menambahkan item baru ke section ini.</p></div>'}
        </div>
      </div>

      <div id="tab-preview" style="display:none;">
        ${renderCarouselPreview(sectionKey, cards)}
      </div>
    `;
  }

  /* ---- Render carousel preview ---- */
  function renderCarouselPreview(sectionKey, cards) {
    if (!cards.length) return '<div class="cms-empty-state"><h3>Tidak ada card</h3></div>';

    const slides = [];
    for (let i = 0; i < cards.length; i += 3) {
      slides.push(cards.slice(i, i + 3));
    }

    let html = '<div style="background: var(--cms-surface); border: 1px solid var(--cms-border); border-radius: var(--cms-radius); padding: 24px;">';
    html += '<h4 style="font-size: 14px; color: var(--cms-text-secondary); margin-bottom: 16px;">Carousel Preview (3 card per slide)</h4>';

    slides.forEach((slide, slideIdx) => {
      html += `<div style="margin-bottom: 20px; padding: 16px; border: 1px dashed var(--cms-border); border-radius: 8px;">`;
      html += `<div style="font-size: 12px; color: var(--cms-text-muted); margin-bottom: 8px;">Slide ${slideIdx + 1} ${slideIdx === 0 ? '(active)' : ''}</div>`;
      html += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">`;

      slide.forEach((card) => {
        html += `
          <div style="background: var(--cms-bg); border-radius: 8px; overflow: hidden; border: 1px solid var(--cms-border);">
            <img src="${card.thumb}" style="width: 100%; aspect-ratio: 770/498; object-fit: cover; display: block;" onerror="this.src='./assets/images/work001-01.jpg'">
            <div style="padding: 8px;">
              <div style="font-size: 11px; color: var(--cms-text-muted);">${String(cards.indexOf(card) + 1).padStart(3, '0')}/${String(cards.length).padStart(3, '0')}</div>
              <div style="font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(card.title)}</div>
            </div>
          </div>
        `;
      });

      // Fill empty slots
      for (let i = slide.length; i < 3; i++) {
        html += `<div style="background: var(--cms-bg); border-radius: 8px; border: 1px dashed var(--cms-border); display: flex; align-items: center; justify-content: center; aspect-ratio: 770/498; color: var(--cms-text-muted); font-size: 12px;">Slot kosong</div>`;
      }

      html += '</div></div>';
    });

    html += '</div>';
    return html;
  }

  /* ---- Switch tab ---- */
  function switchTab(btn, tabName) {
    document.querySelectorAll('.cms-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-cards').style.display = tabName === 'cards' ? 'block' : 'none';
    document.getElementById('tab-preview').style.display = tabName === 'preview' ? 'block' : 'none';
  }

  /* ---- Edit card metadata modal ---- */
  function editCard(sectionKey, index) {
    const cards = window.CMS.state.carouselCards[sectionKey];
    const card = cards[index];
    if (!card) return;

    currentEditCard = { sectionKey, index };

    const overlay = document.createElement('div');
    overlay.className = 'cms-modal-overlay';
    overlay.id = 'card-edit-modal';
    overlay.innerHTML = `
      <div class="cms-modal">
        <div class="cms-modal-header">
          <h3>✏️ Edit Card — ${escapeHtml(card.title)}</h3>
          <button class="cms-modal-close" onclick="document.getElementById('card-edit-modal').remove()">✕</button>
        </div>
        <div class="cms-modal-body">
          <div class="cms-form-group">
            <label class="cms-form-label">ID</label>
            <input class="cms-form-input" id="card-edit-id" value="${card.id}" readonly style="opacity: 0.6;">
            <div class="cms-form-help">ID tidak bisa diubah setelah dibuat</div>
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Judul (Title)</label>
            <input class="cms-form-input" id="card-edit-title" value="${escapeHtml(card.title)}">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Subtitle (tahun / durasi)</label>
            <input class="cms-form-input" id="card-edit-subtitle" value="${escapeHtml(card.subtitle)}">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Thumbnail Image</label>
            <div style="display: flex; gap: 12px; align-items: flex-end;">
              <div>
                <img id="card-edit-thumb-preview" src="${card.thumb}" style="width: 160px; aspect-ratio: 770/498; object-fit: cover; border-radius: 8px; border: 1px solid var(--cms-border);" onerror="this.src='./assets/images/work001-01.jpg'">
              </div>
              <div style="flex: 1;">
                <input class="cms-form-input" id="card-edit-thumb" value="${card.thumb}">
                <button class="cms-btn cms-btn-sm cms-btn-secondary" style="margin-top: 8px;" onclick="CMS.CardManager.pickThumb()">
                  🖼️ Pilih dari Media
                </button>
              </div>
            </div>
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label" style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="card-edit-placeholder" ${card.placeholder ? 'checked' : ''}>
              Tandai sebagai placeholder ("Coming soon")
            </label>
          </div>
        </div>
        <div class="cms-modal-footer">
          <button class="cms-btn cms-btn-secondary" onclick="document.getElementById('card-edit-modal').remove()">Batal</button>
          <button class="cms-btn cms-btn-primary" onclick="CMS.CardManager.saveCardEdit()">💾 Simpan</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /* ---- Pick thumbnail from media manager ---- */
  function pickThumb() {
    if (window.CMS.MediaManager && window.CMS.MediaManager.openPicker) {
      window.CMS.MediaManager.openPicker(function (path) {
        const input = document.getElementById('card-edit-thumb');
        const preview = document.getElementById('card-edit-thumb-preview');
        if (input) input.value = path;
        if (preview) preview.src = path;
      });
    } else {
      window.CMS.toast('Media Manager belum dimuat', 'warning');
    }
  }

  /* ---- Save card edit ---- */
  function saveCardEdit() {
    if (!currentEditCard) return;
    const { sectionKey, index } = currentEditCard;
    const cards = window.CMS.state.carouselCards[sectionKey];
    const card = cards[index];

    card.title = document.getElementById('card-edit-title').value.trim();
    card.subtitle = document.getElementById('card-edit-subtitle').value.trim();
    card.thumb = document.getElementById('card-edit-thumb').value.trim();
    card.placeholder = document.getElementById('card-edit-placeholder').checked;

    document.getElementById('card-edit-modal').remove();
    window.CMS.markChanged();
    window.CMS.toast('Card berhasil diupdate! ✅', 'success');

    // Re-render
    render(document.getElementById('page-section'), sectionKey);
  }

  /* ---- Edit content (detail page) ---- */
  function editContent(sectionKey, itemId) {
    if (window.CMS.Editor) {
      window.CMS.Editor.open(sectionKey, itemId);
    } else {
      window.CMS.toast('Editor belum dimuat', 'warning');
    }
  }

  /* ---- Add new card ---- */
  function addCard(sectionKey) {
    const cfg = window.CMS.Core.getSectionConfig(sectionKey);
    const cards = window.CMS.state.carouselCards[sectionKey];

    // Generate next ID
    let maxNum = 0;
    cards.forEach(c => {
      const match = c.id.match(/(\d+)$/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });
    const nextNum = maxNum + 1;
    let newId;
    if (sectionKey === 'works') {
      newId = nextNum === 1 ? 'work' : `work${nextNum}`;
    } else {
      newId = `${cfg.idPrefix}${nextNum}`;
    }

    // Check for placeholder to replace
    const placeholderIdx = cards.findIndex(c => c.placeholder);

    const overlay = document.createElement('div');
    overlay.className = 'cms-modal-overlay';
    overlay.id = 'card-add-modal';
    overlay.innerHTML = `
      <div class="cms-modal">
        <div class="cms-modal-header">
          <h3>➕ Tambah Item Baru — ${cfg.label}</h3>
          <button class="cms-modal-close" onclick="document.getElementById('card-add-modal').remove()">✕</button>
        </div>
        <div class="cms-modal-body">
          ${placeholderIdx >= 0 ? `<div style="background: var(--cms-warning-bg); border: 1px solid rgba(251,191,36,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: var(--cms-warning);">⚠️ Placeholder "${cards[placeholderIdx].id}" akan digantikan dengan item baru ini.</div>` : ''}
          <div class="cms-form-group">
            <label class="cms-form-label">ID</label>
            <input class="cms-form-input" id="card-add-id" value="${placeholderIdx >= 0 ? cards[placeholderIdx].id : newId}">
            <div class="cms-form-help">ID unik untuk item ini (misal: project7, experience7)</div>
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Judul (Title)</label>
            <input class="cms-form-input" id="card-add-title" placeholder="Masukkan judul">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Subtitle (tahun / durasi)</label>
            <input class="cms-form-input" id="card-add-subtitle" placeholder="2026 atau Jan 2025 - Jul 2025">
          </div>
          <div class="cms-form-group">
            <label class="cms-form-label">Thumbnail Image Path</label>
            <input class="cms-form-input" id="card-add-thumb" value="./assets/images/work001-01.jpg">
            <button class="cms-btn cms-btn-sm cms-btn-secondary" style="margin-top: 8px;" onclick="CMS.CardManager.pickThumbAdd()">
              🖼️ Pilih dari Media
            </button>
          </div>
        </div>
        <div class="cms-modal-footer">
          <button class="cms-btn cms-btn-secondary" onclick="document.getElementById('card-add-modal').remove()">Batal</button>
          <button class="cms-btn cms-btn-primary" onclick="CMS.CardManager.saveNewCard('${sectionKey}', ${placeholderIdx})">
            ➕ Tambahkan
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function pickThumbAdd() {
    if (window.CMS.MediaManager && window.CMS.MediaManager.openPicker) {
      window.CMS.MediaManager.openPicker(function (path) {
        document.getElementById('card-add-thumb').value = path;
      });
    }
  }

  /* ---- Save new card ---- */
  function saveNewCard(sectionKey, placeholderIdx) {
    const id = document.getElementById('card-add-id').value.trim();
    const title = document.getElementById('card-add-title').value.trim();
    const subtitle = document.getElementById('card-add-subtitle').value.trim();
    const thumb = document.getElementById('card-add-thumb').value.trim();

    if (!id || !title) {
      window.CMS.toast('ID dan Judul wajib diisi', 'warning');
      return;
    }

    const cards = window.CMS.state.carouselCards[sectionKey];

    const newCard = { id, title, subtitle, thumb, placeholder: false };

    if (placeholderIdx >= 0) {
      // Replace placeholder
      const oldId = cards[placeholderIdx].id;
      cards[placeholderIdx] = newCard;
      // Also update/add in data.js state
      if (window.CMS.state.data[sectionKey][oldId]) {
        delete window.CMS.state.data[sectionKey][oldId];
      }
    } else {
      cards.push(newCard);
    }

    // Create default data entry
    const cfg = window.CMS.Core.getSectionConfig(sectionKey);
    const num = String(cards.findIndex(c => c.id === id) + 1).padStart(3, '0');
    window.CMS.state.data[sectionKey][id] = {
      title: `${num} : ${title}`,
      content: `<img src="${thumb}" class="img-responsive" alt="">\n<div class="card-container"><div class="text-center"><h1 class="h2">${num} : ${title}</h1>\n<br><br>\n<p>Konten belum diisi. Klik "Edit Detail" untuk menambahkan konten.</p>\n</div></div>`,
    };

    document.getElementById('card-add-modal').remove();
    window.CMS.markChanged();
    window.CMS.toast(`Item "${title}" berhasil ditambahkan! 🎉`, 'success');

    render(document.getElementById('page-section'), sectionKey);
  }

  /* ---- Delete card ---- */
  async function deleteCard(sectionKey, index) {
    const cards = window.CMS.state.carouselCards[sectionKey];
    const card = cards[index];
    if (!card) return;

    const confirmed = await window.CMS.confirm(
      'Hapus Item?',
      `Yakin ingin menghapus "${card.title}"? Item ini akan dihapus dari carousel dan data.js.`
    );

    if (!confirmed) return;

    // Remove from carousel cards
    cards.splice(index, 1);

    // Remove from data
    if (window.CMS.state.data[sectionKey][card.id]) {
      delete window.CMS.state.data[sectionKey][card.id];
    }

    window.CMS.markChanged();
    window.CMS.toast(`Item "${card.title}" berhasil dihapus`, 'success');
    render(document.getElementById('page-section'), sectionKey);
  }

  /* ---- HTML escape ---- */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return {
    init,
    render,
    editCard,
    editContent,
    addCard,
    deleteCard,
    saveCardEdit,
    saveNewCard,
    switchTab,
    pickThumb,
    pickThumbAdd,
    escapeHtml,
    CARD_META,
  };
})();

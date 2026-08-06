window.CMS = window.CMS || {};

window.CMS.MediaManager = (function() {
  const knownImages = [
    'bank-mandiri.jpg', 'coming-soon.jpg', 'dpr-ri.jpg', 'dpr-ri2.jpg', 'experience-01.jpg',
    'japan.jpg', 'lpei.jpg', 'new_profile.jpg', 'p20.jpg', 'porto02-hover.jpg', 'profil.jpg',
    'project1.png', 'project1_screenshot.png', 'project2.png', 'project3.png', 'project4.png',
    'project4_screenshot.png', 'project5.png', 'project5_screenshot.png', 'project6.png',
    'shinzo_abe.jpg', 'space - Copy.jpg', 'space.jpg', 'work001-01.jpg', 'work001-02.jpg', 'work001-03.jpg',
    'work001-04.jpg', 'work01-hover - Copy.jpg', 'work01-hover.jpg', 'work02-hover.jpg', 'work03-hover.jpg'
  ];

  let pendingImages = [];
  let deletedImages = [];

  function getAllImages() {
    const existing = knownImages
      .filter(img => !deletedImages.includes(img))
      .map(img => ({
        filename: img,
        path: `./assets/images/${img}`,
        isNew: false
      }));
    
    const newImgs = pendingImages.map(p => ({
      filename: p.filename,
      path: `./assets/images/${p.filename}`,
      isNew: true
    }));

    return [...existing, ...newImgs];
  }

  function getUsageInfo(filename) {
    const data = window.CMS && window.CMS.state ? window.CMS.state.data : window.portfolioData;
    if (!data) return [];
    const usage = [];
    for (const [section, items] of Object.entries(data)) {
      if (typeof items === 'object' && items !== null) {
        for (const [itemId, item] of Object.entries(items)) {
          if (item.content && item.content.includes(filename)) {
            usage.push(`${section} → ${itemId}`);
          }
        }
      }
    }
    return [...new Set(usage)];
  }

  function generateCanvasThumbnail(dataUrl, maxDim = 300, quality = 0.8, callback) {
    const img = new Image();
    img.onload = function() {
      try {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return callback(dataUrl);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const thumbDataUrl = canvas.toDataURL('image/jpeg', quality);
        callback(thumbDataUrl);
      } catch (err) {
        callback(dataUrl);
      }
    };
    img.onerror = function() {
      callback(dataUrl);
    };
    img.src = dataUrl;
  }

  function handleFileUpload(file, callback) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      if (callback) callback();
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      generateCanvasThumbnail(dataUrl, 300, 0.8, function(thumbDataUrl) {
        pendingImages = pendingImages.filter(p => p.filename !== file.name);
        pendingImages.push({
          filename: file.name,
          path: `./assets/images/${file.name}`,
          thumbPath: `./assets/images/thumbs/${file.name}`,
          dataUrl: dataUrl,
          thumbDataUrl: thumbDataUrl,
          file: file
        });
        window.CMS.pendingImages = pendingImages;
        if (callback) callback();
      });
    };
    reader.readAsDataURL(file);
  }

  function renderGrid(container, onSelect) {
    container.innerHTML = '';
    
    const dropzone = document.createElement('div');
    dropzone.className = 'cms-media-dropzone';
    dropzone.innerHTML = `
      <div class="cms-media-dropzone-icon" style="font-size: 2em; margin-bottom: 10px;">⬆️</div>
      <p style="margin: 0;">Drag & Drop images here or click to upload</p>
      <input type="file" multiple accept="image/*" style="display: none;">
    `;

    // Styles handled by .cms-media-dropzone class in cms.css

    const fileInput = dropzone.querySelector('input');
    dropzone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if(files.length === 0) return;
      let loaded = 0;
      files.forEach(file => {
        handleFileUpload(file, () => {
          loaded++;
          if(loaded === files.length) renderGrid(container, onSelect);
        });
      });
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#0056b3';
      dropzone.style.backgroundColor = '#f0f8ff';
    });
    
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#ccc';
      dropzone.style.backgroundColor = '#fafafa';
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#ccc';
      dropzone.style.backgroundColor = '#fafafa';
      const files = Array.from(e.dataTransfer.files);
      if(files.length === 0) return;
      let loaded = 0;
      files.forEach(file => {
        handleFileUpload(file, () => {
          loaded++;
          if(loaded === files.length) renderGrid(container, onSelect);
        });
      });
    });

    container.appendChild(dropzone);

    const grid = document.createElement('div');
    grid.className = 'cms-media-grid';

    const images = getAllImages();
    
    images.forEach(img => {
      const item = document.createElement('div');
      item.className = 'cms-media-item';
      if (onSelect) item.style.cursor = 'pointer';

      if (onSelect) {
        item.addEventListener('mouseenter', () => item.style.transform = 'translateY(-2px)');
        item.addEventListener('mouseleave', () => item.style.transform = 'none');
      }

      const imgEl = document.createElement('img');
      imgEl.src = window.CMS.MediaManager ? window.CMS.MediaManager.getPreviewUrl(img.path) : img.path;
      imgEl.loading = 'lazy';
      imgEl.decoding = 'async';
      imgEl.title = img.filename;
      imgEl.onerror = function() {
        this.onerror = null;
        this.src = img.path;
      };
      
      const name = document.createElement('div');
      name.className = 'cms-media-item-name';
      name.textContent = img.filename;

      item.appendChild(imgEl);
      item.appendChild(name);

      if (onSelect) {
        item.addEventListener('click', () => {
          const finalPath = img.isNew ? `./assets/images/${img.filename}` : img.path;
          onSelect(finalPath);
        });
      } else {
        const usage = getUsageInfo(img.filename);
        if (usage.length > 0) {
          const usageInfo = document.createElement('div');
          usageInfo.className = 'cms-media-item-name';
          usageInfo.style.color = 'var(--cms-success)';
          usageInfo.textContent = `Used in: ${usage.join(', ')}`;
          item.appendChild(usageInfo);
        } else {
          const usageInfo = document.createElement('div');
          usageInfo.className = 'cms-media-item-name';
          usageInfo.style.color = 'var(--cms-text-muted)';
          usageInfo.textContent = `Unused`;
          item.appendChild(usageInfo);
        }

        const controls = document.createElement('div');
        controls.style.marginTop = '10px';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'cms-btn cms-btn-danger cms-btn-sm';
        deleteBtn.innerHTML = '🗑️ Delete';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Mark ${img.filename} for deletion?`)) {
            if (img.isNew) {
              pendingImages = pendingImages.filter(p => p.filename !== img.filename);
              window.CMS.pendingImages = pendingImages;
            } else {
              deletedImages.push(img.filename);
            }
            if (window.CMS.markChanged) window.CMS.markChanged();
            renderGrid(container, onSelect);
          }
        };
        controls.appendChild(deleteBtn);
        item.appendChild(controls);
      }

      grid.appendChild(item);
    });

    if (images.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.textContent = 'No images available.';
      emptyState.style.color = '#777';
      emptyState.style.gridColumn = '1 / -1';
      emptyState.style.textAlign = 'center';
      emptyState.style.padding = '20px';
      grid.appendChild(emptyState);
    }

    container.appendChild(grid);
  }

  function createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'cms-modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'cms-modal';
    
    const header = document.createElement('div');
    header.className = 'cms-modal-header';
    header.innerHTML = `<h3>🖼️ Pilih Gambar</h3><button class="cms-modal-close">✕</button>`;
    
    const body = document.createElement('div');
    body.className = 'cms-modal-body';
    
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    
    return { overlay, body, closeBtn: header.querySelector('.cms-modal-close') };
  }

  return {
    init: function() {
      window.CMS.pendingImages = pendingImages;
    },
    
    getPreviewUrl: function(path) {
      if (!path) return '';
      if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      const filename = path.replace(/^\.\/assets\/images\//, '').replace(/^assets\/images\//, '');
      
      const pending = pendingImages.find(p => p.filename === filename);
      if (pending && pending.thumbDataUrl) {
        return pending.thumbDataUrl;
      }
      
      return `./assets/images/thumbs/${filename}`;
    },
    
    render: function(container) {
      container.innerHTML = `
        <div class="cms-section-header">
          <div>
            <h2>🖼️ Media Manager</h2>
            <p style="color: var(--cms-text-secondary); font-size: 14px; margin-top: 4px;">
              Kelola semua gambar yang digunakan di website portfolio
            </p>
          </div>
        </div>
      `;
      const content = document.createElement('div');
      renderGrid(content);
      container.appendChild(content);
    },
    
    openPicker: function(callback) {
      const { overlay, body, closeBtn } = createModal();
      document.body.appendChild(overlay);
      
      const closeModal = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      };
      
      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) closeModal();
      });
      
      renderGrid(body, (selectedPath) => {
        callback(selectedPath);
        closeModal();
      });
    },
    
    getPendingImages: function() {
      return pendingImages;
    },
    
    getDeletedImages: function() {
      return deletedImages;
    },

    clearDeletedImages: function() {
      deletedImages = [];
    }
  };
})();

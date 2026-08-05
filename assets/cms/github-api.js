window.CMS = window.CMS || {};

window.CMS.GitHubAPI = (function() {
    const REPO_OWNER = 'cantikapf';
    const REPO_NAME = 'cantikapf.github.io';
    const BRANCH = 'main';
    const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
    
    let pat = localStorage.getItem('cms_github_pat') || '';
    let isConnected = false;

    // Helper for base64 encoding (UTF-8 safe)
    function b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
    }

    async function apiRequest(endpoint, options = {}) {
        if (!pat) throw new Error('GitHub PAT not configured');
        
        const headers = {
            'Authorization': `token ${pat}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
            ...options,
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = `GitHub API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        return await response.json();
    }

    async function validatePAT() {
        if (!pat) {
            isConnected = false;
            return false;
        }
        try {
            await apiRequest('');
            isConnected = true;
            return true;
        } catch (error) {
            isConnected = false;
            console.error('PAT Validation failed:', error);
            return false;
        }
    }

    function generateDataJS(data) {
        let jsString = 'const portfolioData = {\n';
        const sections = ['certification', 'experience', 'projects', 'works'];
        
        sections.forEach((section, sIndex) => {
            if (!data[section]) return;
            jsString += `  "${section}": {\n`;
            const keys = Object.keys(data[section]);
            keys.forEach((key, kIndex) => {
                const item = data[section][key];
                jsString += `    "${key}": {\n`;
                jsString += `      "title": ${JSON.stringify(item.title)},\n`;
                jsString += `      "content": ${JSON.stringify(item.content)}\n`;
                jsString += `    }${kIndex < keys.length - 1 ? ',' : ''}\n`;
            });
            jsString += `  }${sIndex < sections.length - 1 ? ',' : ''}\n`;
        });
        jsString += '};\n';
        return jsString;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async function generateHTMLFiles() {
        const files = {};
        if (window.CMS.state && window.CMS.state.carouselCards) {
            window.CMS.state.htmlTemplates = window.CMS.state.htmlTemplates || {};
            const sections = ['certification', 'experience', 'projects', 'works'];
            
            for (const section of sections) {
                if (window.CMS.state.carouselCards[section]) {
                    // Fetch template if not already present
                    if (!window.CMS.state.htmlTemplates[section]) {
                        try {
                            const res = await fetch(`./${section}.html?v=${Date.now()}`);
                            if (res.ok) {
                                window.CMS.state.htmlTemplates[section] = await res.text();
                            }
                        } catch (e) {
                            console.error(`Failed to fetch ${section}.html`, e);
                        }
                    }

                    if (window.CMS.state.htmlTemplates[section]) {
                        let template = window.CMS.state.htmlTemplates[section];
                        const cards = window.CMS.state.carouselCards[section];
                        
                        let finalCardsHtml = '';
                        for (let i = 0; i < cards.length; i += 3) {
                            let slide = cards.slice(i, i + 3);
                            finalCardsHtml += `            <div class="item ${i === 0 ? 'active' : ''}">\n                <div class="row">\n`;
                            for (let j = 0; j < slide.length; j++) {
                                const card = slide[j];
                                const cardIdx = i + j + 1;
                                const total = cards.length;
                                
                                finalCardsHtml += `                    <div class="col-sm-4">
                      <a href="./detail.html?type=${section}&id=${card.id}" title="" class="black-image-project-hover">
                        <img src="${card.thumb}" alt="${escapeHtml(card.title)}" class="img-responsive" style="aspect-ratio: 770/498; object-fit: cover; width: 100%;">
                      </a>
                      <div class="card-container card-container-lg">
                        <h4>${String(cardIdx).padStart(3, '0')}/${String(total).padStart(3, '0')}</h4>
                        <h3>${escapeHtml(card.title)}</h3>
                        <p>${escapeHtml(card.subtitle)}</p>
                        <a href="./detail.html?type=${section}&id=${card.id}" title="" class="btn btn-default">Discover</a>
                      </div>
                    </div>\n`;
                            }
                            finalCardsHtml += `                </div>\n            </div>\n`;
                        }
                        
                        const startMarker = '<div class="carousel-inner">';
                        const endMarker = '<!--/carousel-inner-->';
                        
                        if (template.includes(startMarker) && template.includes(endMarker)) {
                            const before = template.split(startMarker)[0];
                            const after = template.split(endMarker)[1];
                            files[`${section}.html`] = before + startMarker + '\n' + finalCardsHtml + '        ' + endMarker + after;
                        } else {
                            files[`${section}.html`] = template;
                        }
                    }
                }
            }
        }
        return files;
    }

    async function downloadZip() {
        if (typeof JSZip === 'undefined') {
            if (window.CMS.toast) window.CMS.toast('JSZip library not loaded.', 'error');
            return;
        }

        try {
            const zip = new JSZip();
            
            // Add data.js
            if (window.CMS.state && window.CMS.state.data) {
                const dataJsContent = generateDataJS(window.CMS.state.data);
                zip.file('assets/js/data.js', dataJsContent);
            }

            // Add HTML files
            const htmlFiles = await generateHTMLFiles();
            Object.keys(htmlFiles).forEach(filename => {
                zip.file(filename, htmlFiles[filename]);
            });

            // Add images
            if (window.CMS.MediaManager && typeof window.CMS.MediaManager.getPendingImages === 'function') {
                const pendingImages = window.CMS.MediaManager.getPendingImages();
                pendingImages.forEach(img => {
                    // Export original high-res image
                    let data = img.dataUrl;
                    if (data && data.includes(',')) {
                        data = data.split(',')[1];
                    }
                    if (data) {
                        zip.file(`assets/images/${img.filename}`, data, {base64: true});
                    }

                    // Export low-res thumbnail image
                    let thumbData = img.thumbDataUrl || img.dataUrl;
                    if (thumbData && thumbData.includes(',')) {
                        thumbData = thumbData.split(',')[1];
                    }
                    if (thumbData) {
                        zip.file(`assets/images/thumbs/${img.filename}`, thumbData, {base64: true});
                    }
                });
            }

            const content = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'portfolio-export.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (window.CMS.toast) window.CMS.toast('ZIP downloaded successfully!', 'success');
        } catch (error) {
            console.error('ZIP generation error:', error);
            if (window.CMS.toast) window.CMS.toast('Failed to generate ZIP.', 'error');
        }
    }

    async function pushToGitHub() {
        if (!isConnected) {
            if (window.CMS.toast) window.CMS.toast('GitHub not connected.', 'error');
            return;
        }
        
        try {
            if (window.CMS.toast) window.CMS.toast('Preparing files for GitHub commit...', 'info');

            const filesToCommit = [];
            
            // Add data.js
            if (window.CMS.state && window.CMS.state.data) {
                // Build data.js content
                let dataJsContent = generateDataJS(window.CMS.state.data) + '\n\n';
                if (window.CMS.state && window.CMS.state.carouselCards) {
                    dataJsContent += 'const cardData = ' + JSON.stringify(window.CMS.state.carouselCards, null, 2) + ';\n';
                }

                filesToCommit.push({
                    path: 'assets/js/data.js',
                    content: b64EncodeUnicode(dataJsContent)
                });
            }

            // Add HTML files
            const htmlFiles = await generateHTMLFiles();
            Object.keys(htmlFiles).forEach(filename => {
                filesToCommit.push({
                    path: filename,
                    content: b64EncodeUnicode(htmlFiles[filename])
                });
            });

            // Add pending images
            if (window.CMS.MediaManager && typeof window.CMS.MediaManager.getPendingImages === 'function') {
                const pendingImages = window.CMS.MediaManager.getPendingImages();
                pendingImages.forEach(img => {
                    // Push original high-res image
                    let origData = img.dataUrl || img.data;
                    if (origData && origData.includes(',')) origData = origData.split(',')[1];
                    if (origData) {
                        filesToCommit.push({
                            path: `./assets/images/${img.filename}`.replace(/^\.\//, ''),
                            content: origData
                        });
                    }

                    // Push low-res thumbnail image
                    let thumbData = img.thumbDataUrl || origData;
                    if (thumbData && thumbData.includes(',')) thumbData = thumbData.split(',')[1];
                    if (thumbData) {
                        filesToCommit.push({
                            path: `assets/images/thumbs/${img.filename}`,
                            content: thumbData
                        });
                    }
                });
            }

            let commitSuccessCount = 0;

            for (const file of filesToCommit) {
                let sha = null;
                try {
                    const currentFile = await apiRequest(`/contents/${file.path}?ref=${BRANCH}`);
                    sha = currentFile.sha;
                } catch (e) {
                    // File might not exist yet (e.g. new image)
                    if (e.message.indexOf('404') === -1) {
                        throw e;
                    }
                }

                const payload = {
                    message: 'cms: Update portfolio content via CMS',
                    content: file.content,
                    branch: BRANCH
                };
                if (sha) payload.sha = sha;

                await apiRequest(`/contents/${file.path}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                
                commitSuccessCount++;
            }

            if (window.CMS.toast) window.CMS.toast(`Successfully pushed ${commitSuccessCount} files to GitHub! 🚀`, 'success');
            
            // Clear pending changes state
            if (window.CMS.state) {
                window.CMS.state.pendingChanges = false;
                const dots = document.querySelectorAll('.cms-pending-indicator');
                dots.forEach(d => d.style.display = 'none');
            }
        } catch (error) {
            console.error('GitHub Push Error:', error);
            if (window.CMS.toast) window.CMS.toast(`Push failed: ${error.message}`, 'error');
        }
    }

    function render(container) {
        container.innerHTML = `
            <div class="cms-export-view">
                <h2>Export & Publishing</h2>
                
                <div class="cms-github-config cms-card">
                    <h3>⚙️ GitHub Configuration</h3>
                    <div class="cms-form-group">
                        <label class="cms-form-label">Personal Access Token (PAT)</label>
                        <input type="password" id="cms-github-pat" class="cms-form-input" placeholder="ghp_xxxxxxxxxxxx" value="${pat}">
                        <small>Needs 'repo' scope. Token is saved securely in your browser's localStorage.</small>
                    </div>
                    <div class="cms-btn-group" style="margin-top: 10px;">
                        <button id="cms-btn-save-pat" class="cms-btn cms-btn-primary">Save Token</button>
                        <button id="cms-btn-clear-pat" class="cms-btn cms-btn-secondary">Clear</button>
                    </div>
                    <div class="cms-github-status" style="margin-top: 15px;">
                        Status: <span class="cms-github-status-dot ${isConnected ? 'connected' : 'disconnected'}" style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${isConnected ? 'green' : 'red'}; margin:0 5px;"></span> 
                        <span id="cms-github-status-text">${isConnected ? '✅ Connected' : '❌ Not Connected'}</span>
                    </div>
                </div>

                <div class="cms-export-options">
                    <div class="cms-export-card" id="cms-export-zip">
                        <div class="cms-export-card-icon">📦</div>
                        <h4>Download ZIP</h4>
                        <p>Download all updated files to your local machine.</p>
                        <button class="cms-btn cms-btn-lg cms-btn-secondary" style="width:100%">Download</button>
                    </div>
                    <div class="cms-export-card ${!isConnected ? 'disabled' : ''}" id="cms-export-github" style="opacity: ${isConnected ? '1' : '0.5'};">
                        <div class="cms-export-card-icon">🔗</div>
                        <h4>Push to GitHub</h4>
                        <p>Commit and push changes directly to main branch.</p>
                        <button class="cms-btn cms-btn-lg cms-btn-success" style="width:100%" ${!isConnected ? 'disabled' : ''}>Deploy Now</button>
                    </div>
                </div>

                <div class="cms-diff" style="margin-top: 30px; max-width: 100%;">
                    <h3>Preview Changes (data.js)</h3>
                    <pre id="cms-diff-preview" class="cms-diff-content cms-diff-add" style="background: #f4f4f4; padding: 15px; border-left: 4px solid #4CAF50; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; max-width: 100%;"></pre>
                </div>
            </div>
        `;

        bindEvents(container);
        updateDiffPreview();
    }

    function bindEvents(container) {
        const patInput = container.querySelector('#cms-github-pat');
        
        container.querySelector('#cms-btn-save-pat').addEventListener('click', async () => {
            pat = patInput.value.trim();
            if (pat) {
                localStorage.setItem('cms_github_pat', pat);
                const valid = await validatePAT();
                updateStatusUI(container);
                if (valid) {
                    if (window.CMS.toast) window.CMS.toast('GitHub PAT saved and validated.', 'success');
                } else {
                    if (window.CMS.toast) window.CMS.toast('Invalid GitHub PAT.', 'error');
                }
            }
        });

        container.querySelector('#cms-btn-clear-pat').addEventListener('click', () => {
            pat = '';
            localStorage.removeItem('cms_github_pat');
            patInput.value = '';
            isConnected = false;
            updateStatusUI(container);
            if (window.CMS.toast) window.CMS.toast('GitHub PAT cleared.', 'info');
        });

        container.querySelector('#cms-export-zip button').addEventListener('click', downloadZip);
        
        container.querySelector('#cms-export-github button').addEventListener('click', pushToGitHub);
    }

    function updateStatusUI(container) {
        const statusDot = container.querySelector('.cms-github-status-dot');
        const statusText = container.querySelector('#cms-github-status-text');
        const githubCard = container.querySelector('#cms-export-github');
        const githubBtn = githubCard.querySelector('button');

        if (isConnected) {
            statusDot.style.backgroundColor = 'green';
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.innerHTML = '✅ Connected';
            githubCard.classList.remove('disabled');
            githubCard.style.opacity = '1';
            githubBtn.disabled = false;
        } else {
            statusDot.style.backgroundColor = 'red';
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.innerHTML = '❌ Not Connected';
            githubCard.classList.add('disabled');
            githubCard.style.opacity = '0.5';
            githubBtn.disabled = true;
        }
    }

    function updateDiffPreview() {
        const previewEl = document.getElementById('cms-diff-preview');
        if (!previewEl) return;
        
        if (window.CMS.state && window.CMS.state.data) {
            const newData = generateDataJS(window.CMS.state.data);
            previewEl.textContent = newData;
        } else {
            previewEl.textContent = 'No data available to preview.';
        }
    }

    return {
        init: async function() {
            if (pat) {
                await validatePAT();
            }
        },
        render: render,
        generateDataJS: generateDataJS,
        downloadZip: downloadZip,
        pushToGitHub: pushToGitHub,
        isConnected: function() { return isConnected; },
        apiRequest: apiRequest,
        getBranch: function() { return BRANCH; }
    };
})();

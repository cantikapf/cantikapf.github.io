/**
 * CMS Audit Log
 * Fetches and displays commit history from GitHub to monitor updates.
 */
window.CMS = window.CMS || {};

window.CMS.AuditLog = (function () {
    'use strict';

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
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

    async function fetchCommits() {
        if (!window.CMS.GitHubAPI || !window.CMS.GitHubAPI.apiRequest) {
            throw new Error('GitHub API module is missing or apiRequest is not exposed.');
        }
        
        // Use the shared apiRequest function to fetch commits for the configured branch
        const branch = typeof window.CMS.GitHubAPI.getBranch === 'function' 
            ? window.CMS.GitHubAPI.getBranch() 
            : 'main';
            
        // We use the existing GitHub apiRequest function which already includes the base REPO URL
        // Endpoint: GET /repos/{owner}/{repo}/commits?sha=main
        // In apiRequest, it prepends /repos/cantikapf/cantikapf.github.io
        const endpoint = `/commits?sha=${branch}&per_page=30`;
        const commits = await window.CMS.GitHubAPI.apiRequest(endpoint);
        return commits;
    }

    async function renderLog(container) {
        container.innerHTML = `
            <div class="cms-section-header">
                <div>
                    <h2>📜 Audit Log</h2>
                    <p style="color: var(--cms-text-secondary); font-size: 14px; margin-top: 4px;">
                        Riwayat pembaruan (deployment) pada website portfolio Anda
                    </p>
                </div>
                <div class="cms-section-actions">
                    <button id="cms-btn-refresh-log" class="cms-btn cms-btn-secondary">🔄 Refresh</button>
                </div>
            </div>
            
            <div id="cms-audit-log-content" style="margin-top: 20px;">
                <div style="text-align: center; padding: 40px; color: var(--cms-text-muted);">
                    <div class="cms-spinner"></div>
                    <p style="margin-top: 16px;">Memuat riwayat pembaruan dari GitHub...</p>
                </div>
            </div>
        `;

        container.querySelector('#cms-btn-refresh-log').addEventListener('click', () => {
            renderLog(container); // Re-render to refresh
        });

        const contentDiv = container.querySelector('#cms-audit-log-content');

        try {
            const commits = await fetchCommits();
            
            if (!Array.isArray(commits) || commits.length === 0) {
                contentDiv.innerHTML = `
                    <div class="cms-empty-state">
                        <div class="cms-empty-state-icon">📭</div>
                        <h3>Belum ada riwayat</h3>
                        <p>Belum ada commit atau pembaruan yang ditemukan di repositori ini.</p>
                    </div>
                `;
                return;
            }

            let logHtml = `<div class="cms-card" style="padding: 0; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 1px solid var(--cms-border);">
                            <th style="padding: 16px;">Waktu (Date)</th>
                            <th style="padding: 16px;">Pembaruan (Message)</th>
                            <th style="padding: 16px;">Author</th>
                            <th style="padding: 16px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            commits.forEach(commitObj => {
                const commit = commitObj.commit;
                const message = escapeHtml(commit.message.split('\n')[0]); // First line only
                const date = formatDate(commit.author.date);
                const author = escapeHtml(commit.author.name);
                const url = commitObj.html_url;
                const sha = commitObj.sha.substring(0, 7);
                
                // Highlight CMS commits
                const isCMS = message.toLowerCase().includes('cms');
                const rowBg = isCMS ? 'background: rgba(52, 211, 153, 0.05);' : '';
                const badge = isCMS ? `<span class="cms-badge cms-badge-success" style="font-size: 10px; margin-left: 8px;">Via CMS</span>` : '';

                logHtml += `
                    <tr style="border-bottom: 1px solid var(--cms-border); ${rowBg}">
                        <td style="padding: 16px; color: var(--cms-text-secondary); white-space: nowrap;">
                            ${date}
                        </td>
                        <td style="padding: 16px; font-weight: 500;">
                            ${message} ${badge}
                        </td>
                        <td style="padding: 16px;">
                            ${author}
                        </td>
                        <td style="padding: 16px;">
                            <a href="${url}" target="_blank" class="cms-btn cms-btn-sm cms-btn-secondary" style="text-decoration: none; display: inline-block;">
                                View (${sha}) ↗
                            </a>
                        </td>
                    </tr>
                `;
            });

            logHtml += `</tbody></table></div>`;
            contentDiv.innerHTML = logHtml;

        } catch (error) {
            console.error('Audit Log Fetch Error:', error);
            contentDiv.innerHTML = `
                <div class="cms-empty-state" style="border-color: var(--cms-danger); background: rgba(239, 68, 68, 0.05);">
                    <div class="cms-empty-state-icon" style="color: var(--cms-danger);">⚠️</div>
                    <h3 style="color: var(--cms-danger);">Gagal memuat log</h3>
                    <p>${escapeHtml(error.message)}</p>
                    <p style="font-size: 12px; margin-top: 8px; color: var(--cms-text-secondary);">
                        Pastikan Anda telah menyetel Personal Access Token (PAT) di menu Export & Deploy jika repository ini di-set private, atau tunggu beberapa saat jika terkena rate limit GitHub.
                    </p>
                </div>
            `;
        }
    }

    return {
        init: function() {
            // Nothing needed to initialize upfront
        },
        render: renderLog
    };
})();

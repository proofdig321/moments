// Enhanced PWA Markdown Renderer - WhatsApp Content Support
// Handles line breaks, lists, and formatting from WhatsApp messages

class MomentsMarkdownRenderer {
    constructor() {
        this.whatsappPatterns = [
            // Numbered lists: "1. Item" -> <ol><li>Item</li></ol>
            { pattern: /^(\d+\.)\s+(.+)$/gm, replacement: '<li data-number="$1">$2</li>', type: 'numbered' },
            // Bullet points: "- Item" or "* Item" -> <ul><li>Item</li></ul>
            { pattern: /^[-*]\s+(.+)$/gm, replacement: '<li>$1</li>', type: 'bullet' },
            // Bold: **text** -> <strong>text</strong>
            { pattern: /\*\*([^*]+)\*\*/g, replacement: '<strong>$1</strong>' },
            // Italic: *text* -> <em>text</em>
            { pattern: /\*([^*]+)\*/g, replacement: '<em>$1</em>' },
            // Links: [text](url) -> <a href="url">text</a>
            { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" target="_blank" rel="noopener">$1</a>' }
        ];
    }

    render(content, options = {}) {
        if (!content) return '';
        
        let html = content;
        
        if (options.isWhatsApp || this.detectWhatsAppContent(content)) {
            html = this.renderWhatsAppContent(html);
        } else {
            html = this.renderStandardMarkdown(html);
        }
        
        return this.sanitize(html);
    }
    
    renderWhatsAppContent(content) {
        let html = content;
        
        // Handle numbered lists first
        const numberedItems = [];
        html = html.replace(/^(\d+\.)\s+(.+)$/gm, (match, num, text) => {
            numberedItems.push(text);
            return `<li>${text}</li>`;
        });
        
        if (numberedItems.length > 0) {
            html = html.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
        }
        
        // Handle bullet points
        const bulletItems = [];
        html = html.replace(/^[-*]\s+(.+)$/gm, (match, text) => {
            bulletItems.push(text);
            return `<li>${text}</li>`;
        });
        
        if (bulletItems.length > 0 && numberedItems.length === 0) {
            html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        }
        
        // Apply formatting
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // Preserve line breaks - key for WhatsApp content
        html = html.replace(/\n\n+/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs if not already wrapped
        if (!html.includes('<p>') && !html.includes('<ul>') && !html.includes('<ol>')) {
            html = `<p>${html}</p>`;
        }
        
        return html;
    }
    
    renderStandardMarkdown(content) {
        let html = content;
        
        // Standard markdown patterns
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // Handle paragraphs
        html = html.replace(/\n\n+/g, '</p><p>');
        if (!html.includes('<p>')) {
            html = `<p>${html}</p>`;
        }
        
        return html;
    }
    
    detectWhatsAppContent(content) {
        return /^\d+\.\s+/m.test(content) || /^[-*]\s+/m.test(content) || /\n{2,}/.test(content);
    }
    
    sanitize(html) {
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/g, '')
            .replace(/javascript:/gi, '');
    }
}

window.momentsRenderer = new MomentsMarkdownRenderer();

function renderMomentContent(moment) {
    const renderer = window.momentsRenderer;
    const isWhatsApp = moment.content_source === 'community' || 
                      moment.content_source === 'whatsapp' ||
                      renderer.detectWhatsAppContent(moment.content);
    
    return renderer.render(moment.content, { isWhatsApp });
}

function displayMomentsWithMarkdown(moments) {
    const container = document.getElementById('moments-container');
    
    if (moments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌱</div>
                <h3>Community moments coming soon</h3>
                <p>Join our WhatsApp to be the first to receive updates.</p>
                <a href="https://wa.me/27658295041?text=START" class="join-whatsapp">
                    📱 Join WhatsApp Community
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = moments.map(moment => {
        const renderedContent = renderMomentContent(moment);
        const isLongContent = moment.content.length > 300;
        
        return `
            <div class="moment-card">
                ${renderSponsorBranding(moment.sponsors, moment.is_sponsored)}
                <h3 class="moment-title">${escapeHtml(moment.title)}</h3>
                <div class="moment-content ${isLongContent ? 'collapsed' : ''}" 
                     data-full-content="${escapeHtml(moment.content)}"
                     data-is-whatsapp="${moment.content_source === 'community' || moment.content_source === 'whatsapp'}">
                    ${isLongContent ? renderMomentContent({...moment, content: moment.content.substring(0, 300) + '...'}) : renderedContent}
                </div>
                ${isLongContent ? '<button class="expand-content" onclick="toggleMomentContent(this)">Read more</button>' : ''}
                
                ${renderMedia(moment.media_urls)}
                ${renderComments(moment.comments)}
                
                <div class="moment-meta">
                    <span class="badge region-badge">${escapeHtml(moment.region)}</span>
                    <span class="badge category-badge">${escapeHtml(moment.category)}</span>
                    ${moment.is_sponsored ? '<span class="badge sponsored-badge">Sponsored</span>' : ''}
                    ${moment.content_source === 'community' ? '<span class="badge" style="background: #e0f2fe; color: #0277bd;">Community</span>' : ''}
                </div>
                
                <div class="moment-footer">
                    <span>${formatDate(moment.broadcasted_at)}</span>
                    ${renderSponsorAttribution(moment.sponsors, moment.is_sponsored)}
                </div>
            </div>
        `;
    }).join('');
}

function toggleMomentContent(button) {
    const contentDiv = button.previousElementSibling;
    const isCollapsed = contentDiv.classList.contains('collapsed');
    const fullContent = contentDiv.dataset.fullContent;
    const isWhatsApp = contentDiv.dataset.isWhatsapp === 'true';
    
    if (isCollapsed) {
        const renderedContent = window.momentsRenderer.render(fullContent, { isWhatsApp });
        contentDiv.innerHTML = renderedContent;
        contentDiv.classList.remove('collapsed');
        button.textContent = 'Read less';
    } else {
        const shortContent = fullContent.substring(0, 300) + '...';
        const renderedShortContent = window.momentsRenderer.render(shortContent, { isWhatsApp });
        contentDiv.innerHTML = renderedShortContent;
        contentDiv.classList.add('collapsed');
        button.textContent = 'Read more';
    }
}

// Media rendering function for PWA
function renderMedia(mediaUrls) {
    if (!mediaUrls || mediaUrls.length === 0) return '';
    
    const mediaItems = mediaUrls.slice(0, 4); // Show max 4 items
    const hasMore = mediaUrls.length > 4;
    
    return `
        <div class="moment-media">
            ${mediaItems.map((url, index) => {
                if (!url || url.trim() === '') return '';
                
                const ext = url.split('.').pop()?.toLowerCase() || '';
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                    return `
                        <div class="media-preview">
                            <img src="${escapeHtml(url)}" alt="Moment image" onclick="openMedia('${escapeHtml(url)}')" onerror="this.parentElement.innerHTML='<div class=\"media-icon\">🖼️</div>'">
                            ${hasMore && index === 3 ? `<div class="media-overlay">+${mediaUrls.length - 4}</div>` : ''}
                        </div>
                    `;
                } else if (['mp4', 'webm', 'mov', '3gp'].includes(ext)) {
                    return `
                        <div class="media-preview">
                            <video preload="metadata" onclick="openMedia('${escapeHtml(url)}')">
                                <source src="${escapeHtml(url)}">
                            </video>
                            <div class="media-icon">▶️</div>
                            ${hasMore && index === 3 ? `<div class="media-overlay">+${mediaUrls.length - 4}</div>` : ''}
                        </div>
                    `;
                } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'amr'].includes(ext)) {
                    return `
                        <div class="media-preview">
                            <div class="media-icon">🎧</div>
                            <audio controls style="position: absolute; bottom: 0; width: 100%; height: 30px;">
                                <source src="${escapeHtml(url)}">
                            </audio>
                        </div>
                    `;
                } else {
                    return `
                        <div class="media-preview">
                            <div class="media-icon">📄</div>
                            <a href="${escapeHtml(url)}" target="_blank" style="position: absolute; inset: 0;"></a>
                        </div>
                    `;
                }
            }).filter(Boolean).join('')}
        </div>
    `;
}

// Comments rendering function for PWA
function renderComments(comments) {
    if (!comments || comments.length === 0) return '';
    
    return `
        <div class="moment-comments">
            <h4 class="comments-header">💬 Community Comments (${comments.length})</h4>
            ${comments.slice(0, 3).map(comment => `
                <div class="comment-item ${comment.featured ? 'featured' : ''}">
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    <div class="comment-meta">
                        <span class="comment-author">Community member</span>
                        <span class="comment-time">${formatDate(comment.created_at)}</span>
                        ${comment.reply_count > 0 ? `<span class="comment-replies">${comment.reply_count} replies</span>` : ''}
                    </div>
                </div>
            `).join('')}
            ${comments.length > 3 ? `
                <div class="comments-more">
                    <button class="expand-comments" onclick="loadMoreComments(this)" data-moment-id="${comments[0].moment_id}">
                        View all ${comments.length} comments
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Sponsor branding function for PWA
function renderSponsorBranding(sponsor, isSponsored) {
    if (!isSponsored || !sponsor) return '';
    
    const logoHtml = sponsor.logo_url ? 
        `<img src="${escapeHtml(sponsor.logo_url)}" alt="${escapeHtml(sponsor.display_name)} logo" style="height: 24px; width: auto; margin-right: 8px;" onerror="this.style.display='none'">` : '';
    
    return `
        <div class="sponsor-branding" style="display: flex; align-items: center; margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #fbbf24;">
            ${logoHtml}
            <span style="font-size: 0.75rem; color: #6b7280; font-weight: 500;">Sponsored by ${escapeHtml(sponsor.display_name)}</span>
        </div>
    `;
}

// Sponsor attribution function for PWA
function renderSponsorAttribution(sponsor, isSponsored) {
    if (!isSponsored || !sponsor) return '';
    return `<span style="font-size: 0.75rem; color: #6b7280;">by ${escapeHtml(sponsor.display_name)}</span>`;
}

// Date formatting function
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// HTML escaping function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.renderMedia = renderMedia;
window.renderComments = renderComments;
window.renderSponsorBranding = renderSponsorBranding;
window.renderSponsorAttribution = renderSponsorAttribution;
window.formatDate = formatDate;
window.escapeHtml = escapeHtml;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MomentsMarkdownRenderer, renderMomentContent, renderMedia, renderComments };
}
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MomentsMarkdownRenderer, renderMomentContent };
}
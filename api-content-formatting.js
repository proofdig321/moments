// API Content Formatting Fix
// Ensures moment content preserves line breaks and formatting for proper Markdown rendering

// Add this to the admin API moments creation/update endpoints

function preserveContentFormatting(content) {
    if (!content) return content;
    
    // Preserve line breaks and whitespace for Markdown rendering
    // Don't strip newlines or normalize whitespace
    return content.trim();
}

// Update moment creation in admin API
// Replace content processing with:
const processedContent = preserveContentFormatting(body.content);

// For WhatsApp-originated content, detect and preserve formatting
function detectWhatsAppFormatting(content, source) {
    if (source === 'whatsapp' || source === 'community') {
        // Mark as WhatsApp content for proper rendering
        return {
            content: preserveContentFormatting(content),
            formatting_hints: {
                source: 'whatsapp',
                preserve_linebreaks: true,
                has_lists: /^(\d+\.\s+|[-*]\s+)/m.test(content)
            }
        };
    }
    
    return {
        content: preserveContentFormatting(content),
        formatting_hints: {
            source: 'markdown',
            preserve_linebreaks: false
        }
    };
}

// API response should include formatting hints
// Add to moment objects returned by API:
/*
{
    ...moment,
    formatting_hints: moment.formatting_hints || {
        source: moment.content_source === 'community' ? 'whatsapp' : 'markdown',
        preserve_linebreaks: moment.content_source === 'community'
    }
}
*/
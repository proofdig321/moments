// Phase 3 Enhancements: Real-time Updates & Advanced Analytics

// Real-time updates using Supabase Realtime
class RealtimeManager {
    constructor() {
        this.subscriptions = new Map();
        this.enabled = false;
    }
    
    async init() {
        if (!window.supabase) {
            console.warn('Supabase client not available for realtime');
            return;
        }
        
        this.enabled = true;
        console.log('✅ Realtime manager initialized');
    }
    
    subscribe(table, callback) {
        if (!this.enabled) return;
        
        const channel = window.supabase
            .channel(`${table}-changes`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: table },
                (payload) => {
                    console.log(`📡 ${table} update:`, payload);
                    callback(payload);
                }
            )
            .subscribe();
        
        this.subscriptions.set(table, channel);
        console.log(`📡 Subscribed to ${table} changes`);
    }
    
    unsubscribe(table) {
        const channel = this.subscriptions.get(table);
        if (channel) {
            channel.unsubscribe();
            this.subscriptions.delete(table);
            console.log(`📡 Unsubscribed from ${table}`);
        }
    }
    
    unsubscribeAll() {
        this.subscriptions.forEach((channel, table) => {
            channel.unsubscribe();
        });
        this.subscriptions.clear();
        console.log('📡 All subscriptions cleared');
    }
}

// Initialize realtime manager
const realtime = new RealtimeManager();

// Auto-refresh dashboard when data changes
function setupRealtimeUpdates() {
    // Subscribe to moments changes
    realtime.subscribe('moments', (payload) => {
        if (document.getElementById('moments')?.classList.contains('active')) {
            showNotification('New moment detected - refreshing...', 'info');
            setTimeout(() => loadMoments(), 1000);
        }
        // Always refresh analytics
        if (document.getElementById('dashboard')?.classList.contains('active')) {
            loadAnalytics();
        }
    });
    
    // Subscribe to subscriptions changes
    realtime.subscribe('subscriptions', (payload) => {
        if (document.getElementById('subscribers')?.classList.contains('active')) {
            showNotification('Subscriber update detected', 'info');
            setTimeout(() => loadSubscribers(), 1000);
        }
        // Refresh analytics
        if (document.getElementById('dashboard')?.classList.contains('active')) {
            loadAnalytics();
        }
    });
    
    // Subscribe to campaigns changes
    realtime.subscribe('campaigns', (payload) => {
        if (document.getElementById('campaigns')?.classList.contains('active')) {
            showNotification('Campaign update detected', 'info');
            setTimeout(() => loadCampaigns(), 1000);
        }
    });
}

// Advanced Analytics
class AdvancedAnalytics {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute
    }
    
    async getTrends(days = 30) {
        const cacheKey = `trends-${days}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const response = await apiFetch(`/analytics/trends?days=${days}`);
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Failed to load trends:', error);
            return null;
        }
    }
    
    async getRegionalBreakdown() {
        try {
            const response = await apiFetch('/analytics/regional');
            return await response.json();
        } catch (error) {
            console.error('Failed to load regional data:', error);
            return null;
        }
    }
    
    async getCategoryBreakdown() {
        try {
            const response = await apiFetch('/analytics/categories');
            return await response.json();
        } catch (error) {
            console.error('Failed to load category data:', error);
            return null;
        }
    }
    
    clearCache() {
        this.cache.clear();
    }
}

const analytics = new AdvancedAnalytics();

// Audit Log Viewer
class AuditLogViewer {
    constructor() {
        this.logs = [];
        this.filters = {
            action: 'all',
            user: 'all',
            dateFrom: null,
            dateTo: null
        };
    }
    
    async loadLogs(limit = 50) {
        try {
            const response = await apiFetch(`/audit-logs?limit=${limit}`);
            const data = await response.json();
            this.logs = data.logs || [];
            return this.logs;
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            return [];
        }
    }
    
    filterLogs() {
        return this.logs.filter(log => {
            if (this.filters.action !== 'all' && log.action !== this.filters.action) {
                return false;
            }
            if (this.filters.user !== 'all' && log.user_id !== this.filters.user) {
                return false;
            }
            if (this.filters.dateFrom && new Date(log.timestamp) < new Date(this.filters.dateFrom)) {
                return false;
            }
            if (this.filters.dateTo && new Date(log.timestamp) > new Date(this.filters.dateTo)) {
                return false;
            }
            return true;
        });
    }
    
    renderLogs(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const filtered = this.filterLogs();
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class=\"empty-state\">No audit logs found</div>';
            return;
        }
        
        const html = filtered.map(log => `
            <div class=\"audit-log-item\" style=\"padding: 0.75rem; border-left: 3px solid #2563eb; margin-bottom: 0.5rem; background: #f8fafc;\">
                <div style=\"display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;\">
                    <strong>${log.action}</strong>
                    <span style=\"font-size: 0.75rem; color: #6b7280;\">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div style=\"font-size: 0.875rem; color: #374151;\">
                    User: ${log.user_email || log.user_id}<br>
                    ${log.details ? `Details: ${log.details}` : ''}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
}

const auditLog = new AuditLogViewer();

// Performance Metrics Dashboard
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            pageLoad: 0,
            apiCalls: [],
            errors: []
        };
    }
    
    recordPageLoad() {
        if (performance.timing) {
            this.metrics.pageLoad = performance.timing.loadEventEnd - performance.timing.navigationStart;
        }
    }
    
    recordApiCall(endpoint, duration, success) {
        this.metrics.apiCalls.push({
            endpoint,
            duration,
            success,
            timestamp: Date.now()
        });
        
        // Keep only last 100 calls
        if (this.metrics.apiCalls.length > 100) {
            this.metrics.apiCalls.shift();
        }
    }
    
    recordError(error, context) {
        this.metrics.errors.push({
            error: error.message,
            context,
            timestamp: Date.now()
        });
        
        // Keep only last 50 errors
        if (this.metrics.errors.length > 50) {
            this.metrics.errors.shift();
        }
    }
    
    getAverageApiTime() {
        if (this.metrics.apiCalls.length === 0) return 0;
        const sum = this.metrics.apiCalls.reduce((acc, call) => acc + call.duration, 0);
        return Math.round(sum / this.metrics.apiCalls.length);
    }
    
    getSuccessRate() {
        if (this.metrics.apiCalls.length === 0) return 100;
        const successful = this.metrics.apiCalls.filter(call => call.success).length;
        return Math.round((successful / this.metrics.apiCalls.length) * 100);
    }
    
    getSummary() {
        return {
            pageLoad: this.metrics.pageLoad,
            avgApiTime: this.getAverageApiTime(),
            successRate: this.getSuccessRate(),
            totalCalls: this.metrics.apiCalls.length,
            totalErrors: this.metrics.errors.length
        };
    }
}

const perfMetrics = new PerformanceMetrics();

// Initialize Phase 3 features
document.addEventListener('DOMContentLoaded', () => {
    // Record page load time
    window.addEventListener('load', () => {
        perfMetrics.recordPageLoad();
        console.log('📊 Page load time:', perfMetrics.metrics.pageLoad + 'ms');
    });
    
    // Initialize realtime updates
    realtime.init().then(() => {
        setupRealtimeUpdates();
    });
    
    // Add performance monitoring to API calls
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const start = performance.now();
        try {
            const response = await originalFetch.apply(this, args);
            const duration = performance.now() - start;
            perfMetrics.recordApiCall(args[0], duration, response.ok);
            return response;
        } catch (error) {
            const duration = performance.now() - start;
            perfMetrics.recordApiCall(args[0], duration, false);
            perfMetrics.recordError(error, 'fetch');
            throw error;
        }
    };
    
    console.log('✅ Phase 3 enhancements loaded');
});

// Export for global access
window.phase3 = {
    realtime,
    analytics,
    auditLog,
    perfMetrics
};

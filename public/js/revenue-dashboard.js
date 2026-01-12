// Revenue Analytics Dashboard Section
async function loadRevenueAnalytics() {
    try {
        const response = await apiFetch('/analytics/revenue');
        const data = await response.json();
        
        document.getElementById('revenue-analytics').innerHTML = `
            <div class="analytics-grid">
                <div class="stat-card">
                    <div class="stat-number">R${(data.totalRevenueGenerated || 0).toLocaleString()}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">R${(data.totalSpent || 0).toLocaleString()}</div>
                    <div class="stat-label">Total Spent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.roi || 0}%</div>
                    <div class="stat-label">ROI</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.profitMargin || 0}%</div>
                    <div class="stat-label">Profit Margin</div>
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('revenue-analytics').innerHTML = '<div class="error">Failed to load revenue analytics</div>';
    }
}

// Campaign Performance Dashboard
async function loadCampaignPerformance() {
    try {
        const response = await apiFetch('/analytics/campaigns');
        const data = await response.json();
        
        if (data.campaigns && data.campaigns.length > 0) {
            const html = data.campaigns.map(campaign => {
                const metrics = campaign.campaign_metrics?.[0] || {};
                const budget = campaign.campaign_budgets?.[0] || {};
                const revenue = campaign.revenue_events?.reduce((sum, event) => sum + parseFloat(event.revenue_amount), 0) || 0;
                
                return `
                    <div class="campaign-performance-card">
                        <div class="campaign-header">
                            <h4>${campaign.title}</h4>
                            <span class="status-badge status-${campaign.status}">${campaign.status}</span>
                        </div>
                        <div class="performance-metrics">
                            <div class="metric">
                                <span class="metric-value">${metrics.messages_sent || 0}</span>
                                <span class="metric-label">Messages Sent</span>
                            </div>
                            <div class="metric">
                                <span class="metric-value">${metrics.engagement_rate || 0}%</span>
                                <span class="metric-label">Engagement</span>
                            </div>
                            <div class="metric">
                                <span class="metric-value">R${revenue.toLocaleString()}</span>
                                <span class="metric-label">Revenue</span>
                            </div>
                            <div class="metric">
                                <span class="metric-value">R${(budget.spent_amount || 0).toLocaleString()}</span>
                                <span class="metric-label">Spent</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn btn-sm" data-action="optimize-campaign" data-id="${campaign.id}">Optimize</button>
                            <button class="btn btn-sm btn-secondary" data-action="view-details" data-id="${campaign.id}">Details</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('campaign-performance-list').innerHTML = html;
        }
    } catch (error) {
        document.getElementById('campaign-performance-list').innerHTML = '<div class="error">Failed to load campaign performance</div>';
    }
}

// MCP Optimization Trigger
async function optimizeCampaign(campaignId) {
    try {
        const response = await fetch('/functions/v1/mcp-optimizer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId })
        });
        
        const data = await response.json();
        
        if (data.optimizations && data.optimizations.length > 0) {
            showOptimizationModal(data);
        } else {
            showSuccess('Campaign is already optimized!');
        }
    } catch (error) {
        showError('Failed to optimize campaign');
    }
}

function showOptimizationModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Campaign Optimization Recommendations</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="optimization-list">
                ${data.optimizations.map(opt => `
                    <div class="optimization-item priority-${opt.priority}">
                        <div class="optimization-header">
                            <span class="priority-badge">${opt.priority.toUpperCase()}</span>
                            <h4>${opt.message}</h4>
                        </div>
                        <p><strong>Action:</strong> ${opt.action}</p>
                        <p><strong>Expected Impact:</strong> ${opt.impact || 'Improved performance'}</p>
                    </div>
                `).join('')}
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
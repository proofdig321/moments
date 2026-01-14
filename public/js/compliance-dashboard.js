// Compliance Dashboard Functions
async function loadComplianceDashboard() {
    try {
        const token = localStorage.getItem('admin.auth.token');
        const response = await fetch('https://bxmdzcxejcxbinghtyfw.supabase.co/rest/v1/compliance_dashboard?order=validated_at.desc&limit=50', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWR6Y3hlamN4YmluZ2h0eWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NTU5NzcsImV4cCI6MjA1MTMzMTk3N30.Hs_Ks3Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks'
            }
        });
        
        const data = await response.json();
        
        // Calculate stats
        const total = data.length;
        const avgScore = total > 0 ? Math.round(data.reduce((sum, item) => sum + (item.compliance_score || 0), 0) / total) : 0;
        const perfect = data.filter(item => item.compliance_score === 100).length;
        const issues = data.filter(item => item.compliance_score < 90).length;
        
        // Update stats
        document.getElementById('compliance-total').textContent = total;
        document.getElementById('compliance-avg').textContent = avgScore;
        document.getElementById('compliance-perfect').textContent = perfect;
        document.getElementById('compliance-issues').textContent = issues;
        
        // Render table
        const listEl = document.getElementById('compliance-list');
        if (data.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No compliance data yet. Create and broadcast a moment to see compliance tracking.</p></div>';
            return;
        }
        
        listEl.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
                        <th style="padding: 0.75rem;">Moment</th>
                        <th style="padding: 0.75rem;">Score</th>
                        <th style="padding: 0.75rem;">Template</th>
                        <th style="padding: 0.75rem;">Sponsor</th>
                        <th style="padding: 0.75rem;">Status</th>
                        <th style="padding: 0.75rem;">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 0.75rem;">
                                <div style="font-weight: 500;">${item.title || 'Untitled'}</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">
                                    ${item.is_sponsored ? '⭐ Sponsored' : '📢 Organic'}
                                </div>
                            </td>
                            <td style="padding: 0.75rem;">
                                <span style="
                                    padding: 0.25rem 0.5rem;
                                    border-radius: 0.25rem;
                                    font-weight: 600;
                                    ${item.compliance_score >= 90 ? 'background: #d1fae5; color: #065f46;' : 
                                      item.compliance_score >= 70 ? 'background: #fef3c7; color: #92400e;' : 
                                      'background: #fee2e2; color: #991b1b;'}
                                ">
                                    ${item.compliance_score || 0}
                                </span>
                            </td>
                            <td style="padding: 0.75rem; font-size: 0.875rem;">
                                ${item.template_category || 'N/A'}
                            </td>
                            <td style="padding: 0.75rem; font-size: 0.875rem;">
                                ${item.sponsor_name || '-'}
                            </td>
                            <td style="padding: 0.75rem;">
                                <div style="font-size: 0.75rem;">
                                    ${item.sponsor_disclosed ? '✅ Disclosed' : '⚠️ Not disclosed'}<br>
                                    ${item.opt_out_included ? '✅ Opt-out' : '❌ No opt-out'}<br>
                                    ${item.pwa_link_included ? '✅ PWA link' : '⚠️ No link'}
                                </div>
                            </td>
                            <td style="padding: 0.75rem; font-size: 0.875rem; color: #6b7280;">
                                ${item.validated_at ? new Date(item.validated_at).toLocaleDateString() : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Compliance load error:', error);
        document.getElementById('compliance-list').innerHTML = '<div class="error">Failed to load compliance data: ' + error.message + '</div>';
    }
}

// Add to section navigation
document.addEventListener('DOMContentLoaded', () => {
    const complianceNav = document.querySelector('[data-section="compliance"]');
    if (complianceNav) {
        complianceNav.addEventListener('click', loadComplianceDashboard);
    }
});

// Admin Users Management Functions

// Load admin users
async function loadAdminUsers() {
    try {
        const response = await fetch('/admin/admin-users');
        const data = await response.json();
        
        const container = document.getElementById('admin-users-list');
        if (!data.users || data.users.length === 0) {
            container.innerHTML = '<div class="empty-state">No admin users found</div>';
            return;
        }
        
        container.innerHTML = data.users.map(user => `
            <div class="moment-item">
                <div class="moment-header">
                    <div class="moment-info">
                        <div class="moment-title">${user.name}</div>
                        <div class="moment-meta">
                            ${user.email} • 
                            ${user.active ? 'Active' : 'Inactive'} • 
                            Created: ${new Date(user.created_at).toLocaleDateString()} •
                            Last login: ${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </div>
                    </div>
                    <div class="moment-actions">
                        <button class="btn btn-sm ${user.active ? 'btn-danger' : 'btn-success'}" 
                                onclick="toggleAdminUser('${user.id}', ${user.active})">
                            ${user.active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading admin users:', error);
        document.getElementById('admin-users-list').innerHTML = 
            '<div class="error">Failed to load admin users</div>';
    }
}

// Show admin user modal
function showAdminUserModal() {
    document.getElementById('admin-user-modal').classList.add('active');
    document.getElementById('admin-user-form').reset();
    document.getElementById('admin-user-message').innerHTML = '';
}

// Hide admin user modal
function hideAdminUserModal() {
    document.getElementById('admin-user-modal').classList.remove('active');
}

// Create admin user
async function createAdminUser(formData) {
    const submitBtn = document.getElementById('admin-user-submit-btn');
    setButtonLoading(submitBtn, true);
    
    try {
        const response = await fetch('/admin/admin-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                name: formData.get('name'),
                password: formData.get('password')
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        showMessage('admin-user-message', 'Admin user created successfully!', 'success');
        setTimeout(() => {
            hideAdminUserModal();
            loadAdminUsers();
        }, 1500);
        
    } catch (error) {
        showMessage('admin-user-message', error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// Toggle admin user active status
async function toggleAdminUser(userId, currentStatus) {
    try {
        const response = await fetch(`/admin/admin-users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !currentStatus })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        loadAdminUsers();
        
    } catch (error) {
        console.error('Error toggling admin user:', error);
        alert('Failed to update admin user status');
    }
}

// Event listeners for admin users
document.addEventListener('DOMContentLoaded', function() {
    // New admin user button
    document.addEventListener('click', function(e) {
        if (e.target.dataset.action === 'new-admin-user') {
            showAdminUserModal();
        }
        
        if (e.target.dataset.action === 'close-admin-user-modal' || 
            e.target.dataset.action === 'cancel-admin-user') {
            hideAdminUserModal();
        }
    });
    
    // Admin user form submission
    document.getElementById('admin-user-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        createAdminUser(formData);
    });
    
    // Load admin users when section is shown
    document.addEventListener('click', function(e) {
        if (e.target.dataset.section === 'users') {
            loadAdminUsers();
        }
    });
});
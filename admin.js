// Admin Dashboard JavaScript

let submissions = [];
let filteredSubmissions = [];
let currentFilter = 'all';

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSubmissions();
    setupFilterButtons();
});

async function loadSubmissions() {
    try {
        const response = await fetch('/api/admin/submissions');
        const data = await response.json();

        submissions = data.submissions || [];
        filteredSubmissions = submissions;

        updateStats(data.stats);
        renderSubmissions();
    } catch (error) {
        console.error('Error loading submissions:', error);
        document.getElementById('submissions-list').innerHTML = `
            <div class="loading" style="color: #dc3545;">
                <p>Error loading submissions. Please refresh the page.</p>
                <p style="font-size: 0.9rem; color: #86868b;">${error.message}</p>
            </div>
        `;
    }
}

function updateStats(stats) {
    document.getElementById('total-submissions').textContent = stats?.total || submissions.length;
    document.getElementById('total-devices').textContent = stats?.totalDevices || 0;

    // Our Devices - Always show 100% for now (automation criteria will be added later)
    const totalDevices = stats?.totalDevices || 0;
    document.getElementById('our-devices-percentage').textContent = `${totalDevices}/${totalDevices} (100%)`;

    document.getElementById('pending-count').textContent = stats?.pending || 0;
    document.getElementById('approved-count').textContent = stats?.approved || 0;
    document.getElementById('denied-count').textContent = stats?.denied || 0;
}

function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilter();
        });
    });
}

function applyFilter() {
    if (currentFilter === 'all') {
        filteredSubmissions = submissions;
    } else {
        filteredSubmissions = submissions.filter(sub =>
            sub.overall_status?.toLowerCase() === currentFilter.toLowerCase()
        );
    }
    renderSubmissions();
}

function formatPacificTime(timestamp) {
    if (!timestamp) return 'N/A';

    // If timestamp doesn't have timezone indicator, add 'Z' to treat as UTC
    // Supabase returns timestamps like "2025-11-12T21:46:27.332653" which are UTC but without 'Z'
    let utcTimestamp = timestamp;
    if (timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) && !timestamp.endsWith('Z')) {
        utcTimestamp = timestamp.replace(/(\.\d+)?$/, 'Z');
    }

    const date = new Date(utcTimestamp);

    // Format for Pacific Time (America/Los_Angeles - Irvine, CA)
    const options = {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    // Extract parts
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const dayPeriod = parts.find(p => p.type === 'dayPeriod').value;

    // Format: MM/DD/YYYY HH:MM AM/PM
    return `${month}/${day}/${year} ${hour}:${minute} ${dayPeriod}`;
}

function renderSubmissions() {
    const listEl = document.getElementById('submissions-list');

    if (filteredSubmissions.length === 0) {
        listEl.innerHTML = `
            <div class="loading" style="color: #86868b;">
                <p>No submissions found</p>
            </div>
        `;
        return;
    }

    // Add header row
    let html = `
        <div class="submission-item-header">
            <div>STATUS</div>
            <div>SUBMITTED ON</div>
            <div>COMPANY NAME</div>
            <div>CUSTOMER EMAIL</div>
            <div>SALES ORDER NUMBER</div>
            <div>QTY TO RETURN</div>
            <div></div>
        </div>
    `;

    // Add data rows
    html += filteredSubmissions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(sub => {
            const status = sub.overall_status?.toLowerCase() || 'pending';
            return `
            <div class="submission-item" onclick="viewSubmission('${sub.reference_number}')">
                <div onclick="event.stopPropagation();">
                    <div class="status-dropdown-wrapper">
                        <button class="status-badge status-${status}" onclick="toggleStatusDropdown('${sub.reference_number}', event)">
                            ${status.toUpperCase()}
                        </button>
                        <div class="status-dropdown" id="status-dropdown-${sub.reference_number}">
                            <div class="status-dropdown-item" onclick="changeStatus('${sub.reference_number}', 'pending', event)">Pending</div>
                            <div class="status-dropdown-item" onclick="changeStatus('${sub.reference_number}', 'approved', event)">Approved</div>
                            <div class="status-dropdown-item" onclick="changeStatus('${sub.reference_number}', 'denied', event)">Denied</div>
                        </div>
                    </div>
                </div>
                <div style="font-size: 0.85rem; color: #86868b;">
                    ${formatPacificTime(sub.submission_date || sub.created_at)}
                </div>
                <div style="font-weight: 500;">
                    ${sub.company_name}
                </div>
                <div style="color: #1d1d1f;">
                    ${sub.company_email}
                </div>
                <div style="font-weight: 500;">
                    ${sub.order_number || 'N/A'}
                </div>
                <div style="font-weight: 600; text-align: center;">
                    ${sub.total_devices || 0}
                </div>
                <button class="view-btn" onclick="viewSubmission('${sub.reference_number}'); event.stopPropagation();">
                    View
                </button>
            </div>
        `;
        }).join('');

    listEl.innerHTML = html;
}

async function viewSubmission(referenceNumber) {
    try {
        const response = await fetch(`/api/admin/submission/${referenceNumber}`);
        const data = await response.json();

        showModal(data);
    } catch (error) {
        console.error('Error loading submission details:', error);
        alert('Error loading submission details');
    }
}

function showModal(data) {
    const modal = document.getElementById('detail-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');

    // Format: Company Name - RMA Number
    modalTitle.textContent = `${data.submission.company_name} - ${data.submission.reference_number}`;

    // Calculate Returns vs Repairs statistics
    const devices = data.devices || [];
    const totalDevices = devices.length;
    const returnDevices = devices.filter(d =>
        d.requested_action && d.requested_action.toLowerCase().includes('return')
    ).length;
    const repairDevices = devices.filter(d =>
        d.requested_action && d.requested_action.toLowerCase().includes('repair')
    ).length;

    const returnPercentage = totalDevices > 0 ? ((returnDevices / totalDevices) * 100).toFixed(1) : 0;
    const repairPercentage = totalDevices > 0 ? ((repairDevices / totalDevices) * 100).toFixed(1) : 0;

    modalBody.innerHTML = `
        <div class="detail-section">
            <h3>Submission Information</h3>
            <div class="detail-grid-two-column">
                <div class="detail-row">
                    <div class="detail-col">
                        <span class="detail-label">Company Name:</span>
                        <span class="detail-value">${data.submission.company_name}</span>
                    </div>
                    <div class="detail-col">
                        <span class="detail-label">Customer Type:</span>
                        <span class="detail-value">${data.submission.customer_type?.toUpperCase() || 'N/A'}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-col">
                        <span class="detail-label">Company Email:</span>
                        <span class="detail-value">${data.submission.company_email}</span>
                    </div>
                    <div class="detail-col">
                        <span class="detail-label">Submitted:</span>
                        <span class="detail-value">${formatDate(data.submission.created_at)}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-col">
                        <span class="detail-label">Sales Order Number:</span>
                        <span class="detail-value">${data.submission.order_number || 'N/A'}</span>
                    </div>
                    <div class="detail-col">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="submission-status status-${data.submission.overall_status?.toLowerCase() || 'pending'}">
                                ${data.submission.overall_status || 'SUBMITTED'}
                            </span>
                        </span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-col">
                        <span class="detail-label">Reference Number:</span>
                        <span class="detail-value">${data.submission.reference_number}</span>
                    </div>
                    <div class="detail-col">
                        <span class="detail-label">Total Devices:</span>
                        <span class="detail-value">${data.submission.total_devices || 0}</span>
                    </div>
                </div>
            </div>
        </div>

        ${totalDevices > 0 ? `
        <div class="detail-section">
            <h3>Request Breakdown</h3>
            <div class="stats-cards">
                <div class="stat-card-inline stat-card-return">
                    <div class="stat-card-header">
                        <div class="stat-card-icon">↩</div>
                        <div class="stat-card-title">Returns Requested</div>
                    </div>
                    <div class="stat-card-body">
                        <div class="stat-card-number">${returnDevices}/${totalDevices}</div>
                        <div class="stat-card-percentage">${returnPercentage}%</div>
                    </div>
                </div>
                <div class="stat-card-inline stat-card-repair">
                    <div class="stat-card-header">
                        <div class="stat-card-icon">🔧</div>
                        <div class="stat-card-title">Repairs Requested</div>
                    </div>
                    <div class="stat-card-body">
                        <div class="stat-card-number">${repairDevices}/${totalDevices}</div>
                        <div class="stat-card-percentage">${repairPercentage}%</div>
                    </div>
                </div>
                <div class="stat-card-inline stat-card-verified">
                    <div class="stat-card-header">
                        <div class="stat-card-icon">✓</div>
                        <div class="stat-card-title">Our Devices</div>
                    </div>
                    <div class="stat-card-body">
                        <div class="stat-card-number">${totalDevices}/${totalDevices}</div>
                        <div class="stat-card-percentage">100%</div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        ${data.devices && data.devices.length > 0 ? `
        <div class="detail-section">
            <h3>Devices (${data.devices.length})</h3>
            <table class="devices-table">
                <thead>
                    <tr>
                        <th>IMEI</th>
                        <th>Model</th>
                        <th>Storage</th>
                        <th>Grade</th>
                        <th>Issue</th>
                        <th>Issue Category</th>
                        <th>Repair/Return</th>
                        <th>Unit Price</th>
                        <th>Repair Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.devices.map((device, idx) => `
                        <tr>
                            <td><span class="imei-badge">${device.imei || 'N/A'}</span></td>
                            <td>${device.model || ''}</td>
                            <td>${device.storage || ''}</td>
                            <td>${device.condition || ''}</td>
                            <td>${device.issue_description || ''}</td>
                            <td>${device.issue_category || ''}</td>
                            <td>${device.requested_action || ''}</td>
                            <td>${device.unit_price ? '$' + device.unit_price : ''}</td>
                            <td>${device.repair_cost ? '$' + device.repair_cost : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${data.files && data.files.length > 0 ? `
        <div class="detail-section">
            <h3>Uploaded Files</h3>
            <div class="files-list">
                ${data.files.map(file => `
                    <div class="file-item">
                        <div class="file-info">
                            <div class="file-icon">${getFileExtension(file.original_filename)}</div>
                            <div>
                                <div style="font-weight: 500;">${file.original_filename}</div>
                                <div style="color: #86868b; font-size: 0.9rem;">
                                    ${formatFileSize(file.file_size_bytes)} •
                                    ${file.devices_extracted || 0} devices extracted
                                </div>
                            </div>
                        </div>
                        <a href="/api/admin/download/${data.submission.reference_number}/${file.id}"
                           class="download-btn"
                           download="${file.original_filename}">
                            Download
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

// Close modal when clicking outside
document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') {
        closeModal();
    }
});

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileExtension(filename) {
    if (!filename) return 'FILE';
    const ext = filename.split('.').pop().toUpperCase();
    return ext.length <= 4 ? ext : 'FILE';
}

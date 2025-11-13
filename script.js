// SCal Mobile RMA Portal - Interactive JavaScript

// State Management
const appState = {
    customerType: null,
    uploadedFiles: [],
    formData: {}
};

// Guidelines Content
const guidelinesContent = {
    us: `
        <h3>US Customers: Returns Process</h3>
        <p>Complete guide for returning devices within the United States</p>

        <div class="process-timeline">
            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">01</span>
                    </div>
                    <h3 class="step-title">45-Day RMA Submission Window</h3>
                </div>
                <div class="step-content">
                    <p>RMA requests must be submitted within 45 days of the invoice date. Please include the IMEI and an accurate condition description for each device to ensure timely and precise evaluation.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">02</span>
                    </div>
                    <h3 class="step-title">2-Business-Day Review</h3>
                </div>
                <div class="step-content">
                    <p>Our team will review your submission within 2 business days. Requests that include complete and accurate information will receive priority handling. Incomplete submissions may require additional details before approval.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">03</span>
                    </div>
                    <h3 class="step-title">RMA Authorization Required</h3>
                </div>
                <div class="step-content">
                    <p>Please wait for formal RMA approval before shipping any products. Only devices explicitly approved under the issued RMA number may be returned. Unauthorized or non-approved devices may be rejected, ineligible for credit, and subject to additional shipping fees.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">04</span>
                    </div>
                    <h3 class="step-title">Follow Shipping Instructions & Pack With Care</h3>
                </div>
                <div class="step-content">
                    <p>Pack all approved returns with the same level of care in which they were received. Devices should be placed in a poly or bubble bag and securely wrapped or organized in a partition-style box to prevent movement or damage in transit. Please follow all provided shipping instructions to ensure safe and accurate processing.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">05</span>
                    </div>
                    <h3 class="step-title">Credit Issued Weekly on Sundays</h3>
                </div>
                <div class="step-content">
                    <p>Credits are processed on the Sunday following receipt and validation of approved devices. You will receive an email confirmation as soon as the credit has been applied to your account.</p>
                </div>
            </div>
        </div>

        <div class="alert-box" style="margin-top: 2rem;">
            <strong>Shipping Address:</strong><br>
            Once your RMA is approved, please ship the devices to:<br>
            <strong>8583 Irvine Center Dr., #214<br>Irvine, CA 92618</strong><br>
            Devices must be shipped within 10 days of RMA approval.
        </div>

        <h4 style="margin-top: 2rem;">Questions or Concerns?</h4>
        <p>If you have any questions or concerns, please contact our RMA team at <a href="mailto:rma@scalmob.com">rma@scalmob.com</a></p>
    `,
    international: `
        <h3>International Customers: Returns Process</h3>
        <p>Complete guide for returning devices from outside the United States</p>

        <div class="process-timeline">
            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">01</span>
                    </div>
                    <h3 class="step-title">45-Day RMA Submission Window</h3>
                </div>
                <div class="step-content">
                    <p>RMA requests must be submitted within 45 days of the invoice date. Please include the IMEI and an accurate condition description for each device to ensure timely and precise evaluation.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">02</span>
                    </div>
                    <h3 class="step-title">2-Business-Day Review</h3>
                </div>
                <div class="step-content">
                    <p>Our team will review your submission within 2 business days. Requests that include complete and accurate information will receive priority handling. Incomplete submissions may require additional details before approval.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">03</span>
                    </div>
                    <h3 class="step-title">RMA Authorization Required</h3>
                </div>
                <div class="step-content">
                    <p>Please wait for formal RMA approval before shipping any products. Only devices explicitly approved under the issued RMA number may be returned. Unauthorized or non-approved devices may be rejected, ineligible for credit, and subject to additional shipping fees.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">04</span>
                    </div>
                    <h3 class="step-title">Follow Shipping Instructions & Pack With Care</h3>
                </div>
                <div class="step-content">
                    <p>Pack all approved returns with the same level of care in which they were received. Devices should be placed in a poly or bubble bag and securely wrapped or organized in a partition-style box to prevent movement or damage in transit. Please follow all provided shipping instructions to ensure safe and accurate processing.</p>
                </div>
                <div class="step-connector"></div>
            </div>

            <div class="process-step">
                <div class="step-header">
                    <div class="step-circle">
                        <span class="step-number">05</span>
                    </div>
                    <h3 class="step-title">Credit Issued Weekly on Sundays</h3>
                </div>
                <div class="step-content">
                    <p>Credits are processed on the Sunday following receipt and validation of approved devices. You will receive an email confirmation as soon as the credit has been applied to your account.</p>
                </div>
            </div>
        </div>

        <div class="alert-box" style="margin-top: 2rem; background-color: #e0f2fe;">
            <strong>Prepaid Shipping Labels</strong><br>
            Once your RMA is approved, you will receive a prepaid shipping label and instructions for international return shipment. Devices must be shipped within 10 days of RMA approval using the provided label.
        </div>

        <h4 style="margin-top: 2rem;">Questions or Concerns?</h4>
        <p>If you have any questions or concerns, please contact our RMA team at <a href="mailto:rma@scalmob.com">rma@scalmob.com</a></p>
    `
};

// DOM Elements
const landingPage = document.getElementById('landing-page');
const mainPortal = document.getElementById('main-portal');
const continueBtn = document.getElementById('continue-btn');

const customerTypeSection = document.getElementById('customer-type-section');
const guidelinesSection = document.getElementById('guidelines-section');
const formSection = document.getElementById('form-section');
const successSection = document.getElementById('success-section');

const selectTypeBtns = document.querySelectorAll('.select-type-btn');
const backToSelection = document.getElementById('back-to-selection');
const proceedToForm = document.getElementById('proceed-to-form');
const backToGuidelines = document.getElementById('back-to-guidelines');

const guidelinesContentDiv = document.getElementById('guidelines-content');
const customerTypeInput = document.getElementById('customer-type');

const rmaForm = document.getElementById('rma-form');
const fileInput = document.getElementById('file-input');
const fileUploadArea = document.getElementById('file-upload-area');
const browseBtn = document.getElementById('browse-btn');
const fileList = document.getElementById('file-list');
const submitBtn = document.getElementById('submit-btn');
const submitText = submitBtn.querySelector('.submit-text');
const submitLoader = submitBtn.querySelector('.submit-loader');

const newRequestBtn = document.getElementById('new-request-btn');
const referenceNumber = document.getElementById('reference-number');

// Event Listeners
continueBtn.addEventListener('click', () => {
    landingPage.classList.remove('active');
    mainPortal.classList.add('active');
});

selectTypeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        selectCustomerType(type);
    });
});

backToSelection.addEventListener('click', () => {
    guidelinesSection.classList.add('hidden');
    customerTypeSection.classList.remove('hidden');
    appState.customerType = null;
});

proceedToForm.addEventListener('click', () => {
    guidelinesSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

backToGuidelines.addEventListener('click', () => {
    formSection.classList.add('hidden');
    guidelinesSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

newRequestBtn.addEventListener('click', () => {
    resetForm();
    successSection.classList.add('hidden');
    customerTypeSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// File Upload Functionality
browseBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

fileUploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Drag and Drop
fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.add('drag-over');
});

fileUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });

        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Form Submission
rmaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('Form submitted. Uploaded files count:', appState.uploadedFiles.length);
    console.log('Uploaded files:', appState.uploadedFiles);

    if (appState.uploadedFiles.length === 0) {
        alert('Please upload at least one file to proceed with your RMA request.');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoader.classList.remove('hidden');

    // Collect form data
    const formData = new FormData(rmaForm);

    // Add files to form data
    appState.uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
    });

    try {
        // Submit to server
        const response = await fetch('/api/submit-rma', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            showSuccess(result.referenceNumber);
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        console.error('Error submitting RMA:', error);
        alert('There was an error submitting your RMA request. Please try again or contact rma@scalmob.com for assistance.');

        // Re-enable submit button
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoader.classList.add('hidden');
    }
});

// Functions
function selectCustomerType(type) {
    appState.customerType = type;
    customerTypeInput.value = type;
    guidelinesContentDiv.innerHTML = guidelinesContent[type];
    customerTypeSection.classList.add('hidden');
    guidelinesSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleFiles(files) {
    const maxSize = 10 * 1024 * 1024; // 10MB

    console.log('handleFiles called with', files.length, 'files');

    Array.from(files).forEach(file => {
        // Check file size
        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large. Maximum file size is 10MB.`);
            return;
        }

        // Check if file already added
        const isDuplicate = appState.uploadedFiles.some(f =>
            f.name === file.name && f.size === file.size
        );

        if (isDuplicate) {
            alert(`File "${file.name}" has already been added.`);
            return;
        }

        // Add file to state
        console.log('Adding file to state:', file.name);
        appState.uploadedFiles.push(file);
        console.log('Current uploaded files count:', appState.uploadedFiles.length);
        renderFileList();
    });

    // Reset file input
    fileInput.value = '';
}

function renderFileList() {
    fileList.innerHTML = '';

    appState.uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';

        const fileIcon = document.createElement('svg');
        fileIcon.className = 'file-icon';
        fileIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';

        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;

        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);

        fileInfo.appendChild(fileIcon);
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-file-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeFile(index));

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);

        fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    appState.uploadedFiles.splice(index, 1);
    renderFileList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showSuccess(refNumber) {
    formSection.classList.add('hidden');
    successSection.classList.remove('hidden');
    referenceNumber.textContent = refNumber;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    rmaForm.reset();
    appState.uploadedFiles = [];
    appState.customerType = null;
    renderFileList();
    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    submitLoader.classList.add('hidden');
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form validation
const inputs = document.querySelectorAll('.form-input');
inputs.forEach(input => {
    input.addEventListener('invalid', (e) => {
        e.preventDefault();
        input.classList.add('error');
    });

    input.addEventListener('input', () => {
        input.classList.remove('error');
    });
});

// Initialize
console.log('SCal Mobile RMA Portal initialized');

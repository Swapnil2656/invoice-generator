document.addEventListener('DOMContentLoaded', function() {
    // Initialize invoice
    initInvoice();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load theme from localStorage
    loadTheme();
});

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const modeText = document.getElementById('mode-text');
const invoiceNumber = document.getElementById('invoice-number');
const invoiceDate = document.getElementById('invoice-date');
const currencySelect = document.getElementById('currency');
const addItemButton = document.getElementById('add-item');
const itemsTable = document.getElementById('invoice-items-table');
const itemsBody = document.getElementById('invoice-items-body');
const taxRateInput = document.getElementById('tax-rate');
const subtotalSpan = document.getElementById('subtotal');
const taxAmountSpan = document.getElementById('tax-amount');
const totalAmountSpan = document.getElementById('total-amount');
const logoUpload = document.getElementById('logo-upload');
const logoPreview = document.getElementById('logo-preview');
const saveInvoiceBtn = document.getElementById('save-invoice');
const loadInvoiceBtn = document.getElementById('load-invoice');
const newInvoiceBtn = document.getElementById('new-invoice');
const savedInvoiceList = document.getElementById('saved-invoice-list');
const exportPdfBtn = document.getElementById('export-pdf');

// Initialize invoice with default values
function initInvoice() {
    // Generate a unique invoice number
    generateInvoiceNumber();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    invoiceDate.value = today;
    
    // Set default currency
    currencySelect.value = '₹';
    
    // Add first empty row
    addNewRow();
    
    // Load saved invoices list
    loadSavedInvoicesList();
}

// Setup all event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('change', toggleTheme);
    
    // Add item
    addItemButton.addEventListener('click', addNewRow);
    
    // Calculate on input changes
    itemsBody.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity') || 
            e.target.classList.contains('rate')) {
            calculateItemAmount(e.target.closest('tr'));
            updateTotals();
        }
    });
    
    // Remove item
    itemsBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item')) {
            e.target.closest('tr').remove();
            updateTotals();
        }
    });
    
    // Currency change
    currencySelect.addEventListener('change', updateTotals);
    
    // Tax rate change
    taxRateInput.addEventListener('input', updateTotals);
    
    // Logo upload
    logoUpload.addEventListener('change', handleLogoUpload);
    
    // Save invoice
    saveInvoiceBtn.addEventListener('click', saveInvoice);
    
    // Load invoice
    loadInvoiceBtn.addEventListener('click', loadSelectedInvoice);
    
    // New invoice
    newInvoiceBtn.addEventListener('click', createNewInvoice);
    
    // Export PDF
    exportPdfBtn.addEventListener('click', exportToPdf);
}

// Generate unique invoice number
function generateInvoiceNumber() {
    const prefix = 'INV';
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    invoiceNumber.value = `${prefix}-${timestamp}-${random}`;
}

// Theme functions
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode');
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    modeText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
}

function loadTheme() {
    const darkModePreference = localStorage.getItem('darkMode');
    
    if (darkModePreference === 'true') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
        modeText.textContent = 'Light Mode';
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        themeToggle.checked = false;
        modeText.textContent = 'Dark Mode';
    }
}

// Invoice Items functions
function addNewRow() {
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>
            <input type="text" class="description" placeholder="Item description">
        </td>
        <td>
            <input type="number" class="quantity" min="1" value="1">
        </td>
        <td>
            <input type="number" class="rate" min="0" step="0.01" value="0.00">
        </td>
        <td>
            <span class="amount">0.00</span>
        </td>
        <td>
            <button class="remove-item">×</button>
        </td>
    `;
    
    itemsBody.appendChild(newRow);
}

function calculateItemAmount(row) {
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const rate = parseFloat(row.querySelector('.rate').value) || 0;
    const amount = quantity * rate;
    
    row.querySelector('.amount').textContent = amount.toFixed(2);
}

// Total calculations
function updateTotals() {
    const currency = currencySelect.value;
    const amounts = Array.from(document.querySelectorAll('.amount'))
        .map(el => parseFloat(el.textContent) || 0);
    
    const subtotal = amounts.reduce((sum, amount) => sum + amount, 0);
    const taxRate = parseFloat(taxRateInput.value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    subtotalSpan.textContent = `${currency} ${subtotal.toFixed(2)}`;
    taxAmountSpan.textContent = `${currency} ${taxAmount.toFixed(2)}`;
    totalAmountSpan.textContent = `${currency} ${total.toFixed(2)}`;
}

// Logo upload handling
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        logoPreview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 100%;">`;
    };
    reader.readAsDataURL(file);
}

// Save and load invoices
function saveInvoice() {
    const invoiceName = prompt('Enter a name for this invoice:');
    if (!invoiceName) return;
    
    const invoiceData = {
        id: Date.now().toString(),
        name: invoiceName,
        number: invoiceNumber.value,
        date: invoiceDate.value,
        currency: currencySelect.value,
        businessName: document.getElementById('business-name').value,
        businessAddress: document.getElementById('business-address').value,
        clientName: document.getElementById('client-name').value,
        clientAddress: document.getElementById('client-address').value,
        clientEmail: document.getElementById('client-email').value,
        taxRate: taxRateInput.value,
        notes: document.getElementById('notes').value,
        items: getItemsData(),
        logo: logoPreview.innerHTML
    };
    
    // Get existing invoices or initialize empty array
    const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    
    // Add new invoice
    savedInvoices.push(invoiceData);
    
    // Save back to localStorage
    localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));
    
    // Refresh dropdown
    loadSavedInvoicesList();
    
    alert('Invoice saved successfully!');
}

function getItemsData() {
    return Array.from(itemsBody.querySelectorAll('tr')).map(row => {
        return {
            description: row.querySelector('.description').value,
            quantity: row.querySelector('.quantity').value,
            rate: row.querySelector('.rate').value,
            amount: row.querySelector('.amount').textContent
        };
    });
}

function loadSavedInvoicesList() {
    // Clear existing options except the first one
    while (savedInvoiceList.options.length > 1) {
        savedInvoiceList.remove(1);
    }
    
    // Get saved invoices
    const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    
    // Add each invoice to the dropdown
    savedInvoices.forEach(invoice => {
        const option = document.createElement('option');
        option.value = invoice.id;
        option.textContent = `${invoice.name} (${invoice.number})`;
        savedInvoiceList.appendChild(option);
    });
}

function loadSelectedInvoice() {
    const selectedId = savedInvoiceList.value;
    if (!selectedId) {
        alert('Please select an invoice to load');
        return;
    }
    
    // Get saved invoices
    const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    
    // Find selected invoice
    const invoice = savedInvoices.find(inv => inv.id === selectedId);
    if (!invoice) {
        alert('Invoice not found');
        return;
    }
    
    // Populate form fields
    invoiceNumber.value = invoice.number;
    invoiceDate.value = invoice.date;
    currencySelect.value = invoice.currency;
    document.getElementById('business-name').value = invoice.businessName;
    document.getElementById('business-address').value = invoice.businessAddress;
    document.getElementById('client-name').value = invoice.clientName;
    document.getElementById('client-address').value = invoice.clientAddress;
    document.getElementById('client-email').value = invoice.clientEmail;
    taxRateInput.value = invoice.taxRate;
    document.getElementById('notes').value = invoice.notes;
    
    // Load logo if exists
    if (invoice.logo) {
        logoPreview.innerHTML = invoice.logo;
    }
    
    // Clear existing items
    itemsBody.innerHTML = '';
    
    // Add saved items
    invoice.items.forEach(item => {
        const newRow = document.createElement('tr');
        
        newRow.innerHTML = `
            <td>
                <input type="text" class="description" value="${item.description}">
            </td>
            <td>
                <input type="number" class="quantity" min="1" value="${item.quantity}">
            </td>
            <td>
                <input type="number" class="rate" min="0" step="0.01" value="${item.rate}">
            </td>
            <td>
                <span class="amount">${item.amount}</span>
            </td>
            <td>
                <button class="remove-item">×</button>
            </td>
        `;
        
        itemsBody.appendChild(newRow);
    });
    
    // Update totals
    updateTotals();
    
    alert('Invoice loaded successfully!');
}

function createNewInvoice() {
    if (confirm('Start a new invoice? All unsaved changes will be lost.')) {
        // Clear all fields
        document.getElementById('business-name').value = '';
        document.getElementById('business-address').value = '';
        document.getElementById('client-name').value = '';
        document.getElementById('client-address').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('notes').value = '';
        taxRateInput.value = '0';
        
        // Reset logo
        logoPreview.innerHTML = '<i class="fas fa-building default-logo"></i>';
        
        // Clear items
        itemsBody.innerHTML = '';
        
        // Init new invoice
        generateInvoiceNumber();
        const today = new Date().toISOString().split('T')[0];
        invoiceDate.value = today;
        addNewRow();
        
        // Update totals
        updateTotals();
    }
}

// Export to PDF
function exportToPdf() {
    // Import jsPDF from CDN
    const { jsPDF } = window.jspdf;
    
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Get the invoice element
    const invoiceElement = document.getElementById('invoice');
    
    // Show a message to the user
    const originalExportBtnText = exportPdfBtn.textContent;
    exportPdfBtn.textContent = 'Generating PDF...';
    exportPdfBtn.disabled = true;
    
    // Use html2canvas to capture the invoice
    html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Convert the canvas to an image
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Calculate the PDF dimensions based on the canvas
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Add the image to the PDF
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        // Get file name from invoice number
        const fileName = `${invoiceNumber.value}.pdf`;
        
        // Save the PDF
        doc.save(fileName);
        
        // Reset the button text
        exportPdfBtn.textContent = originalExportBtnText;
        exportPdfBtn.disabled = false;
    });
}

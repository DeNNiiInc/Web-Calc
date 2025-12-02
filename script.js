// ============================================
// State Management
// ============================================
let items = [];
let marginPercentage = 10;

// ============================================
// DOM Elements
// ============================================
const itemForm = document.getElementById("itemForm");
const itemUrlInput = document.getElementById("itemUrl");
const itemNameInput = document.getElementById("itemName");
const itemPriceInput = document.getElementById("itemPrice");
const marginSlider = document.getElementById("marginSlider");
const marginValue = document.getElementById("marginValue");
const itemsList = document.getElementById("itemsList");
const baseTotal = document.getElementById("baseTotal");
const marginAmount = document.getElementById("marginAmount");
const finalTotal = document.getElementById("finalTotal");
const itemCount = document.getElementById("itemCount");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

// ============================================
// Initialization
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  renderItems();
  updateSummary();
  attachEventListeners();
});

// ============================================
// Event Listeners
// ============================================
function attachEventListeners() {
  // Form submission
  itemForm.addEventListener("submit", handleAddItem);

  // Margin slider
  marginSlider.addEventListener("input", handleMarginChange);

  // Export buttons
  exportCsvBtn.addEventListener("click", exportToCSV);
  exportJsonBtn.addEventListener("click", exportToJSON);

  // Clear all button
  clearAllBtn.addEventListener("click", handleClearAll);
}

// ============================================
// Item Management
// ============================================
function handleAddItem(e) {
  e.preventDefault();

  const url = itemUrlInput.value.trim();
  const name = itemNameInput.value.trim();
  const price = parseFloat(itemPriceInput.value);

  if (!name || isNaN(price) || price < 0) {
    alert("Please enter a valid product name and price.");
    return;
  }

  const newItem = {
    id: Date.now(),
    url: url || "",
    name: name,
    price: price,
  };

  items.push(newItem);
  saveToLocalStorage();
  renderItems();
  updateSummary();

  // Reset form
  itemForm.reset();
  itemNameInput.focus();

  // Add success feedback
  showNotification("Item added successfully!");
}

function handleEditItem(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;

  const newName = prompt("Enter new product name:", item.name);
  if (newName === null) return;

  const newPrice = prompt("Enter new price:", item.price);
  if (newPrice === null) return;

  const parsedPrice = parseFloat(newPrice);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    alert("Invalid price entered.");
    return;
  }

  item.name = newName.trim() || item.name;
  item.price = parsedPrice;

  saveToLocalStorage();
  renderItems();
  updateSummary();
  showNotification("Item updated successfully!");
}

function handleDeleteItem(id) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  items = items.filter((item) => item.id !== id);
  saveToLocalStorage();
  renderItems();
  updateSummary();
  showNotification("Item deleted successfully!");
}

function handleClearAll() {
  if (items.length === 0) {
    alert("No items to clear.");
    return;
  }

  if (!confirm(`Are you sure you want to delete all ${items.length} items?`))
    return;

  items = [];
  saveToLocalStorage();
  renderItems();
  updateSummary();
  showNotification("All items cleared!");
}

// ============================================
// Margin Management
// ============================================
function handleMarginChange(e) {
  marginPercentage = parseInt(e.target.value);
  marginValue.textContent = `${marginPercentage}%`;
  updateSummary();
}

// ============================================
// Rendering
// ============================================
function renderItems() {
  if (items.length === 0) {
    itemsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p class="empty-text">No items added yet</p>
                <p class="empty-subtext">Add your first item using the form above</p>
            </div>
        `;
    return;
  }

  itemsList.innerHTML = items
    .map(
      (item) => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <h3 class="item-name">${escapeHtml(item.name)}</h3>
                    ${
                      item.url
                        ? `<a href="${escapeHtml(
                            item.url
                          )}" target="_blank" rel="noopener noreferrer" class="item-url">🔗 View Product</a>`
                        : ""
                    }
                </div>
            </div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="handleEditItem(${
                  item.id
                })">
                    <span class="btn-icon">✏️</span>
                    Edit
                </button>
                <button class="btn btn-danger btn-small" onclick="handleDeleteItem(${
                  item.id
                })">
                    <span class="btn-icon">🗑️</span>
                    Delete
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

function updateSummary() {
  const base = calculateBaseTotal();
  const margin = calculateMarginAmount(base);
  const final = base + margin;

  baseTotal.textContent = `$${base.toFixed(2)}`;
  marginAmount.textContent = `$${margin.toFixed(2)}`;
  finalTotal.textContent = `$${final.toFixed(2)}`;
  itemCount.textContent = items.length;
}

// ============================================
// Calculations
// ============================================
function calculateBaseTotal() {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function calculateMarginAmount(baseTotal) {
  return baseTotal * (marginPercentage / 100);
}

// ============================================
// Local Storage
// ============================================
function saveToLocalStorage() {
  try {
    localStorage.setItem("pricingCalcItems", JSON.stringify(items));
    localStorage.setItem("pricingCalcMargin", marginPercentage.toString());
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

function loadFromLocalStorage() {
  try {
    const savedItems = localStorage.getItem("pricingCalcItems");
    const savedMargin = localStorage.getItem("pricingCalcMargin");

    if (savedItems) {
      items = JSON.parse(savedItems);
    }

    if (savedMargin) {
      marginPercentage = parseInt(savedMargin);
      marginSlider.value = marginPercentage;
      marginValue.textContent = `${marginPercentage}%`;
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    items = [];
    marginPercentage = 10;
  }
}

// ============================================
// Export Functions
// ============================================
function exportToCSV() {
  if (items.length === 0) {
    alert("No items to export.");
    return;
  }

  const base = calculateBaseTotal();
  const margin = calculateMarginAmount(base);
  const final = base + margin;

  let csv = "Product Name,URL,Price\n";
  items.forEach((item) => {
    csv += `"${item.name}","${item.url}",${item.price}\n`;
  });

  csv += "\n";
  csv += `Base Total,,${base.toFixed(2)}\n`;
  csv += `Margin (${marginPercentage}%),,${margin.toFixed(2)}\n`;
  csv += `Final Total,,${final.toFixed(2)}\n`;

  downloadFile(csv, "pricing-calculator.csv", "text/csv");
  showNotification("Exported to CSV successfully!");
}

function exportToJSON() {
  if (items.length === 0) {
    alert("No items to export.");
    return;
  }

  const base = calculateBaseTotal();
  const margin = calculateMarginAmount(base);
  const final = base + margin;

  const data = {
    items: items,
    summary: {
      baseTotal: base,
      marginPercentage: marginPercentage,
      marginAmount: margin,
      finalTotal: final,
      itemCount: items.length,
    },
    exportDate: new Date().toISOString(),
  };

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, "pricing-calculator.json", "application/json");
  showNotification("Exported to JSON successfully!");
}

// ============================================
// Utility Functions
// ============================================
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message) {
  // Simple notification - could be enhanced with a toast library
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        font-family: var(--font-family);
        font-weight: 600;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// State Management
// ============================================
let items = [];
let marginPercentage = 10;
let openaiApiKey = "";
let openaiModel = "gpt-4o-mini";
let aiScrapingEnabled = true;

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
const exportPdfBtn = document.getElementById("exportPdfBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const importFile = document.getElementById("importFile");
const clearAllBtn = document.getElementById("clearAllBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeModalBtn = document.querySelector(".close-modal");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const openaiApiKeyInput = document.getElementById("openaiApiKey");
const openaiModelInput = document.getElementById("openaiModel");
const enableAiScrapingInput = document.getElementById("enableAiScraping");
const autoFillBtn = document.getElementById("autoFillBtn");

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
  // Export buttons
  exportCsvBtn.addEventListener("click", exportToCSV);
  exportJsonBtn.addEventListener("click", exportToJSON);
  exportPdfBtn.addEventListener("click", exportToPDF);
  
  // Import button
  importJsonBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", importFromJSON);

  // Clear all button
  clearAllBtn.addEventListener("click", handleClearAll);

  // Settings Modal
  settingsBtn.addEventListener("click", openSettingsModal);
  closeModalBtn.addEventListener("click", closeSettingsModal);
  saveSettingsBtn.addEventListener("click", saveSettings);
  window.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettingsModal();
  });

  // Auto-Fill
  autoFillBtn.addEventListener("click", handleAutoFill);
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
            <div class="item-price">$${item.price.toFixed(2)} <span style="font-size: 0.5em; opacity: 0.7;">INC GST</span></div>
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
    localStorage.setItem("pricingCalcApiKey", openaiApiKey);
    localStorage.setItem("pricingCalcModel", openaiModel);
    localStorage.setItem("pricingCalcAiEnabled", aiScrapingEnabled.toString());
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

function loadFromLocalStorage() {
  try {
    const savedItems = localStorage.getItem("pricingCalcItems");
    const savedMargin = localStorage.getItem("pricingCalcMargin");
    const savedApiKey = localStorage.getItem("pricingCalcApiKey");
    const savedModel = localStorage.getItem("pricingCalcModel");
    const savedAiEnabled = localStorage.getItem("pricingCalcAiEnabled");

    if (savedItems) {
      items = JSON.parse(savedItems);
    }

    if (savedMargin) {
      marginPercentage = parseInt(savedMargin);
      marginSlider.value = marginPercentage;
      marginValue.textContent = `${marginPercentage}%`;
    }

    if (savedApiKey) {
      openaiApiKey = savedApiKey;
      openaiApiKeyInput.value = savedApiKey;
    }

    if (savedModel) {
      openaiModel = savedModel;
      openaiModelInput.value = savedModel;
    }

    if (savedAiEnabled !== null) {
      aiScrapingEnabled = savedAiEnabled === "true";
      enableAiScrapingInput.checked = aiScrapingEnabled;
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
function exportToPDF() {
  if (items.length === 0) {
    alert("No items to export.");
    return;
  }

  // Create a clone of the main content to format for PDF
  const element = document.createElement("div");
  element.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; color: #000;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #667eea; margin: 0;">Pricing Calculator</h1>
                <p style="color: #666; margin: 5px 0;">Beyond Cloud Technology</p>
                <p style="color: #999; font-size: 12px;">Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>

            <div style="margin-bottom: 30px;">
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #333;">Summary</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Base Total:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${
                          baseTotal.textContent
                        }</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Margin (${marginPercentage}%):</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${
                          marginAmount.textContent
                        }</td>
                    </tr>
                    <tr style="border-top: 2px solid #eee;">
                        <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #333;">Final Total:</td>
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #667eea;">${
                          finalTotal.textContent
                        }</td>
                    </tr>
                </table>
            </div>

            <div>
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #333;">Items List</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price (INC GST)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items
                          .map(
                            (item) => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <div style="font-weight: bold;">${
                                      item.name
                                    }</div>
                                    ${
                                      item.url
                                        ? `<div style="font-size: 12px; color: #666;">${item.url}</div>`
                                        : ""
                                    }
                                </td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${item.price.toFixed(
                                  2
                                )}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;

  // Fix: Append to body to ensure html2canvas can render it
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '0';
  document.body.appendChild(element);

  const opt = {
    margin: 10,
    filename: "pricing-calculator-export.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      document.body.removeChild(element);
      showNotification("Exported to PDF successfully!");
    })
    .catch((err) => {
      if (document.body.contains(element)) {
        document.body.removeChild(element);
      }
      console.error("PDF Export Error:", err);
      alert("Failed to export PDF. Please try again.");
    });
}

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

function importFromJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Invalid file format");
      }

      if (confirm("This will overwrite your current items. Are you sure you want to proceed?")) {
        items = data.items;
        
        // Restore margin if available
        if (data.summary && data.summary.marginPercentage) {
          marginPercentage = data.summary.marginPercentage;
          marginSlider.value = marginPercentage;
          marginValue.textContent = `${marginPercentage}%`;
        }

        saveToLocalStorage();
        renderItems();
        updateSummary();
        showNotification("Data imported successfully!");
      }
    } catch (error) {
      console.error("Import Error:", error);
      alert("Failed to import data. Please check if the file is a valid JSON export.");
    }
    
    // Reset file input
    importFile.value = '';
  };
  
  reader.readAsText(file);
}

// ============================================
// AI Auto-Fill Functions
// ============================================
function openSettingsModal() {
  settingsModal.classList.add("show");
  openaiApiKeyInput.value = openaiApiKey;
  openaiModelInput.value = openaiModel;
  enableAiScrapingInput.checked = aiScrapingEnabled;
}

function closeSettingsModal() {
  settingsModal.classList.remove("show");
}

function saveSettings() {
  openaiApiKey = openaiApiKeyInput.value.trim();
  openaiModel = openaiModelInput.value;
  aiScrapingEnabled = enableAiScrapingInput.checked;
  
  saveToLocalStorage();
  closeSettingsModal();
  showNotification("Settings saved successfully!");
}

async function handleAutoFill() {
  if (!aiScrapingEnabled) {
    alert("AI Auto-Fill is disabled. Enable it in Settings.");
    return;
  }

  if (!openaiApiKey) {
    alert("Please enter your OpenAI API Key in Settings.");
    openSettingsModal();
    return;
  }

  const url = itemUrlInput.value.trim();
  if (!url) {
    alert("Please enter a Product URL first.");
    return;
  }

  autoFillBtn.classList.add("loading");
  
  try {
    // Note: This fetch will likely fail due to CORS on most sites
    // unless the user is using a CORS proxy or a CORS-friendly site.
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch page content");
    
    const htmlText = await response.text();
    await analyzeWithOpenAI(htmlText);
    
  } catch (error) {
    console.error("Auto-Fill Error:", error);
    if (error.message.includes("Failed to fetch")) {
      alert("Could not fetch the website content. This is likely due to browser security restrictions (CORS). Try a different site or manually enter the details.");
    } else {
      alert(`Error: ${error.message}`);
    }
  } finally {
    autoFillBtn.classList.remove("loading");
  }
}

async function analyzeWithOpenAI(htmlContent) {
  // Truncate HTML to avoid token limits (taking first 15000 chars is usually enough for meta tags and main content)
  const truncatedHtml = htmlContent.substring(0, 15000);

  const systemPrompt = `
    You are a helpful assistant that extracts product information from HTML.
    Find the product name and price.
    Return ONLY a JSON object with keys "name" (string) and "price" (number).
    If you cannot find them, return null for that field.
    Example: {"name": "Product X", "price": 19.99}
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract data from this HTML:\n\n${truncatedHtml}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const result = JSON.parse(data.choices[0].message.content);
    
    if (result.name) itemNameInput.value = result.name;
    if (result.price) itemPriceInput.value = result.price;
    
    showNotification("Auto-filled successfully!");
    
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to analyze content with AI: " + error.message);
  }
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

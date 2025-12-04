// ============================================
// State Management
// ============================================
let items = [];
let marginPercentage = 10;
let openaiApiKey = "";
let openaiModel = "gpt-5-nano"; // Cheapest GPT-5 model, best for simple scraping tasks
let aiScrapingEnabled = true;
let quickAddMode = false; // Quick Add Mode state
let editingIndex = -1; // Track which item is being edited (-1 = none)

// CORS Proxy services to try in order
const CORS_PROXIES = [
  { name: "AllOrigins", url: (targetUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` },
  { name: "CorsProxy.io", url: (targetUrl) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` },
  { name: "CodeTabs", url: (targetUrl) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}` }
];

// Default fallback models
const DEFAULT_MODELS = [
  { id: "gpt-5-nano", name: "gpt-5-nano (Recommended)" },
  { id: "gpt-5-mini", name: "gpt-5-mini" },
  { id: "gpt-4.1-nano", name: "gpt-4.1-nano" },
  { id: "gpt-4o-mini", name: "gpt-4o-mini" }
];

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
// itemCount is defined below as itemCountSpan to avoid confusion
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
const validateApiKeyBtn = document.getElementById("validateApiKeyBtn");
const pasteNameBtn = document.getElementById("pasteNameBtn");
const pastePriceBtn = document.getElementById("pastePriceBtn");
const autoFillBtn = document.getElementById("autoFillBtn");

// UX Improvement Elements
const quickAddModeCheckbox = document.getElementById("quickAddMode");
const addItemBtnText = document.getElementById("addItemBtnText");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const itemCountSpan = document.getElementById("itemCount");
const toastContainer = document.getElementById("toastContainer");

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

  // API Key Validation
  validateApiKeyBtn.addEventListener("click", validateApiKey);

  // Clipboard Paste
  pasteNameBtn.addEventListener("click", () => pasteFromClipboard(itemNameInput));
  pastePriceBtn.addEventListener("click", () => pasteFromClipboard(itemPriceInput));

  // Auto-Fill
  autoFillBtn.addEventListener("click", handleAutoFill);

  // UX Improvements - Quick Add Mode
  quickAddModeCheckbox.addEventListener("change", (e) => {
    quickAddMode = e.target.checked;
    localStorage.setItem("quickAddMode", quickAddMode);
  });

  // UX Improvements - Cancel Edit
  cancelEditBtn.addEventListener("click", cancelEdit);

  // UX Improvements - Keyboard Shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Load Quick Add preference
  const savedQuickAdd = localStorage.getItem("quickAddMode");
  if (savedQuickAdd !== null) {
    quickAddMode = savedQuickAdd === "true";
    quickAddModeCheckbox.checked = quickAddMode;
  }
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
    showToast("Please enter a valid product name and price", "error");
    return;
  }

  // Check if we're editing an existing item
  if (editingIndex !== -1) {
    items[editingIndex] = {
      ...items[editingIndex],
      url: url || "",
      name: name,
      price: price
    };
    saveToLocalStorage();
    renderItems();
    updateSummary();
    showToast("Item updated successfully!", "success");
    cancelEdit();
    return;
  }

  // Adding new item
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

  // Quick Add Mode: keep form open and auto-focus
  if (quickAddMode) {
    itemNameInput.value = "";
    itemPriceInput.value = "";
    itemUrlInput.value = "";
    itemNameInput.focus();
    showToast("Item added! Ready for next item", "success");
  } else {
    // Normal mode: reset form
    itemForm.reset();
    itemNameInput.focus();
    showToast("Item added successfully!", "success");
  }
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
      (item, index) => `
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
                <button class="btn btn-secondary btn-small" onclick="editItem(${index})" title="Edit item">
                    <span class="btn-icon">✏️</span>
                    Edit
                </button>
                <button class="btn btn-duplicate btn-small" onclick="duplicateItem(${index})" title="Duplicate item">
                    <span class="btn-icon">📋</span>
                    Duplicate
                </button>
                <button class="btn btn-danger btn-small" onclick="handleDeleteItem(${
                  item.id
                })" title="Delete item">
                    <span class="btn-icon">🗑️</span>
                    Delete
                </button>
            </div>
        </div>
    `
    )
    .join("");
  
  // Update item count
  updateItemCount();
}

function updateSummary() {
  const base = calculateBaseTotal();
  const margin = calculateMarginAmount(base);
  const final = base + margin;

  baseTotal.textContent = `$${base.toFixed(2)}`;
  marginAmount.textContent = `$${margin.toFixed(2)}`;
  finalTotal.textContent = `$${final.toFixed(2)}`;
  // Item count is handled by updateItemCount() called in renderItems()
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
  
  // Fetch and populate models dynamically
  fetchAndPopulateModels();
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

async function validateApiKey() {
  const apiKey = openaiApiKeyInput.value.trim();
  
  if (!apiKey) {
    alert("Please enter an API key first.");
    return;
  }

  validateApiKeyBtn.classList.add("loading");
  validateApiKeyBtn.textContent = "...";

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      // Save the API key immediately on successful validation
      openaiApiKey = apiKey;
      saveToLocalStorage();
      
      validateApiKeyBtn.textContent = "✓";
      validateApiKeyBtn.style.backgroundColor = "#10b981";
      showNotification("✓ API Key is valid and saved!");
      
      // Refresh model list with the validated key
      fetchAndPopulateModels();
      
      setTimeout(() => {
        validateApiKeyBtn.style.backgroundColor = "";
      }, 2000);
    } else {
      throw new Error("Invalid API key");
    }
  } catch (error) {
    validateApiKeyBtn.textContent = "✗";
    validateApiKeyBtn.style.backgroundColor = "#ef4444";
    alert("✗ Invalid API Key. Please check and try again.");
    
    setTimeout(() => {
      validateApiKeyBtn.textContent = "✓";
      validateApiKeyBtn.style.backgroundColor = "";
    }, 2000);
  } finally {
    validateApiKeyBtn.classList.remove("loading");
  }
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
  
  let htmlText = "";
  let successfulProxy = null;
  
  // Try each proxy in sequence
  for (const proxy of CORS_PROXIES) {
    try {
      console.log(`Trying ${proxy.name}...`);
      const proxyUrl = proxy.url(url);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error(`${proxy.name} failed with status ${response.status}`);
      
      htmlText = await response.text();
      
      // Check if we got a real page (not a Cloudflare challenge)
      if (htmlText.includes('Just a moment') || htmlText.includes('cf-browser-verification')) {
        console.log(`${proxy.name} returned Cloudflare challenge, trying next...`);
        continue;
      }
      
      successfulProxy = proxy.name;
      console.log(`${proxy.name} succeeded!`);
      break;
      
    } catch (error) {
      console.error(`${proxy.name} error:`, error.message);
      // Continue to next proxy
    }
  }
  
  if (!htmlText || !successfulProxy) {
    autoFillBtn.classList.remove("loading");
    alert("Unable to fetch the website. All proxies failed or the site is heavily protected (Cloudflare). Try using the clipboard paste buttons instead.");
    return;
  }
  
  try {
    await analyzeWithOpenAI(htmlText);
    showNotification(`✓ Auto-filled using ${successfulProxy}!`);
  } catch (error) {
    console.error("Auto-Fill Error:", error);
    alert(`Error analyzing content: ${error.message}`);
  } finally {
    autoFillBtn.classList.remove("loading");
  }
}

async function pasteFromClipboard(targetInput) {
  try {
    const text = await navigator.clipboard.readText();
    
    if (!text) {
      alert("Clipboard is empty.");
      return;
    }
    
    // If pasting to price field, try to extract just the number
    if (targetInput === itemPriceInput) {
      // Remove currency symbols, commas, and extract number
      const numberMatch = text.match(/[\d,]+\.?\d*/);  
      if (numberMatch) {
        const cleanNumber = numberMatch[0].replace(/,/g, '');
        targetInput.value = cleanNumber;
      } else {
        targetInput.value = text;
      }
    } else {
      targetInput.value = text;
    }
    
    showNotification("✓ Pasted from clipboard!");
    
  } catch (error) {
    console.error("Clipboard error:", error);
    alert("Unable to access clipboard. Please ensure you've granted clipboard permissions.");
  }
}

// ============================================
// Dynamic Model List Functions
// ============================================
async function fetchAndPopulateModels() {
  // Check cache first
  const cachedData = localStorage.getItem("openaiModelsCache");
  const cacheTimestamp = localStorage.getItem("openaiModelsCacheTime");
  
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  // Use cache if it's less than 24 hours old
  if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < twentyFourHours) {
    console.log("Using cached models");
    const models = JSON.parse(cachedData);
    populateModelDropdown(models);
    return;
  }
  
  // Get API key from input field (in case it's not saved yet)
  const apiKeyToUse = openaiApiKeyInput.value.trim() || openaiApiKey;
  
  // Fetch fresh models if we have an API key
  if (apiKeyToUse) {
    try {
      const models = await fetchAvailableModels(apiKeyToUse);
      
      // Cache the results
      localStorage.setItem("openaiModelsCache", JSON.stringify(models));
      localStorage.setItem("openaiModelsCacheTime", now.toString());
      
      populateModelDropdown(models);
      console.log("Fetched and cached fresh models");
    } catch (error) {
      console.error("Error fetching models:", error);
      // Use default models as fallback
      populateModelDropdown(DEFAULT_MODELS);
    }
  } else {
    // No API key, use defaults
    populateModelDropdown(DEFAULT_MODELS);
  }
}

async function fetchAvailableModels(apiKey) {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch models");
  }
  
  const data = await response.json();
  
  // Filter to only GPT chat models and sort by newest first
  const gptModels = data.data
    .filter(model => {
      const id = model.id.toLowerCase();
      return id.startsWith('gpt-5') || id.startsWith('gpt-4') || id.startsWith('gpt-3.5-turbo');
    })
    .map(model => ({
      id: model.id,
      name: model.id
    }))
    .sort((a, b) => {
      // Extract version number (5, 4, 3.5)
      const getVersion = (id) => {
        if (id.startsWith('gpt-5')) return 5;
        if (id.startsWith('gpt-4')) return 4;
        if (id.startsWith('gpt-3.5')) return 3.5;
        return 0;
      };
      
      const aVersion = getVersion(a.id);
      const bVersion = getVersion(b.id);
      
      // Sort by version (newest first)
      if (aVersion !== bVersion) {
        return bVersion - aVersion; // 5 > 4 > 3.5
      }
      
      // Within same version, sort by model variant
      // Priority: base model > mini > nano > turbo
      const getVariantPriority = (id) => {
        if (id.includes('mini')) return 1;
        if (id.includes('nano')) return 2;
        if (id.includes('turbo')) return 3;
        return 0; // base model (e.g., gpt-5.1, gpt-4.1)
      };
      
      const aPriority = getVariantPriority(a.id);
      const bPriority = getVariantPriority(b.id);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort alphabetically (descending for version numbers like 5.1 > 5.0)
      return b.id.localeCompare(a.id);
    });
  
  // Add "(Recommended)" to the newest/best model
  const models = gptModels.map(model => {
    // Recommend the first model in the sorted list (newest)
    if (model.id === gptModels[0]?.id) {
      return { ...model, name: `${model.id} (Recommended)` };
    }
    return model;
  });
  
  return models.length > 0 ? models : DEFAULT_MODELS;
}

function populateModelDropdown(models) {
  // Clear existing options
  openaiModelInput.innerHTML = '';
  
  // Add models to dropdown
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    openaiModelInput.appendChild(option);
  });
  
  // Set current selection
  openaiModelInput.value = openaiModel;
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

// ============================================
// UX Improvements Functions
// ============================================

// Toast Notification System
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const icons = {
    success: "✓",
    error: "✗",
    info: "ℹ",
    warning: "⚠"
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Keyboard Shortcuts Handler
function handleKeyboardShortcuts(e) {
  // Esc - Close modals
  if (e.key === "Escape") {
    if (settingsModal.classList.contains("show")) {
      closeSettingsModal();
    }
    if (editingIndex !== -1) {
      cancelEdit();
    }
  }
  
  // Ctrl/Cmd + S - Save settings
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    if (settingsModal.classList.contains("show")) {
      saveSettings();
    }
  }
  
  // Enter in form - Submit
  if (e.key === "Enter" && e.target.closest("#itemForm")) {
    e.preventDefault();
    itemForm.dispatchEvent(new Event("submit"));
  }
}

// Edit Item Function
function editItem(index) {
  const item = items[index];
  
  // Populate form
  itemNameInput.value = item.name;
  itemPriceInput.value = item.price;
  itemUrlInput.value = item.url || "";
  
  // Update UI for edit mode
  editingIndex = index;
  addItemBtnText.textContent = "Update Item";
  addItemBtn.querySelector(".btn-icon").textContent = "✓";
  cancelEditBtn.style.display = "inline-block";
  
  // Highlight the item being edited
  document.querySelectorAll(".item-card").forEach((card, i) => {
    card.classList.toggle("editing", i === index);
  });
  
  // Scroll to form
  itemForm.scrollIntoView({ behavior: "smooth", block: "start" });
  itemNameInput.focus();
}

// Cancel Edit Function
function cancelEdit() {
  editingIndex = -1;
  itemForm.reset();
  addItemBtnText.textContent = "Add Item";
  addItemBtn.querySelector(".btn-icon").textContent = "+";
  cancelEditBtn.style.display = "none";
  
  // Remove editing highlight
  document.querySelectorAll(".item-card").forEach(card => {
    card.classList.remove("editing");
  });
}

// Duplicate Item Function
function duplicateItem(index) {
  const item = items[index];
  const duplicatedItem = {
    id: Date.now(),
    name: `${item.name} (Copy)`,
    price: item.price,
    url: item.url || ""
  };
  
  items.push(duplicatedItem);
  saveToLocalStorage();
  renderItems();
  updateSummary();
  showToast(`Duplicated "${item.name}"`, "success");
}

// Clear All Items with Confirmation
function handleClearAll() {
  if (items.length === 0) {
    showToast("No items to clear", "info");
    return;
  }
  
  const confirmed = confirm(`Are you sure you want to delete all ${items.length} items? This cannot be undone.`);
  
  if (confirmed) {
    items = [];
    saveToLocalStorage();
    renderItems();
    updateSummary();
    showToast("All items cleared", "success");
  }
}

// Update Item Count
// Update Item Count
function updateItemCount() {
  const span = document.getElementById("itemCount");
  if (span) {
    span.textContent = `(${items.length})`;
  }
}

// ============================================
// Export Functions
// ============================================

// Export to CSV
function exportToCSV() {
  if (items.length === 0) {
    showToast("No items to export", "warning");
    return;
  }

  const headers = ["Product Name", "Price (INC GST)", "URL"];
  const csvContent = [
    headers.join(","),
    ...items.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.price.toFixed(2),
      `"${item.url || ''}"`
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `pricing-calculator-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("Exported to CSV successfully!", "success");
}

// Export to JSON
function exportToJSON() {
  if (items.length === 0) {
    showToast("No items to export", "warning");
    return;
  }

  const data = {
    items: items,
    marginPercentage: marginPercentage,
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `pricing-calculator-${Date.now()}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("Exported to JSON successfully!", "success");
}

// Import from JSON
function importFromJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      if (data.items && Array.isArray(data.items)) {
        items = data.items;
        if (data.marginPercentage !== undefined) {
          marginPercentage = data.marginPercentage;
          marginSlider.value = marginPercentage;
          marginValue.textContent = `${marginPercentage}%`;
        }
        saveToLocalStorage();
        renderItems();
        updateSummary();
        showToast(`Imported ${items.length} items successfully!`, "success");
      } else {
        showToast("Invalid JSON format", "error");
      }
    } catch (error) {
      showToast("Error reading file", "error");
      console.error("Import error:", error);
    }
  };
  
  reader.readAsText(file);
  e.target.value = ""; // Reset file input
}

// Export to PDF
function exportToPDF() {
  if (items.length === 0) {
    showToast("No items to export", "warning");
    return;
  }

  const base = calculateBaseTotal();
  const margin = calculateMargin(base);
  const final = base + margin;

  // Create PDF content
  const pdfContent = document.createElement("div");
  pdfContent.style.padding = "20px";
  pdfContent.style.fontFamily = "Arial, sans-serif";
  pdfContent.style.color = "#000";
  pdfContent.style.backgroundColor = "#fff";

  pdfContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #667eea; margin-bottom: 10px;">Beyond Cloud Technology</h1>
      <h2 style="color: #333; margin-top: 0;">Pricing Calculator Report</h2>
      <p style="color: #666; font-size: 14px;">Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Items List</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Product Name</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Price (INC GST)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(item.name)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
      <h3 style="color: #667eea; margin-top: 0;">Price Summary</h3>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
        <span style="font-weight: bold;">Base Total:</span>
        <span>$${base.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
        <span style="font-weight: bold;">Margin (${marginPercentage}%):</span>
        <span>$${margin.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 15px 0; font-size: 18px; font-weight: bold; color: #667eea;">
        <span>Final Total:</span>
        <span>$${final.toFixed(2)}</span>
      </div>
    </div>

    <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Beyond Cloud Technology. All rights reserved.</p>
      <p>YouTube: @beyondcloudtechnology</p>
    </div>
  `;

  // Append to body temporarily
  document.body.appendChild(pdfContent);

  // PDF options
  const opt = {
    margin: 10,
    filename: `pricing-calculator-${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  // Generate PDF
  html2pdf()
    .set(opt)
    .from(pdfContent)
    .save()
    .then(() => {
      document.body.removeChild(pdfContent);
      showToast("PDF exported successfully!", "success");
    })
    .catch((error) => {
      document.body.removeChild(pdfContent);
      showToast("Error generating PDF", "error");
      console.error("PDF error:", error);
    });
}

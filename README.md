# Pricing Calculator

A modern, web-based pricing calculator application that helps you manage product pricing, calculate totals, and apply margin percentages. Built with vanilla HTML, CSS, and JavaScript for maximum performance and compatibility.

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Features

### Core Functionality
- **📝 Item Management**: Add, edit, and delete items with product names, URLs, and prices
- **💰 Price Calculations**: Automatic calculation of base totals and margin-adjusted totals
- **📊 Margin Control**: Adjustable margin percentage (0-100%) with default at 10%
- **💾 Data Persistence**: Automatic saving to browser local storage
- **📤 Export Options**: Export your data to CSV or JSON formats
- **🔗 URL Tracking**: Store product URLs for easy reference

### Design Features
- **🎨 Modern Dark Theme**: Sleek dark interface with vibrant gradient accents
- **✨ Glassmorphism Effects**: Frosted glass aesthetic on cards and containers
- **🎭 Smooth Animations**: Micro-interactions and transitions throughout
- **📱 Fully Responsive**: Optimized for mobile, tablet, and desktop
- **♿ Accessible**: Proper ARIA labels and keyboard navigation support

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository
2. **Open** `index.html` in your web browser
3. **Start adding items** immediately - no build process required!

### Usage

1. **Add Items**
   - Enter the product URL (optional)
   - Enter the product name (required)
   - Enter the price (required)
   - Click "Add Item"

2. **Adjust Margin**
   - Use the slider to set your desired margin percentage
   - Watch the final total update in real-time

3. **Manage Items**
   - Click "Edit" to modify an item's details
   - Click "Delete" to remove an item
   - Click "Clear All" to remove all items

4. **Export Data**
   - Click "Export CSV" for spreadsheet-compatible format
   - Click "Export JSON" for structured data format

## 📁 Project Structure

```
Web-Calc/
├── index.html          # Main HTML structure
├── styles.css          # Styling and design system
├── script.js           # Application logic and functionality
└── README.md           # This file
```

## 🎨 Design System

### Color Palette
- **Background**: Deep navy (`#0a0e27`, `#151932`)
- **Accents**: Purple-blue gradient (`#667eea` → `#764ba2`)
- **Success**: Cyan gradient (`#4facfe` → `#00f2fe`)
- **Text**: White with varying opacity for hierarchy

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)

## 💻 Technical Details

### Technologies
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript**: No frameworks or dependencies
- **Local Storage API**: Client-side data persistence

### Browser Support
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Key Features Implementation
- **Responsive Design**: CSS Grid and Flexbox with mobile-first approach
- **Data Persistence**: LocalStorage for automatic save/load
- **Export Functionality**: Client-side CSV and JSON generation
- **Form Validation**: HTML5 validation with custom JavaScript checks

## 🔧 Customization

### Changing Default Margin
Edit `script.js` line 6:
```javascript
let marginPercentage = 10; // Change to your preferred default
```

### Modifying Color Scheme
Edit CSS custom properties in `styles.css`:
```css
:root {
    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Modify other color variables as needed */
}
```

## 📝 License

This project is licensed under the **GPL-3.0 License**.

### What this means:
- ✅ You can use this software for any purpose
- ✅ You can modify the source code
- ✅ You can distribute the software
- ✅ You can distribute your modifications
- ⚠️ You must disclose the source code when distributing
- ⚠️ You must license derivative works under GPL-3.0
- ⚠️ You must include the original license and copyright notice

For more details, see the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🙏 Acknowledgments

- **Google Fonts** for the Inter typeface
- **Modern web standards** for making this possible without frameworks
- **Open source community** for inspiration and best practices

## 📧 Support

If you encounter any issues or have questions, please open an issue in the repository.

---

**Built with ❤️ using modern web technologies**

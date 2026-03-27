# Frontend - ECO-CYCLE-PAY

The frontend of ECO-CYCLE-PAY is a responsive web application built with vanilla HTML, CSS, and JavaScript. It provides user interfaces for different stakeholder roles including NGOs, vendors, and the general public to interact with the eco-cycle payment system.

## Project Structure

```
frontend/                    # HTML source files
├── index.html               # Landing page
├── login.html               # User login page
├── signup.html              # User registration page
├── dashboard.html           # Main user dashboard
├── dashboard-ngo.html       # NGO-specific dashboard
├── dashboard-vendor.html    # Vendor-specific dashboard
├── wallet.html              # Wallet management page
├── submit.html              # Submission form page
├── verify.html              # Verification page
├── manage-orders.html       # Order management page
├── profile.html             # User profile page
├── upload.html              # Upload page for item verification
└── assets/                       # Static assets
    ├── js/                       # JavaScript functionality
    │   ├── app.js               # Main application logic
    │   └── camera.js            # Camera/media functionality
    │
    └── styles/                   # CSS stylesheets
        └── style.css            # Main stylesheet
```

## File Descriptions

### HTML Pages

| File | Purpose |
|------|---------|
| **index.html** | Landing page with project overview and navigation |
| **login.html** | User login interface with credentials form |
| **signup.html** | User registration form with role selection |
| **dashboard.html** | General user dashboard showing activity and insights |
| **dashboard-ngo.html** | NGO-specific dashboard for managing eco-cycle initiatives |
| **dashboard-vendor.html** | Vendor dashboard for managing products and transactions |
| **wallet.html** | Wallet interface for viewing balance and transactions |
| **submit.html** | Form for submitting eco-cycle items or data |
| **verify.html** | Verification interface for two-factor authentication or item verification |
| **manage-orders.html** | Interface for managing orders and transactions |
| **profile.html** | User profile management page |
| **upload.html** | Page for uploading images or data for verification |

### JavaScript Assets (`assets/js/`)

| File | Purpose |
|------|---------|
| **app.js** | Core application logic, routing, and event handling |
| **camera.js** | Camera and media capture functionality for item verification |

### Stylesheets (`assets/styles/`)

| File | Purpose |
|------|---------|
| **style.css** | Global styles, responsive design, and layout |

## Setup Instructions

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of HTML/CSS/JavaScript
- Text editor or IDE (VS Code recommended)

### Development Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **No installation required** - The frontend runs on pure vanilla JavaScript with no build tools or dependencies.

### Running the Application

#### Option 1: Live Server (Recommended)
If using VS Code, install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer):
```bash
# Right-click on any HTML file → "Open with Live Server"
# or press Alt + L, Alt + O
```

#### Option 2: Simple HTTP Server
Python 3:
```bash
python -m http.server 8000
# Access at http://localhost:8000
```

Python 2:
```bash
python -m SimpleHTTPServer 8000
# Access at http://localhost:8000
```

Node.js (using http-server):
```bash
npx http-server
# Access at http://localhost:8080
```

#### Option 3: Direct File Opening
Simply open any HTML file directly in your browser:
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

## Browser Compatibility

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Development Guidelines

### Code Style

- **Indentation:** 2 spaces for HTML/CSS, 2 spaces for JavaScript
- **Naming:** Use camelCase for JavaScript variables and functions
- **Comments:** Add meaningful comments for complex logic
- **Formatting:** Follow standard HTML/CSS conventions

### File Organization

- Keep HTML markup clean and semantic
- Group related styles in `style.css` with commented sections
- Organize JavaScript into logical functions with clear names
- Use meaningful variable and function names

### Linking Assets

All asset references should be relative paths:
```html
<!-- CSS -->
<link rel="stylesheet" href="assets/styles/style.css">

<!-- JavaScript -->
<script src="assets/js/app.js"></script>
```

## Feature Areas

### User Authentication
- **Login** (`login.html`) - Credential-based authentication
- **Signup** (`signup.html`) - New user registration with role selection
- **Verification** (`verify.html`) - Two-factor authentication and verification

### User Dashboards
- **Dashboard** (`dashboard.html`) - General statistics and activity overview
- **Dashboard NGO** (`dashboard-ngo.html`) - NGO-specific functions and metrics
- **Dashboard Vendor** (`dashboard-vendor.html`) - Vendor products and transactions

### Core Functions
- **Wallet** (`wallet.html`) - Balance view and transaction history
- **Submit** (`submit.html`) - Submit eco-cycle items
- **Camera** (`camera.js`) - QR code/item scanning functionality
- **Manage Orders** (`manage-orders.html`) - View and manage orders
- **Profile** (`profile.html`) - User profile management
- **Upload** (`upload.html`) - Upload images/data for verification
- **Verification** (`verify.html`) - Item and user verification processes

## Connecting to Backend

The frontend is designed to communicate with the backend API. Update API endpoints in `app.js`:

```javascript
// Example API call
const API_BASE = 'http://localhost:3000/api/v1';

fetch(`${API_BASE}/endpoint`)
  .then(response => response.json())
  .then(data => console.log(data));
```

Refer to the [Backend README](../backend/README.md) for API endpoints documentation.

## Common Tasks

### Adding a New Page

1. Create a new HTML file:
   ```html
   <!-- new-page.html -->
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Page Title</title>
       <link rel="stylesheet" href="assets/styles/style.css">
   </head>
   <body>
       <!-- Content -->
       <script src="assets/js/app.js"></script>
   </body>
   </html>
   ```

2. Add navigation links in related pages
3. Update `app.js` with routing logic if needed

### Modifying Styles

1. Edit `assets/styles/style.css`
2. Use descriptive class names following BEM convention (optional)
3. Keep media queries organized at the end

### Adding JavaScript Functionality

1. Add functions to `app.js` or create new files in `assets/js/`
2. Include new scripts in HTML `<head>` or before `</body>`
3. Use event listeners for user interactions

## Troubleshooting

### CORS Issues
If connecting to a backend on a different port/domain, ensure the backend has CORS enabled. See [Backend README](../backend/README.md) for CORS configuration.

### Assets Not Loading
- Verify relative paths from current HTML file location
- Check browser console for 404 errors
- Ensure file names match exactly (case-sensitive on Linux/Mac)

### JavaScript Not Working
- Check browser console for errors (F12)
- Verify script files are included in correct order
- Ensure DOM is loaded before running scripts (`DOMContentLoaded` event)

## Contributing

When making changes to the frontend:

1. Test changes in multiple browsers
2. Ensure responsive design works on mobile/tablet
3. Update this README if adding new pages or features
4. Follow the code style guidelines above
5. Test API integration with the backend

## Related Documentation

- [Main README](../README.md) - Project overview
- [Setup Guide](../SETUP_GUIDE.md) - Project setup instructions
- [Backend README](../backend/README.md) - Backend API documentation
- [Backend Swagger Guide](../backend/SWAGGER_GUIDE.md) - API endpoint documentation

## Support

For issues or questions:
1. Check the [Main README](../README.md) for project context
2. Review the [Backend README](../backend/README.md) for API issues
3. Check browser console (F12) for error messages
4. Review the code comments and structure

---

**Last Updated:** March 2026  
**Part of:** ECO-CYCLE-PAY (Enyata × Interswitch Buildathon 2026)

# ECO-CYCLE-PAY
Enyata × Interswitch Buildathon 2026

## Project Structure

```
eco-cycle-pay/
├── backend/          # Node.js + TypeScript + MongoDB API
│   ├── src/
│   ├── .eslintrc.json
│   ├── .prettierrc.json
│   ├── tsconfig.json
│   └── package.json
├── frontend/         # HTML/CSS/JavaScript Frontend Application
│   ├── assets/
│   │   ├── styles/
│   │   ├── js/
│   │   └── images/
│   └── src/
├── .husky/           # Git hooks (Husky)
├── .lintstagedrc.json # Lint-staged configuration (root level)
└── package.json      # Root-level dependencies
```

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Git

### Initial Setup

1. Clone the repository and navigate to the project root:
```bash
cd eco-cycle-pay
```

2. Install root-level dependencies (includes Husky for git hooks):
```bash
npm install
```

3. Set up git hooks (required for pre-commit checks):

**Windows:**
```bash
.\setup-hooks.bat
```

**macOS/Linux:**
```bash
./setup-hooks.sh
```

**Or manually:**
```bash
git config core.hooksPath .husky
```

### Backend Setup

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

Quick start:
```bash
cd backend
npm install
npm run dev    # Start development server at http://localhost:5000
```

### Frontend Setup

See [frontend/README.md](frontend/README.md) for detailed frontend setup instructions.

Quick start:
```bash
cd frontend
cd src
Start live-server on index.html    # Start development server at http://localhost:5500
```

## Commit Rules & Code Quality

### Pre-commit Hooks

This project uses Husky and lint-staged to automatically enforce code quality before commits:

- **ESLint**: Checks for code quality issues and unused variables
- **Prettier**: Auto-formats code (double quotes, 4-space tabs, semicolons)

These run automatically when you commit changes to backend files:

```bash
git add .
git commit -m "commit description"
# Hooks automatically run ESLint and Prettier on staged files
```

**If a commit fails:**
- Fix unused variable warnings
- Fix formatting issues (Prettier will auto-format, re-stage if needed)
- Re-stage changes: `git add <files>`
- Try committing again

### Manual Code Quality Checks

Run linting/formatting in the backend:
```bash
cd backend
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
```

## Development Workflow

1. Make changes to backend code
2. Stage your changes: `git add <files>`
3. Commit: `git commit -m "message"`
4. Husky pre-commit hooks automatically run ESLint and Prettier
5. If checks pass, commit is completed; if not, fix issues and retry

## Contributing

- Follow the code quality rules enforced by ESLint and Prettier
- No unused variables allowed (commits will fail)
- Always use double quotes and proper semicolons
- Keep code clean and well-formatted

## License

MIT

# Project Setup Guide

This guide walks through setting up the ECO-CYCLE-PAY project with Husky and lint-staged configured at the root level.

## What's Been Set Up

### Root Level
- **Husky** (`node_modules/.husky`) - Git hooks framework
- **.husky/pre-commit** - Pre-commit hook that runs lint-staged
- **.lintstagedrc.json** - Configuration for running ESLint and Prettier on staged files
- **package.json** - Root dependencies (Husky, lint-staged)

### Backend Level
- **ESLint** - Code quality checks with no-unused-vars rule (ERROR level)
- **Prettier** - Code formatter (double quotes, 4-space tabs, semicolons)
- Independent build/test setup

## Initial Setup Checklist

### First Time After Clone

1. **Install root dependencies:**
   ```bash
   npm install
   ```
   This installs Husky and lint-staged at the root level.

2. **Configure git hooks:**
   ```bash
   # Windows
   .\setup-hooks.bat
   
   # macOS/Linux
   ./setup-hooks.sh
   
   # Or manually
   git config core.hooksPath .husky
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

### Verification

Verify everything is working:

```bash
# Check git hooks are configured
git config core.hooksPath
# Should output: .husky

# Check Husky files exist
ls -la .husky/
# Should see: pre-commit, _/

# Test the hook (optional)
cd backend
echo "const unused = 5;" > src/test.ts
git add src/test.ts
git commit -m "test: verify hooks"
# Should fail with unused variable error
git restore --staged src/test.ts
rm src/test.ts
```

## How It Works

### Making a Commit

```bash
# Make changes to backend code
echo "// code" >> backend/example.ts

# Stage changes
git add backend/example.ts

# Commit - hooks run automatically
git commit -m "feat: add example"
```

### What Happens During Commit

1. Pre-commit hook triggers (`.husky/pre-commit`)
2. Hook runs `npx lint-staged`
3. Lint-staged matches files using `.lintstagedrc.json` patterns:
   - `backend/**/*.ts` - Runs ESLint and Prettier
   - `backend/**/*.json` - Runs Prettier
4. If ESLint fails (unused variables), commit is blocked
5. If Prettier changes formatting, those changes are auto-staged
6. On next attempt, ESLint should pass

### If a Commit Fails

**Scenario: Unused variable error**
```bash
# Run commit, ESLint detects unused variable
git commit -m "my feature"
# ✗ Commit fails - ESLint finds unused variable

# Fix the issue
vim backend/src/file.ts
# Remove the unused variable

# Stage again and retry
git add backend/src/file.ts
git commit -m "my feature"
# ✓ Commit succeeds
```

**Scenario: Prettier reformats**
```bash
# Single quotes in code
echo 'const x = "test";' > backend/src/file.ts
git add backend/src/file.ts

git commit -m "my feature"
# Prettier auto-formats to double quotes
# Changes are auto-staged
# ✓ Commit succeeds with reformatted code
```

## Manual Code Quality

You can also run checks manually:

```bash
cd backend

# Check for issues
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format with Prettier
npm run format
```

## Configuration Files

### Root Level `.lintstagedrc.json`
```json
{
  "backend/**/*.ts": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

Specifies which files to lint/format and the commands to run.

### Backend `.eslintrc.json`
- No unused variables (ERROR)
- Double quotes required
- Semicolons required
- No-console off

### Backend `.prettierrc.json`
- Double quotes
- Tab width: 4 spaces
- Semicolons: true
- Print width: 100

## Troubleshooting

### Hooks Not Running
```bash
# Verify hook is configured
git config core.hooksPath
# Should output: .husky

# Re-configure if needed
git config core.hooksPath .husky
```

### Pre-commit Hook Not Found
```bash
# Check if files exist
ls -la .husky/
# Should show: pre-commit file, _ directory

# Reinstall root dependencies
npm install
```

### Permission Denied (macOS/Linux)
```bash
# Make hook executable
chmod +x .husky/pre-commit
```

### Want to Skip Hooks (Not Recommended)
```bash
# Skip pre-commit hooks for a single commit
git commit -m "message" --no-verify

# This bypasses ESLint and Prettier checks - only do this if absolutely necessary
```

## File Structure

```
eco-cycle-pay/
├── .husky/
│   ├── _ /                    # Husky internal directory  
│   └── pre-commit             # Pre-commit git hook
├── .lintstagedrc.json         # Staged files configuration
├── setup-hooks.bat            # Windows setup script
├── setup-hooks.sh             # macOS/Linux setup script
├── package.json               # Root dependencies
├── backend/
│   ├── .eslintrc.json
│   ├── .prettierrc.json
│   ├── .lintstagedrc.json     # (DEPRECATED - use root level)
│   └── ...
└── frontend/
    └── ...
```

## Next Steps

- Set up frontend similarly when ready
- Consider adding other hooks (pre-push, commit-msg) as needed
- Document any project-specific linting rules

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)

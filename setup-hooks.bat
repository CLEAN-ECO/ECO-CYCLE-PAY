@echo off
REM Set up git hooks path for Husky at the project root
echo Setting up git hooks at project root...
git config core.hooksPath .husky

if errorlevel 1 (
    echo ✗ Failed to configure git hooks
    exit /b 1
)

echo ✓ Git hooks configured successfully
echo ✓ ESLint and Prettier will run automatically on staged backend files before commit
echo ✓ Setup complete!

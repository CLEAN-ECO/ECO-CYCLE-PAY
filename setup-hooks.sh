#!/bin/bash

# Set up git hooks path for Husky at the project root
echo "Setting up git hooks at project root..."
git config core.hooksPath .husky

if [ $? -eq 0 ]; then
    echo "✓ Git hooks configured successfully"
    echo "✓ ESLint and Prettier will run automatically on staged backend files before commit"
else
    echo "✗ Failed to configure git hooks"
    exit 1
fi

# Make pre-commit hook executable (for non-Windows systems)
chmod +x .husky/pre-commit

echo "✓ Setup complete!"

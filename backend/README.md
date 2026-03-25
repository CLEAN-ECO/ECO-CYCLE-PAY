# ECO-CYCLE-PAY Backend

Backend service for the ECO-CYCLE-PAY application, built with Node.js, Express, TypeScript, and MongoDB.

## Prerequisites

- Node.js 18.x or higher
- npm package manager

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. **Install root-level dependencies** (for Husky and lint-staged):
```bash
cd ..
npm install
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Configure your environment variables in `.env`:
   - Update `DB_URI` with your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string
   - Adjust other configurations as needed

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:5000` by default.

## Code Quality & Commit Rules

### ESLint
Lints TypeScript files for code quality issues, including unused variables:
```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Automatically fix linting errors
```

**ESLint Configuration:**
- Double quotes required
- Semicolons required at end of lines
- No unused variables (throws error)
- Tab width: 4 spaces

### Prettier
Auto-formats code for consistent style:
```bash
npm run format      # Format all TypeScript and JSON files
```

**Prettier Configuration:**
- Double quotes
- Tab width: 4 spaces
- Semicolons at end of lines
- Trailing commas in multiline objects/arrays

### Pre-commit Hooks (Root Level)

Husky and lint-staged are configured at the project root level and automatically run linting and formatting on staged backend files before each commit:
- ESLint fixes staged files
- Prettier formats staged files
- No unused variables are allowed (commit will fail if present)

**Automatic Enforcement:**
When you commit changes from any project folder:
```bash
git add backend/...
git commit -m "message"
```

The hooks will automatically:
1. Check for unused variables
2. Fix ESLint issues
3. Format code with Prettier (double quotes, tab width 4)

If pre-commit fails due to unused variables, fix them and try committing again.

## Building

Build the TypeScript code to JavaScript:
```bash
npm run build
```

The compiled code will be in the `dist/` folder.

## Production

Start the production server:
```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts           # Application entry point
│   ├── config/            # Configuration files
│   ├── models/            # Mongoose schemas
│   ├── controllers/       # Request handlers
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── utils/             # Utility functions
├── dist/                  # Compiled JavaScript (generated)
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json          # TypeScript configuration
└── README.md
```

## API Documentation

API endpoints will be documented in route files under `src/routes/`.

## Testing

Run tests:
```bash
npm run test
```

## Linting

Check code quality:
```bash
npm run lint
```

## API Documentation

### Swagger UI

Access interactive API documentation at: **`http://localhost:5000/api-docs`**

The Swagger UI is automatically generated from JSDoc comments in your route files.

#### Documenting Endpoints

Add JSDoc comments with Swagger syntax above your route handlers:

```typescript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/', getUsers);
```

#### Defining Schemas

Create reusable schemas in your route files:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 */
```

#### Authentication

For JWT-protected endpoints, use the `bearerAuth` security scheme:

```typescript
/**
 * @swagger
 * /api/v1/protected-route:
 *   get:
 *     security:
 *       - bearerAuth: []
 */
```

See [src/routes/swagger.example.ts](src/routes/swagger.example.ts) for comprehensive examples.

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure code passes linting and tests
4. Submit a pull request

## License

MIT

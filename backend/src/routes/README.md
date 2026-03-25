# Routes

This directory contains API route definitions.

## Basic Route Structure

Example structure:
```typescript
import { Router } from 'express';
import { getUsers, createUser } from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);

export default router;
```

## Swagger Documentation

Document your routes using JSDoc comments with Swagger/OpenAPI syntax. This will automatically be included in the Swagger UI.

### Example with Swagger Comments

```typescript
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/', (req: Request, res: Response) => {
  // Implementation
});

export default router;
```

## Key Swagger JSDoc Tags

- **@swagger** - Marks the start of Swagger documentation
- **tags** - Organize endpoints in the UI
- **summary** - Brief endpoint description
- **description** - Detailed explanation
- **parameters** - Query, path, or header parameters
- **requestBody** - Request payload schema
- **responses** - Response codes and schemas
- **security** - Authentication requirements (bearerAuth for JWT)

## Component Schemas

Define reusable schemas in route files or a dedicated file:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
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

## Security/Authentication

For JWT-protected routes:

```typescript
/**
 * @swagger
 * /api/v1/protected:
 *   get:
 *     security:
 *       - bearerAuth: []
 */
```

See `swagger.example.ts` for complete examples.


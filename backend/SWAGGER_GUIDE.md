# Swagger/OpenAPI Documentation Guide

This guide explains how to document your API endpoints using Swagger/OpenAPI in this project.

## Overview

- **Swagger UI**: Available at `http://localhost:5000/api-docs`
- **Configuration**: [src/config/swagger.ts](src/config/swagger.ts)
- **Tool**: [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) - converts JSDoc comments to OpenAPI specs

## Basic Endpoint Documentation

### GET Request

```typescript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their unique identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', getUser);
```

### POST Request with Request Body

```typescript
/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 */
router.post('/', createUser);
```

### PUT Request

```typescript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', updateUser);
```

### DELETE Request

```typescript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id', deleteUser);
```

## Defining Schemas (Models)

Define reusable schemas for your data models:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: MongoDB ObjectId
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password (not returned in responses)
 *         name:
 *           type: string
 *           description: User full name
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "507f1f77bcf86cd799439011"
 *         email: "user@example.com"
 *         name: "John Doe"
 *         createdAt: "2026-03-23T10:30:00.000Z"
 *         updatedAt: "2026-03-23T10:30:00.000Z"
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             status:
 *               type: number
 *             message:
 *               type: string
 */
```

## Query Parameters

```typescript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for users
 */
```

## Authentication (JWT Bearer Token)

Define security scheme globally in swagger.ts, then use on protected routes:

```typescript
/**
 * @swagger
 * /api/v1/protected-resource:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get protected resource
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
```

## Request/Response Examples

```typescript
/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: "507f1f77bcf86cd799439011"
 *                 email: "user@example.com"
 *                 name: "John Doe"
 */
```

## Common Data Types

| Type | Format | Description |
|------|--------|-------------|
| string | - | Text |
| string | email | Email address |
| string | date-time | ISO 8601 datetime |
| string | uuid | UUID identifier |
| string | password | Password field |
| string | binary | File/binary data |
| integer | int32 | 32-bit integer |
| integer | int64 | 64-bit integer |
| number | float | Floating-point number |
| number | double | Double precision number |
| boolean | - | True/false |
| array | - | Array of items |
| object | - | Object/dictionary |

## HTTP Status Codes

- **200** - OK: Successful GET/PUT request
- **201** - Created: Successful POST request
- **204** - No Content: Successful DELETE request
- **400** - Bad Request: Invalid input
- **401** - Unauthorized: Authentication required
- **403** - Forbidden: Authenticated but not authorized
- **404** - Not Found: Resource doesn't exist
- **409** - Conflict: Resource already exists
- **500** - Internal Server Error

## Tags

Organize endpoints by feature or resource:

```typescript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags:
 *       - Products
 */
```

## Tips

1. **Keep it consistent**: Use the same structure and terminology across all endpoints
2. **Use references**: Reference schemas with `$ref: '#/components/schemas/SchemaName'`
3. **Document errors**: Always include 4xx and 5xx response codes
4. **Add examples**: Include `example:` field for clarity
5. **Test in Swagger UI**: Verify documentation renders correctly
6. **Update as you code**: Keep docs in sync with implementation

## Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI 3.0 Data Types](https://spec.openapis.org/oas/v3.0.3#data-types)

# Controllers

This directory contains request handlers for API endpoints.

Each controller should handle business logic for specific features.

Example structure:
```typescript
import { Request, Response } from 'express';

export const getUsers = async (req: Request, res: Response) => {
  // Implementation
};
```

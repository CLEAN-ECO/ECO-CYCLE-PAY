# Models

This directory contains Mongoose schema definitions.

Example structure:
```typescript
import { Schema, model } from 'mongoose';

interface IUser {
  name: string;
  email: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', userSchema);
```

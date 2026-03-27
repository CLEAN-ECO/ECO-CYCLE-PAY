import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendUnauthorized } from "../utils/responseHelper";
import { ObjectId } from "mongoose";

const { JWT_SECRET } = process.env as unknown as Record<string, string>;

interface UserPayload {
    userId: ObjectId;
    email: string;
    role?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}

/**
 * Middleware to verify JWT token
 * Checks for Bearer token in Authorization header
 * Attaches decoded user payload to req.user
 */
export const verifyToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Response | void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return sendUnauthorized(res, "Authorization token is required");
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return sendUnauthorized(res, "Token has expired");
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return sendUnauthorized(res, "Invalid token");
        }
        return sendUnauthorized(res, "Authentication failed");
    }
};

/**
 * Middleware to verify temporary JWT token
 * Used specifically for wallet setup flow (expires in 15 minutes)
 * Can be used for other short-lived token flows
 */
export const verifyTempToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Response | void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return sendUnauthorized(res, "Authorization token is required");
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return sendUnauthorized(res, "Temporary token has expired");
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return sendUnauthorized(res, "Invalid temporary token");
        }
        return sendUnauthorized(res, "Token verification failed");
    }
};

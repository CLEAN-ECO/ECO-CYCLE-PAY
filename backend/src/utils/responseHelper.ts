import { Response } from "express";

export interface SuccessResponse<T = unknown> {
    success: true;
    message: string;
    data?: T;
}

export interface PaginatedResponse<T = unknown> {
    success: true;
    message: string;
    data: T[];
    pagination: {
        currentPage: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

/**
 * Send a successful response
 * @param res Express Response object
 * @param message Success message
 * @param data Response data (optional)
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccess = <T = unknown>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
): Response => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data !== undefined && { data }),
    } as SuccessResponse<T>);
};

/**
 * Send a created response (201)
 * @param res Express Response object
 * @param message Success message
 * @param data Response data (optional)
 */
export const sendCreated = <T = unknown>(res: Response, message: string, data?: T): Response => {
    return sendSuccess(res, message, data, 201);
};

/**
 * Send an error response
 * @param res Express Response object
 * @param statusCode HTTP status code
 * @param error Error message or error object
 * @param details Additional error details (optional)
 */
export const sendError = (
    res: Response,
    statusCode: number,
    error: string,
    details?: unknown,
): Response => {
    const response: Record<string, unknown> = {
        success: false,
        error,
    };
    if (details !== undefined) {
        response.details = details;
    }
    return res.status(statusCode).json(response);
};

/**
 * Send a bad request error (400)
 * @param res Express Response object
 * @param error Error message
 * @param details Additional error details (optional)
 */
export const sendBadRequest = (res: Response, error: string, details?: unknown): Response => {
    return sendError(res, 400, error, details);
};

/**
 * Send an unauthorized error (401)
 * @param res Express Response object
 * @param error Error message (default: "Unauthorized")
 */
export const sendUnauthorized = (res: Response, error: string = "Unauthorized"): Response => {
    return sendError(res, 401, error);
};

/**
 * Send a forbidden error (403)
 * @param res Express Response object
 * @param error Error message (default: "Forbidden")
 */
export const sendForbidden = (res: Response, error: string = "Forbidden"): Response => {
    return sendError(res, 403, error);
};

/**
 * Send a not found error (404)
 * @param res Express Response object
 * @param error Error message (default: "Not Found")
 */
export const sendNotFound = (res: Response, error: string = "Not Found"): Response => {
    return sendError(res, 404, error);
};

/**
 * Send a conflict error (409)
 * @param res Express Response object
 * @param error Error message
 * @param details Additional error details (optional)
 */
export const sendConflict = (res: Response, error: string, details?: unknown): Response => {
    return sendError(res, 409, error, details);
};

/**
 * Send an unprocessable entity error (422)
 * @param res Express Response object
 * @param error Error message
 * @param details Additional error details (optional)
 */
export const sendValidationError = (res: Response, error: string, details?: unknown): Response => {
    return sendError(res, 422, error, details);
};

/**
 * Send an internal server error (500)
 * @param res Express Response object
 * @param error Error message (default: "Internal Server Error")
 */
export const sendInternalError = (
    res: Response,
    error: string = "Internal Server Error",
): Response => {
    return sendError(res, 500, error);
};

/**
 * Send a paginated response
 * @param res Express Response object
 * @param data Array of items
 * @param currentPage Current page number
 * @param pageSize Number of items per page
 * @param totalItems Total number of items
 * @param message Success message (optional)
 * @param statusCode HTTP status code (default: 200)
 */
export const sendPaginated = <T = unknown>(
    res: Response,
    data: T[],
    currentPage: number,
    pageSize: number,
    totalItems: number,
    message: string = "Data retrieved successfully",
    statusCode: number = 200,
): Response => {
    const totalPages = Math.ceil(totalItems / pageSize);

    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination: {
            currentPage,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
        },
    } as PaginatedResponse<T>);
};

/**
 * Handle validation errors from express-validator
 * @param res Express Response object
 * @param errors Array of validation errors
 */
export const sendValidationErrors = (
    res: Response,
    errors: Array<{ field?: string; msg: string; path?: string }>,
): Response => {
    const formattedErrors = errors.map((err) => ({
        field: err.path || err.field,
        message: err.msg,
    }));

    return sendValidationError(res, "Validation failed", formattedErrors);
};

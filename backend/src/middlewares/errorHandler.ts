import { Request, Response } from "express";

interface CustomError extends Error {
    status?: number;
    statusCode?: number;
}

const errorHandler = (err: CustomError, req: Request, res: Response) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[${new Date().toISOString()}] Error:`, {
        status,
        message,
        path: req.path,
        method: req.method,
    });

    res.status(status).json({
        error: {
            status,
            message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        },
    });
};

export default errorHandler;

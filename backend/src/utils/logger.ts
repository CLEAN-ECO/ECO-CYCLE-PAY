// Utility functions and helpers can be added here
// Example: logger, validators, formatters, etc.

export const logger = (message: string, level: "info" | "warn" | "error" = "info") => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

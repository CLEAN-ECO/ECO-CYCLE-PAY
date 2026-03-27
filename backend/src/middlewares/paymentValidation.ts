/**
 * Validation middleware for payment-related routes
 */

import { body, ValidationChain } from "express-validator";

export const validatePaymentCreation = (): ValidationChain[] => [
    // Validate amount
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
];

export const validatePaymentVerification = (): ValidationChain[] => [
    // Validate transactionId
    body("transactionId").isString().trim().notEmpty().withMessage("Transaction ID is required"),

    // Validate amount
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
];

export const validateWithdrawalRequest = (): ValidationChain[] => [
    // Validate amount
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
    // Validate PIN
    body("pin")
        .isInt({ max: 9999 })
        .withMessage("PIN must be a 4-digit number")
        .isLength({ min: 4, max: 4 })
        .withMessage("PIN must be exactly 4 digits"),
];

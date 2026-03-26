import { body, ValidationChain } from "express-validator";

/**
 * Validation for submitting waste
 */
export const validateWasteSubmission = (): ValidationChain[] => [
    body("waste_type")
        .notEmpty()
        .withMessage("Waste type is required")
        .isIn([
            "plastic",
            "paper",
            "metal",
            "beverage_cans",
            "cartons",
            "glass",
            "electronics",
            "organic",
            "mixed",
        ])
        .withMessage("Invalid waste type"),
    body("quantity")
        .notEmpty()
        .withMessage("Quantity is required")
        .isFloat({ min: 0.1 })
        .withMessage("Quantity must be at least 0.1 kg"),
    body("description").optional().isString().trim(),
];

/**
 * Validation for scheduling pickup
 */
export const validateSchedulePickup = (): ValidationChain[] => [
    body("collection_hub_id")
        .notEmpty()
        .withMessage("Collection hub ID is required")
        .isMongoId()
        .withMessage("Invalid collection hub ID"),
    body("scheduled_date")
        .notEmpty()
        .withMessage("Scheduled date is required")
        .isISO8601()
        .withMessage("Invalid date format"),
];

/**
 * Validation for withdrawal request
 */
export const validateWithdrawal = (): ValidationChain[] => [
    body("amount")
        .notEmpty()
        .withMessage("Amount is required")
        .isFloat({ min: 100 })
        .withMessage("Minimum withdrawal amount is ₦100"),
    body("bank_account")
        .notEmpty()
        .withMessage("Bank account is required")
        .matches(/^\d{10,}$/)
        .withMessage("Invalid bank account number"),
    body("bank_code")
        .notEmpty()
        .withMessage("Bank code is required")
        .isLength({ min: 3, max: 6 })
        .withMessage("Invalid bank code"),
];

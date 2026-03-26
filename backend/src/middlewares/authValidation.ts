import { body, ValidationChain } from "express-validator";

/**
 * Validation middleware for user signup (Step 1)
 * Validates: full_name, email, phone, password, confirm_password, role
 */
export const validateSignup = (): ValidationChain[] => [
    body("full_name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
    body("phone")
        .matches(/^\+?[\d\s\-()]+$/)
        .withMessage("Invalid phone number"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain uppercase, lowercase, and number"),
    body("confirm_password").notEmpty().withMessage("Confirm password is required"),
    body("role").isIn(["generator", "vendor", "ngo-hub"]).withMessage("Invalid role"),
];

/**
 * Validation middleware for email verification (Step 2)
 * Validates: email, verification_code
 */
export const validateVerifyEmail = (): ValidationChain[] => [
    body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
    body("verification_code")
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage("Verification code must be 6 digits"),
];

/**
 * Validation middleware for wallet setup (Step 3)
 * Validates: wallet_pin, confirm_wallet_pin, confirmed_words
 */
export const validateWalletSetup = (): ValidationChain[] => [
    body("wallet_pin")
        .matches(/^\d{4}$/)
        .withMessage("Wallet PIN must be exactly 4 digits"),
    body("confirm_wallet_pin")
        .matches(/^\d{4}$/)
        .withMessage("Confirm PIN must be exactly 4 digits"),
    body("confirmed_words").isArray({ min: 3, max: 3 }).withMessage("Must confirm exactly 3 words"),
    body("confirmed_words.*.index")
        .isInt({ min: 0, max: 11 })
        .withMessage("Word index must be between 0 and 11"),
    body("confirmed_words.*.word")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Each confirmed word must be a non-empty string"),
];

/**
 * Validation middleware for resending verification code
 * Validates: email
 */
export const validateResendVerification = (): ValidationChain[] => [
    body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
];

/**
 * Validation middleware for login
 * Validates: identifier (email or phone), password
 */
export const validateLogin = (): ValidationChain[] => [
    body("identifier")
        .trim()
        .notEmpty()
        .withMessage("Email or phone is required")
        .custom((value) => {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            const isPhone = /^\+?[\d\s\-()]+$/.test(value);
            if (!isEmail && !isPhone) {
                throw new Error("Must provide a valid email or phone number");
            }
            return true;
        }),
    body("password").notEmpty().withMessage("Password is required"),
];

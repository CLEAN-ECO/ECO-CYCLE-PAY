import { Router } from "express";
import {
    signup,
    verifyEmail,
    setupWallet,
    resendVerificationCode,
    login,
    logout,
} from "../controllers/auth";
import {
    validateSignup,
    validateVerifyEmail,
    validateWalletSetup,
    validateResendVerification,
    validateLogin,
} from "../middlewares/authValidation";
import { verifyTempToken } from "../middlewares/authMiddleware";

const authRouter = Router();

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Create a new user account (Step 1 of 3)
 *     description: |
 *       Register a new user with role-specific details. This is the first step of the signup flow.
 *       An OTP will be generated and sent to the provided email address.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - phone
 *               - password
 *               - confirm_password
 *               - role
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "John Doe"
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "+234 801 234 5678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *                 minLength: 8
 *                 description: "Must contain uppercase, lowercase, number, and be at least 8 characters"
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *               role:
 *                 type: string
 *                 enum: ["generator", "vendor", "ngo-hub"]
 *                 example: "generator"
 *               generator_subtype:
 *                 type: string
 *                 enum: ["Household", "Hotel", "School", "Event Center", "Restaurant", "Office", "Conference Center"]
 *                 example: "Household"
 *                 description: "Required if role is 'generator'"
 *               vendor_business_name:
 *                 type: string
 *                 example: "GreenRecycle Ltd"
 *                 description: "Required if role is 'vendor'"
 *               vendor_business_type:
 *                 type: string
 *                 example: "Recycler"
 *                 description: "Required if role is 'vendor'"
 *               vendor_location:
 *                 type: string
 *                 example: "Lagos, Nigeria"
 *                 description: "Required if role is 'vendor'"
 *               vendor_years:
 *                 type: number
 *                 example: 5
 *                 description: "Required if role is 'vendor'"
 *               ngo_hub_type:
 *                 type: string
 *                 enum: ["NGO", "Hub"]
 *                 example: "NGO"
 *                 description: "Required if role is 'ngo-hub'"
 *               ngo_name:
 *                 type: string
 *                 example: "Environmental Action Initiative"
 *                 description: "Required if ngo_hub_type is 'NGO'"
 *               ngo_registration:
 *                 type: string
 *                 example: "CAC/BN/000123"
 *                 description: "Required if ngo_hub_type is 'NGO'"
 *               ngo_years:
 *                 type: number
 *                 example: 10
 *                 description: "Required if ngo_hub_type is 'NGO'"
 *               ngo_focus:
 *                 type: string
 *                 example: "Waste Management & Recycling"
 *                 description: "Required if ngo_hub_type is 'NGO'"
 *               ngo_location:
 *                 type: string
 *                 example: "Lagos, Nigeria"
 *                 description: "Required if ngo_hub_type is 'NGO'"
 *               ngo_mission:
 *                 type: string
 *                 example: "To promote sustainable waste management practices"
 *                 description: "Required if ngo_hub_type is 'NGO'"
 *               hub_name:
 *                 type: string
 *                 example: "Lagos Central Hub"
 *                 description: "Required if ngo_hub_type is 'Hub'"
 *               hub_capacity:
 *                 type: number
 *                 example: 5000
 *                 description: "Daily capacity in kg/day. Required if ngo_hub_type is 'Hub'"
 *               hub_location:
 *                 type: string
 *                 example: "Ikoyi, Lagos"
 *                 description: "Required if ngo_hub_type is 'Hub'"
 *               hub_availability:
 *                 type: string
 *                 example: "Monday to Friday, 8am - 5pm"
 *                 description: "Required if ngo_hub_type is 'Hub'"
 *               hub_description:
 *                 type: string
 *                 example: "Modern collection and sorting facility"
 *                 description: "Optional if ngo_hub_type is 'Hub'"
 *     responses:
 *       200:
 *         description: Account created successfully. OTP sent to email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verification code sent to your email"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     otp:
 *                       type: string
 *                       description: "Only returned in development mode"
 *       400:
 *         description: Validation error or passwords don't match
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */
authRouter.post("/signup", validateSignup(), signup);

/**
 * @swagger
 * /api/v1/auth/verify:
 *   post:
 *     summary: Verify email with OTP (Step 2 of 3)
 *     description: |
 *       Verify the user's email address using the OTP sent in the signup step.
 *       Upon successful verification, a temporary token is provided for wallet setup.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verification_code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               verification_code:
 *                 type: string
 *                 example: "123456"
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Email verified successfully. Temporary token provided for wallet setup.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tempToken:
 *                       type: string
 *                       description: "Temporary JWT token for wallet setup (expires in 15 minutes)"
 *                     userId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     secretPhrase:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: "Only returned in development mode"
 *       400:
 *         description: Invalid or expired verification code
 *       401:
 *         description: Incorrect verification code
 *       500:
 *         description: Server error
 */
authRouter.post("/verify", validateVerifyEmail(), verifyEmail);

/**
 * @swagger
 * /api/v1/auth/wallet-setup:
 *   post:
 *     summary: Setup wallet with PIN and recovery phrase (Step 3 of 3)
 *     description: |
 *       Complete the signup process by setting up the wallet PIN and confirming recovery phrase words.
 *       This is the final step required to activate the user account.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wallet_pin
 *               - confirm_wallet_pin
 *               - confirmed_words
 *             properties:
 *               wallet_pin:
 *                 type: string
 *                 example: "1234"
 *                 minLength: 4
 *                 maxLength: 4
 *                 pattern: "^\\d{4}$"
 *                 description: "4-digit numeric PIN"
 *               confirm_wallet_pin:
 *                 type: string
 *                 example: "1234"
 *                 minLength: 4
 *                 maxLength: 4
 *                 description: "Must match wallet_pin"
 *               confirmed_words:
 *                 type: array
 *                 minItems: 3
 *                 maxItems: 3
 *                 items:
 *                   type: object
 *                   required:
 *                     - index
 *                     - word
 *                   properties:
 *                     index:
 *                       type: number
 *                       example: 0
 *                       description: "Index of the word in the recovery phrase (0-11)"
 *                     word:
 *                       type: string
 *                       example: "abandon"
 *                       description: "The actual word at that index"
 *                 example:
 *                   - { "index": 0, "word": "abandon" }
 *                   - { "index": 5, "word": "absolute" }
 *                   - { "index": 11, "word": "abstract" }
 *     responses:
 *       200:
 *         description: Wallet setup completed successfully. User account is now active.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wallet setup completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: "JWT authentication token (expires in 7 days)"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         role:
 *                           type: string
 *                         email_verified:
 *                           type: boolean
 *       400:
 *         description: Invalid PIN format or recovery phrase confirmation failed
 *       401:
 *         description: Unauthorized or incorrect recovery phrase words
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.post("/wallet-setup", verifyTempToken, validateWalletSetup(), setupWallet);

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     summary: Resend verification code to email
 *     description: |
 *       Resend the OTP to the user's email if they didn't receive it or it expired.
 *       The new code will expire in 10 minutes.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verification code resent to your email"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     otp:
 *                       type: string
 *                       description: "Only returned in development mode"
 *       400:
 *         description: No pending verification for this email
 *       500:
 *         description: Server error
 */
authRouter.post("/resend-verification", validateResendVerification(), resendVerificationCode);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login to EcoCycle Pay account
 *     description: |
 *       Authenticate user with email/phone and password.
 *       Returns JWT token for subsequent authenticated requests.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: "john@example.com"
 *                 description: "Email or phone number"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *                 description: "User password"
 *     responses:
 *       200:
 *         description: Login successful. JWT token provided for authenticated requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: "JWT authentication token (expires in 7 days)"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: ["generator", "vendor", "ngo-hub"]
 *                         email_verified:
 *                           type: boolean
 *       400:
 *         description: Validation error or missing required fields
 *       401:
 *         description: Invalid email/phone or password
 *       500:
 *         description: Server error
 */
authRouter.post("/login", validateLogin(), login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout from EcoCycle Pay account
 *     description: |
 *       Sends success response indicating logout. JWT token is invalidated on the client side.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       500:
 *         description: Server error
 */
authRouter.post("/logout", logout);

export default authRouter;

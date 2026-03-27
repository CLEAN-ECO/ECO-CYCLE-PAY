import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { Types } from "mongoose";
import User from "../models/user";
import Wallet from "../models/wallet";
import Referral from "../models/referral";
import { logger } from "../utils/logger";
import {
    sendSuccess,
    sendBadRequest,
    sendConflict,
    sendNotFound,
    sendUnauthorized,
    sendValidationErrors,
    sendInternalError,
} from "../utils/responseHelper";

const { JWT_SECRET } = process.env;

interface VerificationData {
    code: string;
    email: string;
    userData: Record<string, unknown>;
    expiresAt: number;
}

interface WalletData {
    userId: string;
    secretPhrase: string[];
    expiresAt: number;
}

interface UserPayload {
    userId: string;
    email: string;
}

// In-memory store for verification codes and wallet setup (in production, use Redis)
const verificationStore: Map<string, VerificationData> = new Map();
const walletSetupStore: Map<string, WalletData> = new Map();

// Generate a random OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a random recovery phrase (in production, use a proper BIP39 library)
const generateSecretPhrase = (): string[] => {
    const words = [
        "abandon",
        "ability",
        "able",
        "about",
        "above",
        "abroad",
        "absence",
        "absolute",
        "absorb",
        "abstract",
        "absurd",
        "access",
        "accident",
        "account",
        "accuse",
        "achieve",
        "acid",
        "acoustic",
        "acquire",
        "across",
        "act",
        "action",
        "active",
        "activity",
        "actor",
        "actress",
        "actual",
        "actuate",
        "acuate",
        "acute",
        "acutely",
    ];
    const phrase: string[] = [];
    for (let i = 0; i < 12; i++) {
        phrase.push(words[Math.floor(Math.random() * words.length)]);
    }
    return phrase;
};

export const signup = async (req: Request, res: Response): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationErrors(res, errors.array());
        }

        const {
            full_name,
            email,
            phone,
            password,
            confirm_password,
            role,
            referral_code,
            generator_subtype,
            vendor_business_name,
            vendor_business_type,
            vendor_location,
            vendor_years,
            ngo_hub_type,
            ngo_name,
            ngo_registration,
            ngo_years,
            ngo_focus,
            ngo_location,
            ngo_mission,
            hub_name,
            hub_capacity,
            hub_location,
            hub_availability,
            hub_description,
        } = req.body as Record<string, unknown>;

        // Verify password match
        if (password !== confirm_password) {
            return sendBadRequest(res, "Passwords do not match");
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: (email as string).toLowerCase() });
        if (existingUser) {
            return sendConflict(res, "Email already registered");
        }

        // Validate referral code if provided
        let referredById: string | undefined;
        if (referral_code) {
            const referralDoc = await Referral.findOne({
                referral_code: (referral_code as string).toUpperCase(),
                is_active: true,
            });

            if (!referralDoc) {
                return sendBadRequest(res, "Invalid or inactive referral code");
            }

            referredById = referralDoc.user.toString();
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password as string, salt);

        // Prepare user data
        const userData: Record<string, unknown> = {
            full_name: (full_name as string).trim(),
            email: (email as string).toLowerCase(),
            phone,
            password: hashedPassword,
            role,
            email_verified: false,
            ...(referredById && { referred_by: new Types.ObjectId(referredById) }),
        };

        // Add role-specific fields
        if (role === "generator" && generator_subtype) {
            userData.generator_subtype = generator_subtype;
        } else if (role === "vendor") {
            userData.vendor_business_name = vendor_business_name;
            userData.vendor_business_type = vendor_business_type;
            userData.vendor_location = vendor_location;
            userData.vendor_years = vendor_years;
        } else if (role === "ngo-hub") {
            userData.ngo_hub_type = ngo_hub_type;
            if (ngo_hub_type === "NGO") {
                userData.ngo_name = ngo_name;
                userData.ngo_registration = ngo_registration;
                userData.ngo_years = ngo_years;
                userData.ngo_focus = ngo_focus;
                userData.ngo_location = ngo_location;
                userData.ngo_mission = ngo_mission;
            } else if (ngo_hub_type === "Hub") {
                userData.hub_name = hub_name;
                userData.hub_capacity = hub_capacity;
                userData.hub_location = hub_location;
                userData.hub_availability = hub_availability;
                userData.hub_description = hub_description;
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store verification data temporarily
        verificationStore.set(email as string, {
            code: otp,
            email: email as string,
            userData,
            expiresAt: expiryTime,
        });

        // In production, send OTP via email
        logger(`OTP generated for ${email}: ${otp}`, "info");

        return sendSuccess(res, "Verification code sent to your email", {
            email,
            // In development, return OTP for testing (remove in production)
            ...(process.env.NODE_ENV === "development" && { otp }),
        });
    } catch (error) {
        logger(`Signup error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to create account",
        );
    }
};

/**
 * Step 2: Verify Email with OTP
 * Validates OTP and creates user account
 */
export const verifyEmail = async (req: Request, res: Response): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationErrors(res, errors.array());
        }

        const { email, verification_code } = req.body as Record<string, unknown>;

        // Check if verification data exists
        const verificationData = verificationStore.get(email as string);
        if (!verificationData) {
            return sendBadRequest(res, "No pending verification for this email");
        }

        // Check if OTP expired
        if (Date.now() > verificationData.expiresAt) {
            verificationStore.delete(email as string);
            return sendBadRequest(res, "Verification code has expired");
        }

        // Verify OTP
        if (verification_code !== verificationData.code) {
            return sendUnauthorized(res, "Invalid verification code");
        }

        // Create user in database
        const user = new User(verificationData.userData);
        await user.save();

        logger(`User verified: ${email}`, "info");

        // Create wallet for user
        const wallet = new Wallet({
            user: user._id,
            balance: 0,
            total_earned: 0,
            total_withdrawn: 0,
        });
        await wallet.save();

        // Generate unique referral code
        const referralCode = `ref${user._id.toString().slice(-12).toUpperCase()}`;
        const referralLink = `${process.env.FRONTEND_URL || "https://ecocyclepay.com"}/signup?ref=${referralCode}`;

        // Create referral for user
        const referral = new Referral({
            user: user._id,
            referral_code: referralCode,
            referral_link: referralLink,
            bonus_amount: 500,
        });
        await referral.save();

        // Apply referral bonus if user was referred
        if (user.referred_by) {
            const referrerWallet = await Wallet.findOne({ user: user.referred_by });
            if (referrerWallet) {
                referrerWallet.balance += 500;
                referrerWallet.total_earned += 500;
                referrerWallet.last_transaction_date = new Date();
                await referrerWallet.save();

                // Update referrer's referral stats
                await Referral.updateOne(
                    { user: user.referred_by },
                    {
                        $inc: { successful_referrals: 1, total_earnings: 500 },
                    },
                );

                logger(`Referral bonus applied: ${user.referred_by} -> ${user._id}`, "info");
            }
        }

        // Generate temporary token for wallet setup
        const tempToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" },
        );

        // Generate secret phrase
        const secretPhrase = generateSecretPhrase();
        const phraseExpiryTime = Date.now() + 60 * 60 * 1000; // 1 hour

        // Generate 3 random positions to confirm (0-11)
        const confirmPositions: number[] = [];
        while (confirmPositions.length < 3) {
            const pos = Math.floor(Math.random() * 12);
            if (!confirmPositions.includes(pos)) {
                confirmPositions.push(pos);
            }
        }
        confirmPositions.sort((a, b) => a - b);

        // Store wallet setup data temporarily
        walletSetupStore.set(user._id.toString(), {
            userId: user._id.toString(),
            secretPhrase,
            expiresAt: phraseExpiryTime,
        });

        // Clear verification store
        verificationStore.delete(email as string);

        return sendSuccess(res, "Email verified successfully", {
            tempToken,
            userId: user._id,
            confirmPositions,
            // In development, return secret phrase for testing (remove in production)
            ...(process.env.NODE_ENV === "development" && { phrase: secretPhrase }),
        });
    } catch (error) {
        logger(`Email verification error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to verify email",
        );
    }
};

/**
 * Step 3: Setup Wallet with PIN and Recovery Phrase Confirmation
 * Finalizes user registration by setting wallet PIN and confirming recovery phrase
 */
export const setupWallet = async (req: Request, res: Response): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationErrors(res, errors.array());
        }

        const userPayload = (req as unknown as { user?: UserPayload }).user;
        if (!userPayload) {
            return sendUnauthorized(res);
        }
        const { userId } = userPayload;
        const { wallet_pin, confirm_wallet_pin, confirmed_words } = req.body as Record<
            string,
            unknown
        >;

        // Verify PIN match
        if (wallet_pin !== confirm_wallet_pin) {
            return sendBadRequest(res, "Wallet PINs do not match");
        }

        // Verify PIN is 4 digits
        if (!/^\d{4}$/.test(wallet_pin as string)) {
            return sendBadRequest(res, "Wallet PIN must be exactly 4 digits");
        }

        // Get wallet setup data
        const walletData = walletSetupStore.get(userId);
        if (!walletData) {
            return sendBadRequest(res, "No pending wallet setup or session expired");
        }

        // Check if session expired
        if (Date.now() > walletData.expiresAt) {
            walletSetupStore.delete(userId);
            return sendBadRequest(res, "Wallet setup session has expired");
        }

        // Verify confirmed words match secret phrase
        if (!Array.isArray(confirmed_words) || confirmed_words.length !== 3) {
            return sendBadRequest(res, "Must confirm exactly 3 words from your recovery phrase");
        }

        // Check if confirmed words are correct (expecting indices and words)
        const confirmationValid = confirmed_words.every((item) => {
            const typedItem = item as Record<string, unknown>;
            if (typedItem.index === undefined || typedItem.word === undefined) {
                return false;
            }
            return walletData.secretPhrase[typedItem.index as number] === typedItem.word;
        });

        if (!confirmationValid) {
            return sendUnauthorized(res, "Recovery phrase confirmation failed");
        }

        // Hash wallet PIN
        const pinSalt = await bcryptjs.genSalt(10);
        const hashedPin = await bcryptjs.hash(wallet_pin as string, pinSalt);

        // Update user with wallet PIN and secret phrase
        const user = await User.findByIdAndUpdate(
            userId,
            {
                wallet_pin: hashedPin,
                secret_phrase: walletData.secretPhrase,
                email_verified: true,
            },
            { returnDocument: "after" },
        );

        if (!user) {
            return sendNotFound(res, "User not found");
        }

        logger(`Wallet setup completed for user: ${userId}`, "info");

        // Clear wallet setup store
        walletSetupStore.delete(userId);

        // Generate final JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET as string,
            { expiresIn: "1d" },
        );

        return sendSuccess(res, "Wallet setup completed successfully", {
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        logger(`Wallet setup error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to setup wallet",
        );
    }
};

/**
 * Resend Verification Code
 * Resends OTP to email for users who didn't receive it
 */
export const resendVerificationCode = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email } = req.body as Record<string, unknown>;

        if (!email) {
            return sendBadRequest(res, "Email is required");
        }

        const verificationData = verificationStore.get(email as string);
        if (!verificationData) {
            return sendBadRequest(res, "No pending verification for this email");
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiryTime = Date.now() + 10 * 60 * 1000;

        // Update verification store
        verificationData.code = otp;
        verificationData.expiresAt = expiryTime;
        verificationStore.set(email as string, verificationData);

        logger(`OTP resent for ${email}: ${otp}`, "info");

        return sendSuccess(res, "Verification code resent to your email", {
            email,
            ...(process.env.NODE_ENV === "development" && { otp }),
        });
    } catch (error) {
        logger(`Resend verification error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to resend verification code",
        );
    }
};

/**
 * Login
 * Authenticates user with email/phone and password
 * Returns JWT token for subsequent requests
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationErrors(res, errors.array());
        }

        const { identifier, password } = req.body as Record<string, string>;

        // Find user by email or phone (explicitly select password field)
        const user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { phone: identifier.trim() }],
        }).select("+password");

        if (!user) {
            return sendUnauthorized(res, "Invalid email/phone or password");
        }

        // Verify password
        const isPasswordValid = await bcryptjs.compare(password as string, user.password);
        if (!isPasswordValid) {
            return sendUnauthorized(res, "Invalid email/phone or password");
        }

        logger(`User logged in: ${user.email}`, "info");

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET environment variable is not set");
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
            },
            jwtSecret,
            { expiresIn: "7d" },
        );

        return sendSuccess(res, "Login successful", {
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        logger(`Login error: ${error}`, "error");
        return sendInternalError(res, error instanceof Error ? error.message : "Failed to login");
    }
};

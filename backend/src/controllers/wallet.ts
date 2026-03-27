import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Wallet from "../models/wallet";
import Transaction, { ITransaction } from "../models/transaction";
import Referral from "../models/referral";
import Activity from "../models/activity";
import {
    sendSuccess,
    sendBadRequest,
    sendUnauthorized,
    sendNotFound,
    sendValidationErrors,
    sendInternalError,
} from "../utils/responseHelper";
import { logger } from "../utils/logger";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { ObjectId } from "mongoose";

/**
 * Get or create user's referral link
 */
export const getReferralLink = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        // Check if referral exists
        let referral = await Referral.findOne({ user_id: userId });

        // Create if doesn't exist
        if (!referral) {
            const referralCode = `REF${userId.toString().slice(-12).toUpperCase()}`;
            const referralLink = `${process.env.FRONTEND_URL || "https://ecocyclepay.com"}/signup?ref=${referralCode}`;

            referral = new Referral({
                user_id: userId,
                referral_code: referralCode,
                referral_link: referralLink,
            });

            await referral.save();
            logger(`Referral link created for user: ${userId}`, "info");
        }

        return sendSuccess(res, "Referral link retrieved successfully", {
            referral_code: referral.code,
            referral_link: referral.link,
            clicks: referral.clicks,
            successful_referrals: referral.successful_referrals,
            total_earnings: referral.total_earnings,
        });
    } catch (error) {
        logger(`Get referral error: ${error}`, "error");
        return sendInternalError(res, "Failed to retrieve referral link");
    }
};

/**
 * Track referral link click
 */
export const trackReferralClick = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { code } = req.params;

        const referral = await Referral.findOneAndUpdate(
            { code: (code as string).toUpperCase() },
            { $inc: { clicks: 1 } },
            { new: true },
        );

        if (!referral) {
            return sendNotFound(res, "Invalid referral code");
        }

        logger(`Referral click tracked: ${code}`, "info");
        return sendSuccess(res, "Click tracked", { clicks: referral.clicks });
    } catch (error) {
        logger(`Track click error: ${error}`, "error");
        return sendInternalError(res, "Failed to track click");
    }
};

/**
 * Request withdrawal from wallet
 */
export const requestWithdrawal = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationErrors(res, errors.array());
        }

        const userId = req.user?.userId;
        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        const { amount, bank_account, bank_code } = req.body as Record<string, unknown>;

        // Get wallet
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return sendNotFound(res, "Wallet not found");
        }

        // Validate sufficient balance
        if (wallet.balance < (amount as number)) {
            return sendBadRequest(res, "Insufficient balance");
        }

        // Deduct from wallet
        const previousBalance = wallet.balance;
        wallet.balance -= amount as number;
        wallet.total_withdrawn += amount as number;
        wallet.last_transaction_date = new Date();
        await wallet.save();

        // Create transaction
        const transaction = await Transaction.create({
            user: userId,
            amount: amount as number,
            type: "withdrawal",
            status: "completed",
            description: "Withdrawal to bank account",
            balance_before: previousBalance,
            balance_after: wallet.balance,
            completed_at: new Date(),
            metadata: {
                bank_account,
                bank_code,
            },
        });

        // Log activity
        await Activity.create({
            user: userId,
            type: "withdrawal",
            title: "Withdrawal completed",
            description: "Your wallet payout was transferred successfully.",
            status: "completed",
            amount: amount as number,
            reference_id: transaction._id.toString(),
        });

        logger(`Withdrawal processed: ${amount} for user ${userId}`, "info");

        return sendSuccess(res, "Withdrawal processed successfully", {
            transaction_id: transaction._id,
            amount: amount as number,
            new_balance: wallet.balance,
            status: "completed",
        });
    } catch (error) {
        logger(`Withdrawal error: ${error}`, "error");
        return sendInternalError(res, "Failed to process withdrawal");
    }
};

/**
 * Get transaction history
 */
export const getTransactionHistory = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find({ user_id: userId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .select("amount type status description created_at completed_at")
            .lean();

        const total = await Transaction.countDocuments({ user_id: userId });

        // Format transactions for display
        const formattedTransactions = transactions.map((tx) => ({
            id: (tx as ITransaction | null)?._id,
            amount: `₦ ${tx.amount.toLocaleString()}`,
            type:
                tx.type === "crediting"
                    ? "Recycling payout"
                    : tx.type === "withdrawal"
                      ? "Withdrawal"
                      : tx.type === "referral_bonus"
                        ? "Referral bonus"
                        : tx.type,
            status: tx.status,
            description: tx.description,
            date: new Date(tx.created_at).toLocaleDateString(),
        }));

        return sendSuccess(res, "Transaction history retrieved", {
            transactions: formattedTransactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger(`Get transactions error: ${error}`, "error");
        return sendInternalError(res, "Failed to retrieve transaction history");
    }
};

/**
 * Apply referral bonus when new user signs up with referral code
 */
export const applyReferralBonus = async (
    referrerUserId: ObjectId,
    referredUserId: ObjectId,
): Promise<void> => {
    try {
        // Update referral record
        const referral = await Referral.findOneAndUpdate(
            { user_id: referrerUserId },
            {
                $inc: { successful_referrals: 1, total_earnings: 500 },
            },
            { new: true },
        );

        if (!referral) return;

        // Credit referrer's wallet
        const wallet = await Wallet.findOne({ userId: referrerUserId });
        if (wallet) {
            const previousBalance = wallet.balance;
            const bonusAmount = 500; // ₦500 referral bonus

            wallet.balance += bonusAmount;
            wallet.total_earned += bonusAmount;
            await wallet.save();

            // Create transaction
            await Transaction.create({
                user: referrerUserId,
                amount: bonusAmount,
                type: "referral_bonus",
                status: "completed",
                description: "Referral bonus from new signup",
                reference: referredUserId.toString(),
                balance_before: previousBalance,
                balance_after: wallet.balance,
                completed_at: new Date(),
            });

            // Log activity
            await Activity.create({
                user: referrerUserId,
                type: "collection_accepted",
                title: "Referral bonus earned",
                description: `You earned ₦${bonusAmount} from a successful referral`,
                status: "completed",
                amount: bonusAmount,
            });
        }

        logger(`Referral bonus applied: ${referrerUserId} -> ${referredUserId}`, "info");
    } catch (error) {
        logger(`Apply referral bonus error: ${error}`, "error");
    }
};

/**
 * Get wallet summary
 */
export const getWalletSummary = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        // Get wallet
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId });
            await wallet.save();
        }

        // Get recent transactions
        const recentTransactions = await Transaction.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(3)
            .select("amount type description created_at")
            .lean();

        const formattedTransactions = recentTransactions.map((tx) => ({
            amount: `₦ ${tx.amount.toLocaleString()}`,
            type:
                tx.type === "crediting"
                    ? "Recycling payout"
                    : tx.type === "withdrawal"
                      ? "Withdrawal"
                      : tx.type === "referral_bonus"
                        ? "Referral bonus"
                        : tx.type,
            description: tx.description,
            date: new Date(tx.created_at).toLocaleDateString(),
        }));

        return sendSuccess(res, "Wallet summary retrieved", {
            balance: wallet.balance,
            total_earned: wallet.total_earned,
            total_withdrawn: wallet.total_withdrawn,
            pending_balance: wallet.balance,
            recent_transactions: formattedTransactions,
            wallet_id: `ECP-${userId.toString().slice(-8).toUpperCase()}`,
        });
    } catch (error) {
        logger(`Get wallet summary error: ${error}`, "error");
        return sendInternalError(res, "Failed to retrieve wallet summary");
    }
};

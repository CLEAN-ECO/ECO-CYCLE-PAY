import { Response } from "express";
import User from "../models/user";
import Wallet from "../models/wallet";
import Activity from "../models/activity";
import Pickup, { IPickup } from "../models/pickup";
// import WasteSupply, { IWasteSupply } from "../models/wasteSupply";
import {
    sendSuccess,
    sendUnauthorized,
    sendNotFound,
    sendInternalError,
} from "../utils/responseHelper";
import { logger } from "../utils/logger";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import Transaction, { ITransaction } from "../models/transaction";
import WasteSubmission, { IWasteSubmission } from "../models/wasteSubmission";

/**
 * Get dashboard data based on user role
 * Returns different data for generator, vendor, and ngo-hub roles
 */
export const getDashboardData = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    logger(`Dashboard request from user ${req.user?.userId}`, "info");
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return sendNotFound(res, "User not found");
        }

        // Get wallet details
        const wallet = await Wallet.findOne({ user: userId });

        // Get pickups based on user role
        let pickups: IPickup[] = [];
        if (user.role === "generator") {
            pickups = await Pickup.find({ requester: userId }).lean();
        } else if (user.role === "ngo-hub") {
            pickups = await Pickup.find({ collector: userId }).lean();
        }

        // Get waste submission uploads (generators can submit)
        const uploads = await WasteSubmission.find({ user: userId }).lean();

        // Get transactions (from Activity model)
        const transactions = await Transaction.find({ user: userId })
            .sort({ created_at: -1 })
            .lean();

        // Dashboard data response
        const dashboardData = {
            user: {
                id: user._id,
                fullName: user.full_name,
                role: user.role,
            },
            wallet: {
                balance: wallet?.balance || 0,
            },
            pickups: pickups.map((p: IPickup) => ({
                userId: user.role === "generator" ? p.requester : p.collector,
                wasteType: p.waste_type,
                quantity: p.quantity,
                location: p.pickup_location,
                status: p.status,
                createdAt: p.created_at,
            })),
            uploads: uploads.map((u: IWasteSubmission) => ({
                userId: u.user,
                wasteType: u.waste_type,
                quantity: u.quantity,
                location: u.location,
                status: u.status,
                createdAt: u.created_at,
            })),
            transactions: transactions.map((t: ITransaction) => ({
                userId: t.user,
                type: t.type,
                amount: t.amount,
                status: t.status,
                createdAt: t.created_at,
            })),
        };

        logger(
            `Dashboard data for user ${userId} (${user.role}): pickups=${dashboardData.pickups.length}, uploads=${dashboardData.uploads.length}, transactions=${dashboardData.transactions.length}`,
            "info",
        );
        return sendSuccess(res, "Dashboard data retrieved successfully", dashboardData);
    } catch (error) {
        logger(`Dashboard error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to retrieve dashboard data",
        );
    }
};

/**
 * Get user activities with pagination
 */
export const getActivities = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const userId = req.user?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        const activities = await Activity.find({ userId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Activity.countDocuments({ userId });

        return sendSuccess(res, "Activities retrieved successfully", {
            activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger(`Get activities error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to retrieve activities",
        );
    }
};

/**
 * Get wallet details
 */
export const getWallet = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        let wallet = await Wallet.findOne({ userId });

        // Create wallet if it doesn't exist
        if (!wallet) {
            wallet = new Wallet({ userId });
            await wallet.save();
        }

        return sendSuccess(res, "Wallet retrieved successfully", {
            balance: wallet.balance,
            total_earned: wallet.total_earned,
            total_withdrawn: wallet.total_withdrawn,
            last_transaction_date: wallet.last_transaction_date,
        });
    } catch (error) {
        logger(`Get wallet error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to retrieve wallet",
        );
    }
};

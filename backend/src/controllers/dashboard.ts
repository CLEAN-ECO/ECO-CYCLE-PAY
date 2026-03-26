import { Response } from "express";
import User from "../models/user";
import Wallet, { IWallet } from "../models/wallet";
import Activity from "../models/activity";
import Order from "../models/order";
import Pickup from "../models/pickup";
import WasteSupply from "../models/wasteSupply";
import {
    sendSuccess,
    sendUnauthorized,
    sendNotFound,
    sendInternalError,
} from "../utils/responseHelper";
import { logger } from "../utils/logger";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { ObjectId } from "mongoose";

/**
 * Get dashboard data based on user role
 * Returns different data for generator, vendor, and ngo-hub roles
 */
export const getDashboardData = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
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
        const wallet = await Wallet.findOne({ userId });

        // Get recent activities (last 5)
        const activities = await Activity.find({ userId }).sort({ created_at: -1 }).limit(5).lean();

        // Role-specific dashboard data
        let dashboardData: Record<string, unknown> = {
            user: {
                name: user.full_name,
                email: user.email,
                role: user.role,
            },
            wallet: wallet
                ? {
                      balance: wallet.balance,
                      total_earned: wallet.total_earned,
                      total_withdrawn: wallet.total_withdrawn,
                  }
                : {
                      balance: 0,
                      total_earned: 0,
                      total_withdrawn: 0,
                  },
            recent_activities: activities.map((activity) => ({
                title: activity.title,
                description: activity.description,
                status: activity.status,
                created_at: activity.created_at,
            })),
        };

        // Add role-specific data
        if (user.role === "generator") {
            dashboardData = await getGeneratorDashboard(userId, wallet, dashboardData);
        } else if (user.role === "vendor") {
            dashboardData = await getVendorDashboard(userId, dashboardData);
        } else if (user.role === "ngo-hub") {
            dashboardData = await getNGOHubDashboard(userId, dashboardData);
        }

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
 * Generator-specific dashboard data
 */
async function getGeneratorDashboard(
    userId: ObjectId,
    wallet: IWallet | null,
    baseData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const pickupRequests = await Pickup.countDocuments({
        requester_id: userId,
        status: { $in: ["requested", "accepted", "scheduled"] },
    });

    const wasteListings = await WasteSupply.countDocuments({
        generator_id: userId,
        status: "available",
    });

    const totalCollected = await WasteSupply.aggregate([
        { $match: { generator_id: userId, status: "sold_out" } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);

    // Calculate trend (dummy calculation - compare with previous week)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekEarnings = await Activity.aggregate([
        {
            $match: {
                userId: userId,
                created_at: { $gte: weekAgo },
                type: { $in: ["withdrawal", "order_approved"] },
            },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return {
        ...baseData,
        stats: {
            active_pickups: pickupRequests,
            available_waste: wasteListings,
            total_collected_kg: totalCollected[0]?.total || 0,
        },
        wallet_trend: wallet
            ? ((weekEarnings[0]?.total || 0) / (wallet.total_earned || 1)) * 100
            : 0,
    };
}

/**
 * Vendor-specific dashboard data
 */
async function getVendorDashboard(
    userId: ObjectId,
    baseData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const ordersReceived = await Order.countDocuments({
        vendor_id: userId,
    });

    const pendingOrders = await Order.countDocuments({
        vendor_id: userId,
        status: "pending",
    });

    const totalOrderValue = await Order.aggregate([
        { $match: { vendor_id: userId, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$estimated_value" } } },
    ]);

    const availableWaste = await WasteSupply.aggregate([
        { $match: { status: "available" } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);

    return {
        ...baseData,
        stats: {
            orders_received: ordersReceived,
            pending_orders: pendingOrders,
            available_waste_supply_kg: availableWaste[0]?.total || 0,
            total_order_value: totalOrderValue[0]?.total || 0,
        },
    };
}

/**
 * NGO/Hub-specific dashboard data
 */
async function getNGOHubDashboard(
    userId: ObjectId,
    baseData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const totalCollected = await Pickup.aggregate([
        {
            $match: {
                collector_id: userId,
                status: "completed",
            },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);

    const activePickups = await Pickup.countDocuments({
        collector_id: userId,
        status: { $in: ["accepted", "scheduled", "in_transit"] },
    });

    const plasticCollected = await Pickup.aggregate([
        {
            $match: {
                collector_id: userId,
                waste_type: "plastic",
                status: "completed",
            },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);

    const earnings = await Activity.aggregate([
        {
            $match: {
                userId: userId,
                type: "collection_accepted",
            },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const activeRequests = await Pickup.countDocuments({
        collector_id: userId,
        status: "requested",
    });

    return {
        ...baseData,
        stats: {
            total_waste_collected_kg: totalCollected[0]?.total || 0,
            active_pickups: activePickups,
            plastic_collected_kg: plasticCollected[0]?.total || 0,
            total_earnings: earnings[0]?.total || 0,
            active_requests: activeRequests,
        },
    };
}

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

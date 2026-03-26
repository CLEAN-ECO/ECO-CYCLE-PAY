import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { ObjectId } from "mongoose";
import WasteSubmission from "../models/wasteSubmission";
import CollectionHub, { ICollectionHub } from "../models/collectionHub";
import Activity from "../models/activity";
import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import {
    sendSuccess,
    sendCreated,
    sendBadRequest,
    sendUnauthorized,
    sendNotFound,
    sendValidationErrors,
    sendInternalError,
} from "../utils/responseHelper";
import { logger } from "../utils/logger";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// Pricing for different waste types (₦ per kg)
const WASTE_PRICING: Record<string, number> = {
    plastic: 150,
    paper: 50,
    metal: 200,
    beverage_cans: 250,
    cartons: 40,
    glass: 80,
    electronics: 500,
    organic: 20,
    mixed: 100,
};

/**
 * Get available waste categories with pricing
 */
export const getWasteCategories = async (req: Request, res: Response): Promise<Response> => {
    try {
        const categories = Object.entries(WASTE_PRICING).map(([type, pricePerKg]) => ({
            type,
            label: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
            price_per_kg: pricePerKg,
        }));

        return sendSuccess(res, "Waste categories retrieved successfully", { categories });
    } catch (error) {
        logger(`Get categories error: ${error}`, "error");
        return sendInternalError(res, "Failed to retrieve categories");
    }
};

/**
 * Submit waste for processing
 */
export const submitWaste = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationErrors(res, errors.array());
        }

        const userId = req.user?.userId;
        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        const { waste_type, quantity, description } = req.body as Record<string, unknown>;

        // Validate waste type
        if (!WASTE_PRICING[waste_type as string]) {
            return sendBadRequest(res, "Invalid waste type");
        }

        // Calculate estimated value
        const pricePerKg = WASTE_PRICING[waste_type as string];
        const estimatedValue = (quantity as number) * pricePerKg;

        // Create waste submission
        const submission = new WasteSubmission({
            user_id: userId,
            waste_type: waste_type as string,
            quantity: quantity as number,
            estimated_value: estimatedValue,
            description,
            status: "submitted",
        });

        await submission.save();

        // Log activity
        await Activity.create({
            user: userId,
            type: "upload_waste",
            title: "Uploaded waste for review",
            description: "Awaiting verification from the nearest collection team.",
            status: "pending",
            amount: estimatedValue,
            quantity: quantity as number,
            reference_id: submission._id.toString(),
        });

        logger(`Waste submitted: ${submission._id} by user ${userId}`, "info");

        return sendCreated(res, "Waste submitted successfully", {
            submission_id: submission._id,
            waste_type,
            quantity,
            estimated_value: estimatedValue,
            status: "submitted",
        });
    } catch (error) {
        logger(`Submit waste error: ${error}`, "error");
        return sendInternalError(res, "Failed to submit waste");
    }
};

/**
 * Get submission status and verification details
 */
export const getSubmissionStatus = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        const submissionId = req.params.id;

        const submission = await WasteSubmission.findOne({
            _id: submissionId,
            user_id: userId,
        }).populate("collection_hub");

        if (!submission) {
            return sendNotFound(res, "Submission not found");
        }

        return sendSuccess(res, "Submission status retrieved", {
            submission_id: submission._id,
            status: submission.status,
            waste_type: submission.waste_type,
            quantity: submission.quantity,
            estimated_value: submission.estimated_value,
            collection_hub:
                (submission.collection_hub as unknown as ICollectionHub)?.name ||
                "Pending assignment",
            submitted_at: submission.submitted_at,
            verified_at: submission.verified_at,
            pickup_scheduled_date: submission.pickup_scheduled_date,
        });
    } catch (error) {
        logger(`Get status error: ${error}`, "error");
        return sendInternalError(res, "Failed to retrieve submission status");
    }
};

/**
 * Get nearest collection hubs
 */
export const getNearestHubs = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { waste_type } = req.query;

        const query: Record<string, unknown> = { is_active: true };

        if (waste_type) {
            query.accepted_waste_types = waste_type;
        }

        const hubs = await CollectionHub.find(query)
            .select("name location address phone operating_hours accepted_waste_types capacity")
            .limit(10)
            .lean();

        return sendSuccess(res, "Collection hubs retrieved successfully", {
            hubs,
            total: hubs.length,
        });
    } catch (error) {
        logger(`Get hubs error: ${error}`, "error");
        return sendInternalError(res, "Failed to retrieve collection hubs");
    }
};

/**
 * Assign hub to submission and create pickup request
 */
export const assignHubAndSchedulePickup = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        const submissionId = req.params.id;
        const { collection_hub_id, scheduled_date } = req.body as Record<string, unknown>;

        // Find submission
        const submission = await WasteSubmission.findOne({
            _id: submissionId,
            user_id: userId,
        });

        if (!submission) {
            return sendNotFound(res, "Submission not found");
        }

        // Verify hub exists
        const hub = await CollectionHub.findById(collection_hub_id);
        if (!hub) {
            return sendNotFound(res, "Collection hub not found");
        }

        // Update submission
        submission.collection_hub = collection_hub_id as ObjectId;
        submission.pickup_scheduled_date = new Date(scheduled_date as string);
        submission.status = "approved";
        await submission.save();

        // Create pickup activity
        await Activity.create({
            user: userId,
            type: "pickup_request",
            title: "Pickup request created",
            description: "A pickup slot has been scheduled for your recyclable items.",
            status: "scheduled",
            reference_id: submission._id.toString(),
        });

        logger(`Pickup scheduled for submission: ${submissionId}`, "info");

        return sendSuccess(res, "Pickup scheduled successfully", {
            submission_id: submission._id,
            collection_hub: hub.name,
            pickup_scheduled_date: submission.pickup_scheduled_date,
            estimated_value: submission.estimated_value,
        });
    } catch (error) {
        logger(`Schedule pickup error: ${error}`, "error");
        return sendInternalError(res, "Failed to schedule pickup");
    }
};

/**
 * Verify and approve waste submission (mark as completed)
 * This is called after admin verification
 */
export const verifyAndApproveWaste = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const submissionId = req.params.id;
        // Note: This should be admin-only in production

        const submission = await WasteSubmission.findByIdAndUpdate(
            submissionId,
            {
                status: "verified",
                verified_at: new Date(),
            },
            { new: true },
        );

        if (!submission) {
            return sendNotFound(res, "Submission not found");
        }

        // Credit wallet
        const wallet = await Wallet.findOne({ userId: submission.user });
        if (wallet) {
            const previousBalance = wallet.balance;
            wallet.balance += submission.estimated_value;
            wallet.total_earned += submission.estimated_value;
            wallet.last_transaction_date = new Date();
            await wallet.save();

            // Create transaction record
            await Transaction.create({
                user: submission.user,
                amount: submission.estimated_value,
                type: "crediting",
                status: "completed",
                description: `Crediting for ${submission.waste_type} submission`,
                reference: submission._id.toString(),
                balance_before: previousBalance,
                balance_after: wallet.balance,
                completed_at: new Date(),
            });
        }

        // Update activity
        await Activity.updateOne(
            { reference_id: submissionId.toString() },
            { status: "completed" },
        );

        logger(`Waste verified and credited: ${submissionId}`, "info");

        return sendSuccess(res, "Waste verified and credited successfully", {
            submission_id: submission._id,
            amount_credited: submission.estimated_value,
            status: "completed",
        });
    } catch (error) {
        logger(`Verify waste error: ${error}`, "error");
        return sendInternalError(res, "Failed to verify waste");
    }
};

/**
 * Get user's waste submissions history
 */
export const getUserSubmissions = async (
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

        const submissions = await WasteSubmission.find({ user_id: userId })
            .sort({ submitted_at: -1 })
            .skip(skip)
            .limit(limit)
            .select("waste_type quantity estimated_value status submitted_at")
            .lean();

        const total = await WasteSubmission.countDocuments({ user_id: userId });

        return sendSuccess(res, "User submissions retrieved", {
            submissions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger(`Get submissions error: ${error}`, "error");
        return sendInternalError(res, "Failed to retrieve submissions");
    }
};

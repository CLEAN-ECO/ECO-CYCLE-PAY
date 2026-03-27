import { Response } from "express";
import User, { IGeneratorUser, IHubUser, INGOUser, IVendorUser } from "../models/user";
import Wallet from "../models/wallet";
import {
    sendSuccess,
    sendUnauthorized,
    sendNotFound,
    sendInternalError,
} from "../utils/responseHelper";
import { logger } from "../utils/logger";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import Referral from "../models/referral";

/**
 * Get authenticated user's details
 * Returns user info, wallet balance, and profile data
 */
export const getUserDetails = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return sendUnauthorized(res, "User not authenticated");
        }

        // Get user details
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return sendNotFound(res, "User not found");
        }

        // Get wallet details
        const wallet = await Wallet.findOne({ user: userId });

        // Get referral details
        const referral = await Referral.findOne({ user: userId });

        // Prepare response data
        const userData = {
            id: user._id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            email_verified: user.email_verified,
            referralLink: referral?.link || "",
            referralCount: referral?.successful_referrals || 0,
            created_at: user.created_at,
            updated_at: user.updated_at,
            ...(user.role === "generator" && {
                subtype: (user as IGeneratorUser)?.generator_subtype,
            }),
            ...(user.role === "vendor" && {
                vendor_business_name: (user as IVendorUser)?.vendor_business_name,
                vendor_business_type: (user as IVendorUser)?.vendor_business_type,
                vendor_location: (user as IVendorUser)?.vendor_location,
                vendor_years: (user as IVendorUser)?.vendor_years,
                vendor_registration: (user as IVendorUser)?.vendor_registration,
            }),
            ...(user.role === "ngo-hub" && {
                ngo_hub_type: (user as INGOUser | IHubUser).ngo_hub_type,
                ...([(user as INGOUser | IHubUser).ngo_hub_type].includes("NGO") && {
                    ngo_name: (user as INGOUser)?.ngo_name,
                    ngo_registration: (user as INGOUser)?.ngo_registration,
                    ngo_years: (user as INGOUser)?.ngo_years,
                    ngo_focus: (user as INGOUser)?.ngo_focus,
                    ngo_location: (user as INGOUser)?.ngo_location,
                    ngo_mission: (user as INGOUser)?.ngo_mission,
                }),
                ...([(user as INGOUser | IHubUser).ngo_hub_type].includes("Hub") && {
                    hub_name: (user as IHubUser)?.hub_name,
                    hub_capacity: (user as IHubUser)?.hub_capacity,
                    hub_location: (user as IHubUser)?.hub_location,
                    hub_availability: (user as IHubUser)?.hub_availability,
                    hub_description: (user as IHubUser)?.hub_description,
                }),
            }),
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
        };

        logger(`User details retrieved for ${userId}`, "info");
        return sendSuccess(res, "User details retrieved successfully", userData);
    } catch (error) {
        logger(`Get user details error: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "Failed to retrieve user details",
        );
    }
};

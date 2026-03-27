import { Response } from "express";
import dotenv from "dotenv";
import axios from "axios";
import { logger } from "../utils/logger";
import { sendError, sendInternalError, sendSuccess } from "../utils/responseHelper";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import Wallet from "../models/wallet";
import { ObjectId } from "mongoose";
import Activity from "../models/activity";
import Transaction from "../models/transaction";
import { validationResult } from "express-validator";

dotenv.config();
const { CLIENT_ID, SECRET_KEY, MERCHANT_CODE, PAYABLE_CODE, REDIRECT_URL } = process.env as {
    CLIENT_ID: string;
    SECRET_KEY: string;
    MERCHANT_CODE: string;
    PAYABLE_CODE: string;
    REDIRECT_URL: string;
};

const generateAccessToken = async () => {
    try {
        // Concatenate client ID and secret key with a colon
        const concatenatedCredentials = `${CLIENT_ID}:${SECRET_KEY}`;

        // Encode the concatenated string in Base64
        const encodedCredentials = btoa(concatenatedCredentials);

        // Make a POST request to the Interswitch API to get the access token
        const response = await axios.post(
            "https://qa.interswitchng.com/passport/oauth/token?grant_type=client_credentials",
            null,
            {
                headers: {
                    Authorization: `Basic ${encodedCredentials}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        );

        logger(`Access token generated successfully: ${response.data.access_token}`, "info");
        return response.data.access_token;
    } catch (error) {
        logger(`Error generating access token: ${error}`, "error");
        throw error;
    }
};

// Create new activity record for user
const createActivity = async ({
    userId,
    type,
    amount,
    description,
    reference,
}: {
    userId: ObjectId;
    type: string;
    amount?: number;
    description?: string;
    reference?: string;
}) => {
    try {
        const activity = new Activity({
            user: userId,
            type,
            title: amount ? `${type} of ${amount}` : type,
            amount,
            description,
            reference_id: reference,
        });
        await activity.save();
        logger(
            `Activity created successfully for user ID: ${userId}, type: ${type}, amount: ${amount}`,
            "info",
        );
    } catch (error) {
        logger(`Error creating activity: ${error}`, "error");
        throw error;
    }
};

// Create new transaction record for user
const createTransaction = async ({
    userId,
    type,
    amount,
    status,
    description,
    before,
    after,
    completedAt,
    reference,
    metadata,
}: {
    userId: ObjectId;
    type: string;
    amount: number;
    status: string;
    description: string;
    before?: number;
    after?: number;
    completedAt?: Date;
    reference?: string;
    metadata?: Record<string, unknown>;
}) => {
    try {
        const transaction = new Transaction({
            user: userId,
            type,
            amount,
            status,
            description,
            balance_before: before,
            balance_after: after,
            completed_at: completedAt,
            reference,
            metadata,
        });
        await transaction.save();
        logger(
            `Transaction created successfully for user ID: ${userId}, type: ${type}, amount: ${amount}, status: ${status}`,
            "info",
        );
    } catch (error) {
        logger(`Error creating transaction: ${error}`, "error");
        throw error;
    }
};

/**
 * Controller to handle payment processing
 */
export const createPayment = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger(`Validation errors: ${JSON.stringify(errors.array())}`, "error");
            return sendError(res, 400, "Invalid input", { errors: errors.array() });
        }

        const { amount } = req.body;
        const accessToken = await generateAccessToken();

        // Make a POST request to the Interswitch API to process the payment
        const paymentResponse = await axios.post(
            "https://qa.interswitchng.com/paymentgateway/api/v1/paybill",
            {
                amount,
                customerId: req.user?.userId,
                customerEmail: req.user?.email,
                merchantCode: MERCHANT_CODE,
                payableCode: PAYABLE_CODE,
                redirectUrl: REDIRECT_URL,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            },
        );

        logger(`Payment processed successfully: ${paymentResponse.data}`, "info");
        return sendSuccess(res, "Payment processed successfully", paymentResponse.data);
    } catch (error) {
        logger(`Error processing payment: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "An error occurred while processing payment",
        );
    }
};

/**
 * Verify payment callback from Interswitch
 */
export const verifyPaymentCallback = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger(`Validation errors: ${JSON.stringify(errors.array())}`, "error");
            return sendError(res, 400, "Invalid input", { errors: errors.array() });
        }

        const userId = req.user?.userId;
        if (!userId) {
            logger("User ID not found in request", "error");
            return sendError(res, 400, "User ID is required for payment verification");
        }

        const { transactionId, amount } = req.body;
        const accessToken = await generateAccessToken();

        // Make a GET request to the Interswitch API to verify the payment status
        const verificationResponse = await axios.get(
            `https://qa.interswitchng.com/collections/api/v2/gettransaction.json?transactionReference=${transactionId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        logger(`Payment verification successful: ${verificationResponse.data}`, "info");

        if (verificationResponse.data.ResponseCode === "00") {
            // Create a completed transaction record for the successful payment
            await createTransaction({
                userId,
                type: "crediting",
                amount: verificationResponse.data.Amount || amount,
                status: "completed",
                description: "Payment credited successfully",
                before: 0,
                after: verificationResponse.data.Amount || amount,
                completedAt: new Date(),
                reference: transactionId as string,
                metadata: verificationResponse.data,
            });

            await createActivity({
                userId,
                type: "crediting",
                amount: verificationResponse.data.Amount || amount,
                description: "Payment credited successfully",
                reference: transactionId as string,
            });

            return sendSuccess(res, "Payment verification successful", verificationResponse.data);
        } else {
            return sendError(res, 400, "Payment verification failed", verificationResponse.data);
        }
    } catch (error) {
        logger(`Error verifying payment: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error ? error.message : "An error occurred while verifying payment",
        );
    }
};

/**
 * Controller to handle withdrawal
 */
export const withdrawFunds = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger(`Validation errors: ${JSON.stringify(errors.array())}`, "error");
            return sendError(res, 400, "Invalid input", { errors: errors.array() });
        }

        const userId = req.user?.userId;
        if (!userId) {
            logger("User ID not found in request", "error");
            return sendError(res, 400, "User ID is required for withdrawal");
        }

        const { amount, pin } = req.body;
        const accessToken = await generateAccessToken();

        // Update user's balance in the database after successful withdrawal
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            logger(`Wallet not found for user ID: ${userId}`, "error");
            return sendError(res, 404, "Wallet not found for user");
        }

        if (wallet.pin !== pin) {
            logger(`Invalid PIN for user ID: ${userId}. Provided PIN: ${pin}`, "error");

            return sendError(res, 400, "Invalid PIN provided for withdrawal");
        } else if (wallet.balance < amount) {
            logger(
                `Insufficient balance for user ID: ${userId}. Available balance: ${wallet.balance}, requested withdrawal amount: ${amount}`,
                "error",
            );

            return sendError(res, 400, "Insufficient balance for withdrawal", {
                availableBalance: wallet.balance,
            });
        } else if (amount < 500) {
            logger(
                `Withdrawal amount too low for user ID: ${userId}. Available balance: ${wallet.balance}, requested withdrawal amount: ${amount}`,
                "error",
            );

            return sendError(
                res,
                400,
                "Withdrawal amount too low. Minimum withdrawal amount is 500",
                { availableBalance: wallet.balance },
            );
        }

        const before = wallet.balance;

        // Confirm account details with Interswitch before processing withdrawal
        const accountVerificationResponse = await axios.post(
            "https://qa.interswitchng.com/quicktellerservice/api/v5/Transactions/DoAccountNameInquiry",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            },
        );

        // Check if account verification was successful before proceeding
        if (accountVerificationResponse.data.ResponseCodeGrouping !== "SUCCESSFUL") {
            logger(`Account verification failed: ${accountVerificationResponse.data}`, "error");

            return sendError(
                res,
                400,
                "Account verification failed",
                accountVerificationResponse.data,
            );
        }

        // Make the transfer of funds to the user's bank account
        const transferResponse = await axios.post(
            "https://qa.interswitchng.com/quicktellerservice/api/v5/Transactions/DoTransfer",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            },
        );

        // Check if transfer was successful before proceeding with withdrawal
        if (transferResponse.data.ResponseCodeGrouping !== "SUCCESSFUL") {
            logger(`Fund transfer failed: ${transferResponse.data}`, "error");
            return sendError(res, 400, "Fund transfer failed", transferResponse.data);
        }

        // Make a POST request to the Interswitch API to confirm the withdrawal
        const withdrawalResponse = await axios.post(
            `https://qa.interswitchng.com/quicktellerservice/api/v5/Transactions?requestRef=${transferResponse.data.TransactionReference}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            },
        );

        if (withdrawalResponse.data.status === "Completed") {
            logger(`Withdrawal processed successfully: ${withdrawalResponse.data}`, "info");
        } else {
            logger(`Withdrawal processing failed: ${withdrawalResponse.data}`, "error");

            // Create a failed transaction record for the attempted withdrawal
            await createTransaction({
                userId,
                type: "withdrawal",
                amount,
                status: "failed",
                description: "Failed withdrawal",
                before,
                after: wallet.balance,
                completedAt: new Date(),
                reference: accountVerificationResponse.data.TransactionReference,
            });

            await createActivity({
                userId,
                type: "withdrawal",
                amount,
                description: "Failed withdrawal",
                reference: accountVerificationResponse.data.TransactionReference,
            });

            return sendError(res, 400, "Withdrawal processing failed", withdrawalResponse.data);
        }

        wallet.balance -= amount;
        await wallet.save();

        // Create a completed transaction record for the successful withdrawal
        await createTransaction({
            userId,
            type: "withdrawal",
            amount,
            status: "completed",
            description: "Withdrawal processed successfully",
            before,
            after: wallet.balance,
            completedAt: new Date(),
            reference: withdrawalResponse.data.TransactionReference,
        });

        await createActivity({
            userId,
            type: "withdrawal",
            amount,
            description: "Withdrawal processed successfully",
            reference: withdrawalResponse.data.TransactionReference,
        });

        return sendSuccess(res, "Withdrawal processed successfully", {
            withdrawalResponse: withdrawalResponse.data,
            user: { wallet: { balance: wallet.balance } },
        });
    } catch (error) {
        logger(`Error processing withdrawal: ${error}`, "error");
        return sendInternalError(
            res,
            error instanceof Error
                ? error.message
                : "An error occurred while processing withdrawal",
        );
    }
};

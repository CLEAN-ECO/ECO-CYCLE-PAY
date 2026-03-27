import { Router } from "express";
import {
    getReferralLink,
    trackReferralClick,
    requestWithdrawal,
    getTransactionHistory,
    getWalletSummary,
} from "../controllers/wallet";
import { verifyToken } from "../middlewares/authMiddleware";
import { validateWithdrawal } from "../middlewares/wasteValidation";

const walletRouter = Router();

/**
 * @swagger
 * /api/v1/wallet/summary:
 *   get:
 *     summary: Get wallet summary
 *     description: Retrieve wallet details including balance and recent transactions
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 24500
 *                     total_earned:
 *                       type: number
 *                     total_withdrawn:
 *                       type: number
 *                     wallet_id:
 *                       type: string
 *                     recent_transactions:
 *                       type: array
 */
walletRouter.get("/summary", verifyToken, getWalletSummary);

/**
 * @swagger
 * /api/v1/wallet/referral:
 *   get:
 *     summary: Get referral link
 *     description: Retrieve or generate user's referral link
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral link retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     referral_code:
 *                       type: string
 *                     referral_link:
 *                       type: string
 *                     clicks:
 *                       type: number
 *                     successful_referrals:
 *                       type: number
 *                     total_earnings:
 *                       type: number
 */
walletRouter.get("/referral", verifyToken, getReferralLink);

/**
 * @swagger
 * /api/v1/wallet/referral/{code}/click:
 *   post:
 *     summary: Track referral link click
 *     description: Record a referral link click for analytics
 *     tags:
 *       - Wallet
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Referral code
 *     responses:
 *       200:
 *         description: Click tracked
 */
walletRouter.post("/referral/:code/click", trackReferralClick);

/**
 * @swagger
 * /api/v1/wallet/withdraw:
 *   post:
 *     summary: Request withdrawal
 *     description: Request to withdraw funds from wallet to bank account
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - bank_account
 *               - bank_code
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *                 description: Amount in ₦
 *               bank_account:
 *                 type: string
 *                 example: "0123456789"
 *               bank_code:
 *                 type: string
 *                 example: "GTB"
 *     responses:
 *       200:
 *         description: Withdrawal processed
 *       400:
 *         description: Validation error or insufficient balance
 *       401:
 *         description: Unauthorized
 */
walletRouter.post("/withdraw", verifyToken, validateWithdrawal(), requestWithdrawal);

/**
 * @swagger
 * /api/v1/wallet/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Retrieve user's wallet transaction history with pagination
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Transactions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           amount:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           date:
 *                             type: string
 *                     pagination:
 *                       type: object
 */
walletRouter.get("/transactions", verifyToken, getTransactionHistory);

export default walletRouter;

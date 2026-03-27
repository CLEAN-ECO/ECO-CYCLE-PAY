import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import {
    validatePaymentCreation,
    validatePaymentVerification,
    validateWithdrawalRequest,
} from "../middlewares/paymentValidation";
import { createPayment, verifyPaymentCallback, withdrawFunds } from "../controllers/payment";

const paymentRouter = Router();

/**
 * @swagger
 * /api/v1/payment/callback:
 *   post:
 *     summary: Verify payment callback from Interswitch
 *     tags:
 *       - Payment
 *     parameters:
 *       - in: body
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to verify
 *       - in: body
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: The amount of the transaction to verify
 *     responses:
 *       200:
 *         description: Payment verification successful
 *       400:
 *         description: Payment verification failed
 *       500:
 *         description: Internal server error
 *
 */
paymentRouter.post("/verify", verifyToken, validatePaymentVerification(), verifyPaymentCallback);

/**
 * @swagger
 * /api/v1/payment/withdraw:
 *   post:
 *    summary: Request a withdrawal
 *   tags:
 *    - Payment
 *  parameters:
 *  - in: body
 *  name: amount
 * required: true
 * schema:
 *  type: number
 * description: The amount to withdraw
 * responses:
 *  200:
 *   description: Withdrawal request successful
 *  400:
 *  description: Withdrawal request failed
 *  500:
 *   description: Internal server error
 */
paymentRouter.post("/withdraw", verifyToken, validateWithdrawalRequest(), withdrawFunds);

/**
 * @swagger
 * /api/v1/payment/create:
 *  post:
 *  summary: Create a new payment
 * tags:
 *  - Payment
 * parameters:
 * - in: body
 * name: amount
 * required: true
 * schema:
 *  type: number
 * description: The amount to pay
 * responses:
 *  200:
 *  description: Payment creation successful
 * 400:
 * description: Payment creation failed
 * 500:
 * description: Internal server error
 */
paymentRouter.post("/create", verifyToken, validatePaymentCreation(), createPayment);

export default paymentRouter;

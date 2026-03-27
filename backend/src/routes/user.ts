import { Router } from "express";
import { getUserDetails } from "../controllers/user";
import { verifyToken } from "../middlewares/authMiddleware";

const userRouter = Router();

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     summary: Get authenticated user's profile details
 *     description: |
 *       Retrieve the authenticated user's complete profile information including
 *       personal details, role-specific information, and wallet balance.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User details retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 65a1b2c3d4e5f6g7h8i9j0k1
 *                     full_name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     phone:
 *                       type: string
 *                       example: +234801234567
 *                     role:
 *                       type: string
 *                       enum: [generator, vendor, ngo-hub]
 *                       example: generator
 *                     email_verified:
 *                       type: boolean
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                           example: 25000
 *                         total_earned:
 *                           type: number
 *                           example: 50000
 *                         total_withdrawn:
 *                           type: number
 *                           example: 25000
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.get("/me", verifyToken, getUserDetails);

export default userRouter;

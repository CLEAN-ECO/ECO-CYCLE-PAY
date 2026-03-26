import { Router } from "express";
import { getDashboardData, getActivities, getWallet } from "../controllers/dashboard";
import { verifyToken } from "../middlewares/authMiddleware";

const dashboardRouter = Router();

// All dashboard routes require authentication
dashboardRouter.use(verifyToken);

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get role-specific dashboard data
 *     description: |
 *       Retrieve dashboard data customized for the user's role.
 *       - Generator: wallet balance, pickups, waste listings
 *       - Vendor: orders received, available supply, order value
 *       - NGO/Hub: waste collected, active pickups, earnings
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                         total_earned:
 *                           type: number
 *                         total_withdrawn:
 *                           type: number
 *                     recent_activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
dashboardRouter.get("/", getDashboardData);

/**
 * @swagger
 * /api/v1/dashboard/activities:
 *   get:
 *     summary: Get user activities with pagination
 *     description: |
 *       Retrieve paginated list of user activities.
 *       Supports query parameters for pagination.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
dashboardRouter.get("/activities", getActivities);

/**
 * @swagger
 * /api/v1/dashboard/wallet:
 *   get:
 *     summary: Get user wallet details
 *     description: |
 *       Retrieve detailed wallet information including balance,
 *       total earnings, and withdrawal history.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 24500
 *                     total_earned:
 *                       type: number
 *                       example: 150000
 *                     total_withdrawn:
 *                       type: number
 *                       example: 125500
 *                     last_transaction_date:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
dashboardRouter.get("/wallet", getWallet);

export default dashboardRouter;

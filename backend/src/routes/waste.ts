import { Router } from "express";
import {
    getWasteCategories,
    submitWaste,
    getSubmissionStatus,
    getNearestHubs,
    assignHubAndSchedulePickup,
    getUserSubmissions,
} from "../controllers/waste";
import { verifyToken } from "../middlewares/authMiddleware";
import { validateWasteSubmission, validateSchedulePickup } from "../middlewares/wasteValidation";

const wasteRouter = Router();

/**
 * @swagger
 * /api/v1/waste/categories:
 *   get:
 *     summary: Get available waste categories
 *     description: Retrieve all waste categories with pricing information
 *     tags:
 *       - Waste
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           label:
 *                             type: string
 *                           price_per_kg:
 *                             type: number
 */
wasteRouter.get("/categories", getWasteCategories);

/**
 * @swagger
 * /api/v1/waste/hubs:
 *   get:
 *     summary: Get nearest collection hubs
 *     description: Retrieve collection hubs, optionally filtered by waste type
 *     tags:
 *       - Waste
 *     parameters:
 *       - in: query
 *         name: waste_type
 *         schema:
 *           type: string
 *         description: Filter by waste type
 *     responses:
 *       200:
 *         description: Hubs retrieved successfully
 */
wasteRouter.get("/hubs", getNearestHubs);

// Protected routes - require authentication
wasteRouter.use(verifyToken);

/**
 * @swagger
 * /api/v1/waste/submit:
 *   post:
 *     summary: Submit waste for processing
 *     description: Create a new waste submission
 *     tags:
 *       - Waste
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - waste_type
 *               - quantity
 *             properties:
 *               waste_type:
 *                 type: string
 *                 enum:
 *                   - plastic
 *                   - paper
 *                   - metal
 *                   - beverage_cans
 *                   - cartons
 *                   - glass
 *                   - electronics
 *                   - organic
 *                   - mixed
 *               quantity:
 *                 type: number
 *                 example: 5.2
 *                 description: Weight in kg
 *               description:
 *                 type: string
 *                 description: Optional description
 *     responses:
 *       201:
 *         description: Waste submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
wasteRouter.post("/submit", validateWasteSubmission(), submitWaste);

/**
 * @swagger
 * /api/v1/waste/submission/{id}:
 *   get:
 *     summary: Get submission status
 *     tags:
 *       - Waste
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission status retrieved
 */
wasteRouter.get("/submission/:id", getSubmissionStatus);

/**
 * @swagger
 * /api/v1/waste/submission/{id}/schedule-pickup:
 *   post:
 *     summary: Schedule pickup for submission
 *     tags:
 *       - Waste
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collection_hub_id:
 *                 type: string
 *               scheduled_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Pickup scheduled
 */
wasteRouter.post(
    "/submission/:id/schedule-pickup",
    validateSchedulePickup(),
    assignHubAndSchedulePickup,
);

/**
 * @swagger
 * /api/v1/waste/submissions:
 *   get:
 *     summary: Get user's waste submissions
 *     tags:
 *       - Waste
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submissions retrieved
 */
wasteRouter.get("/submissions", getUserSubmissions);

export default wasteRouter;

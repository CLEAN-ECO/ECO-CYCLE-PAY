import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Get health status
 *     description: Returns the health status of the API server
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "UP"
 *                 timestamp:
 *                   type: string
 *                   example: "2026-03-23T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get("/", (req: Request, res: Response) => {
    res.json({
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default router;

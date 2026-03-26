import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/database";
import swaggerSpec from "./config/swagger";
import errorHandler from "./middlewares/errorHandler";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import wasteRoutes from "./routes/waste";
import walletRoutes from "./routes/wallet";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: "*",
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve);
app.get(
    "/api-docs",
    swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
            url: "/api-docs.json",
        },
    }),
);

// Swagger JSON endpoint
app.get("/api-docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// Routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/waste", wasteRoutes);
app.use("/api/v1/wallet", walletRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: "Not Found",
        path: req.path,
    });
});

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();
        console.log("✓ Database connected successfully");

        app.listen(PORT, () => {
            console.log(`✓ Server is running on http://localhost:${PORT}`);
            console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
        });
    } catch (error) {
        console.error("✗ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

export default app;

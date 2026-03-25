import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const { DB_URI } = process.env;

export const connectDB = async (): Promise<void> => {
    if (!DB_URI) {
        console.error("Error: DB URI is not defined in environment variables");
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(DB_URI, {
            // useNewUrlParser and useUnifiedTopology are deprecated in mongoose 6.x
            retryWrites: true,
            w: "majority",
        });

        console.log(`DB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Error connecting to DB:", error);
        throw error;
    }
};

export const disconnectDB = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log("DB Disconnected");
    } catch (error) {
        console.error("Error disconnecting from DB:", error);
        throw error;
    }
};

export default mongoose;

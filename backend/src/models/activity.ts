import { Schema, Document, model } from "mongoose";

type ActivityType =
    | "upload_waste"
    | "pickup_request"
    | "withdrawal"
    | "order_approved"
    | "order_received"
    | "shipment_request"
    | "new_listing"
    | "collection_accepted"
    | "waste_collected";

type ActivityStatus = "pending" | "in_progress" | "completed" | "cancelled" | "rejected";

interface IActivity extends Document {
    user: Schema.Types.ObjectId;
    type: ActivityType;
    title: string;
    description: string;
    status: ActivityStatus;
    amount?: number; // If transaction involved money
    quantity?: number; // If quantity of waste involved
    reference_id?: string; // Reference to order, pickup, etc.
    created_at: Date;
}

const activitySchema = new Schema<IActivity>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    type: {
        type: String,
        enum: {
            values: [
                "upload_waste",
                "pickup_request",
                "withdrawal",
                "order_approved",
                "order_received",
                "shipment_request",
                "new_listing",
                "collection_accepted",
                "waste_collected",
            ],
            message: "Invalid activity type",
        },
        required: [true, "Activity type is required"],
    },
    title: {
        type: String,
        required: [true, "Activity title is required"],
    },
    description: {
        type: String,
        required: [true, "Activity description is required"],
    },
    status: {
        type: String,
        enum: {
            values: ["pending", "in_progress", "completed", "cancelled", "rejected"],
            message: "Invalid activity status",
        },
        default: "pending",
    },
    amount: Number,
    quantity: Number,
    reference_id: String,
    created_at: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for faster queries
activitySchema.index({ userId: 1, created_at: -1 });
activitySchema.index({ type: 1 });

const Activity = model<IActivity>("Activity", activitySchema);

export default Activity;

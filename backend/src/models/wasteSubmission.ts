import { Schema, Document, model } from "mongoose";

type WasteType =
    | "plastic"
    | "paper"
    | "metal"
    | "beverage_cans"
    | "cartons"
    | "glass"
    | "electronics"
    | "organic"
    | "mixed";

type SubmissionStatus = "submitted" | "verified" | "approved" | "rejected" | "completed";

interface IWasteSubmission extends Document {
    user: Schema.Types.ObjectId;
    waste_type: WasteType;
    quantity: number; // in kg
    estimated_value: number; // ₦
    status: SubmissionStatus;
    collection_hub?: Schema.Types.ObjectId;
    images?: string[]; // URLs to uploaded images
    description?: string;
    submitted_at: Date;
    verified_at?: Date;
    pickup_scheduled_date?: Date;
    created_at: Date;
    updated_at: Date;
}

const wasteSubmissionSchema = new Schema<IWasteSubmission>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        waste_type: {
            type: String,
            enum: {
                values: [
                    "plastic",
                    "paper",
                    "metal",
                    "beverage_cans",
                    "cartons",
                    "glass",
                    "electronics",
                    "organic",
                    "mixed",
                ],
                message: "Invalid waste type",
            },
            required: [true, "Waste type is required"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0.1, "Quantity must be at least 0.1 kg"],
        },
        estimated_value: {
            type: Number,
            required: [true, "Estimated value is required"],
            min: [0, "Estimated value cannot be negative"],
        },
        status: {
            type: String,
            enum: {
                values: ["submitted", "verified", "approved", "rejected", "completed"],
                message: "Invalid submission status",
            },
            default: "submitted",
        },
        collection_hub: {
            type: Schema.Types.ObjectId,
            ref: "CollectionHub",
        },
        images: [String],
        description: String,
        submitted_at: {
            type: Date,
            default: Date.now,
        },
        verified_at: Date,
        pickup_scheduled_date: Date,
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

// Indexes for faster queries
wasteSubmissionSchema.index({ user: 1, submitted_at: -1 });
wasteSubmissionSchema.index({ status: 1 });
wasteSubmissionSchema.index({ waste_type: 1 });

const WasteSubmission = model<IWasteSubmission>("WasteSubmission", wasteSubmissionSchema);

export default WasteSubmission;

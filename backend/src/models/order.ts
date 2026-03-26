import { Schema, Document, model } from "mongoose";

type WasteType = "plastic" | "metal" | "glass" | "paper" | "organic" | "electronics" | "mixed";

type OrderStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

interface IOrder extends Document {
    vendor: Schema.Types.ObjectId;
    waste_type: WasteType;
    quantity: number; // in kg
    estimated_value: number; // ₦
    status: OrderStatus;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

const orderSchema = new Schema<IOrder>(
    {
        vendor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Vendor is required"],
        },
        waste_type: {
            type: String,
            enum: {
                values: ["plastic", "metal", "glass", "paper", "organic", "electronics", "mixed"],
                message: "Invalid waste type",
            },
            required: [true, "Waste type is required"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1kg"],
        },
        estimated_value: {
            type: Number,
            required: [true, "Estimated value is required"],
            min: [0, "Estimated value cannot be negative"],
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "approved", "rejected", "completed", "cancelled"],
                message: "Invalid order status",
            },
            default: "pending",
        },
        notes: String,
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

// Indexes for faster queries
orderSchema.index({ vendor: 1, created_at: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ waste_type: 1 });

const Order = model<IOrder>("Order", orderSchema);

export default Order;

import { Schema, Document, model } from "mongoose";

type WasteType =
    | "Plastics"
    | "Papers"
    | "Metals"
    | "Beverage Cans"
    | "Cartons"
    | "Glass"
    | "Electronics"
    | "Organic"
    | "Mixed";

type ListingStatus = "available" | "pending" | "sold_out" | "expired";

export interface IWasteSupply extends Document {
    generator: Schema.Types.ObjectId;
    waste_type: WasteType;
    quantity: number; // in kg
    price_per_kg: number; // ₦
    location: string;
    description?: string;
    status: ListingStatus;
    pickup_available: boolean;
    uploaded_date: Date;
    expiry_date?: Date;
    created_at: Date;
    updated_at: Date;
}

const wasteSupplySchema = new Schema<IWasteSupply>(
    {
        generator: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Generator is required"],
        },
        waste_type: {
            type: String,
            enum: {
                values: [
                    "Plastics",
                    "Papers",
                    "Metals",
                    "Beverage Cans",
                    "Cartons",
                    "Glass",
                    "Electronics",
                    "Organic",
                    "Mixed",
                ],
                message: "Invalid waste type",
            },
            required: [true, "Waste type is required"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1kg"],
        },
        price_per_kg: {
            type: Number,
            required: [true, "Price per kg is required"],
            min: [0, "Price cannot be negative"],
        },
        location: {
            type: String,
            required: [true, "Location is required"],
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: {
                values: ["available", "pending", "sold_out", "expired"],
                message: "Invalid listing status",
            },
            default: "available",
        },
        pickup_available: {
            type: Boolean,
            default: true,
        },
        uploaded_date: {
            type: Date,
            default: Date.now,
        },
        expiry_date: {
            type: Date,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

// Indexes for faster queries
wasteSupplySchema.index({ generator: 1, created_at: -1 });
wasteSupplySchema.index({ waste_type: 1, status: 1 });
wasteSupplySchema.index({ status: 1 });
wasteSupplySchema.index({ location: 1 });

const WasteSupply = model<IWasteSupply>("WasteSupply", wasteSupplySchema);

export default WasteSupply;

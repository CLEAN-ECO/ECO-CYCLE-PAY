import { Schema, Document, model } from "mongoose";

type WasteType =
    | "Plastics"
    | "Metals"
    | "Beverage Cans"
    | "Papers"
    | "Cartons"
    | "Glass"
    | "Electronics"
    | "Organic"
    | "Mixed";

type PickupStatus =
    | "requested"
    | "accepted"
    | "scheduled"
    | "in_transit"
    | "completed"
    | "cancelled";

export interface IPickup extends Document {
    requester: Schema.Types.ObjectId; // Generator who requested pickup
    collector?: Schema.Types.ObjectId; // NGO/Hub who will collect
    waste_type: WasteType;
    quantity: number; // in kg
    status: PickupStatus;
    pickup_location: string;
    scheduled_date?: Date;
    completed_date?: Date;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

const pickupSchema = new Schema<IPickup>(
    {
        requester: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Requester is required"],
        },
        collector: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        waste_type: {
            type: String,
            enum: {
                values: [
                    "Plastics",
                    "Metals",
                    "Beverage Cans",
                    "Papers",
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
        status: {
            type: String,
            enum: {
                values: [
                    "requested",
                    "accepted",
                    "scheduled",
                    "in_transit",
                    "completed",
                    "cancelled",
                ],
                message: "Invalid pickup status",
            },
            default: "requested",
        },
        pickup_location: {
            type: String,
            required: [true, "Pickup location is required"],
        },
        scheduled_date: Date,
        completed_date: Date,
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
pickupSchema.index({ requester: 1, created_at: -1 });
pickupSchema.index({ collector: 1, status: 1 });
pickupSchema.index({ status: 1 });

const Pickup = model<IPickup>("Pickup", pickupSchema);

export default Pickup;

import { Schema, Document, model } from "mongoose";

export interface ICollectionHub extends Document {
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    address: string;
    phone?: string;
    email?: string;
    operating_hours?: string;
    accepted_waste_types: string[];
    capacity: number; // Daily capacity in kg
    manager_id?: Schema.Types.ObjectId;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const collectionHubSchema = new Schema<ICollectionHub>(
    {
        name: {
            type: String,
            required: [true, "Hub name is required"],
            trim: true,
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
        },
        latitude: Number,
        longitude: Number,
        address: {
            type: String,
            required: [true, "Address is required"],
        },
        phone: String,
        email: String,
        operating_hours: String,
        accepted_waste_types: [
            {
                type: String,
                enum: [
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
            },
        ],
        capacity: {
            type: Number,
            default: 1000, // 1000 kg per day
        },
        manager_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        is_active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

// Geospatial index for location-based queries
collectionHubSchema.index({ latitude: 1, longitude: 1 });
collectionHubSchema.index({ location: 1 });

const CollectionHub = model<ICollectionHub>("CollectionHub", collectionHubSchema);

export default CollectionHub;

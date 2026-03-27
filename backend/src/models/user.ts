/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65a1b2c3d4e5f6g7h8i9j0k1
 *         full_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         phone:
 *           type: string
 *           example: +234801234567
 *         role:
 *           type: string
 *           enum: [generator, vendor, ngo-hub]
 *           example: generator
 *         email_verified:
 *           type: boolean
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       required: [full_name, email, phone, role]
 *     GeneratorUser:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             generator_subtype:
 *               type: string
 *               enum: [Household, Hotel, School, Event Center, Restaurant, Office, Conference Center]
 *               example: Household
 *     VendorUser:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             vendor_business_name:
 *               type: string
 *               example: Green Waste Solutions
 *             vendor_business_type:
 *               type: string
 *               example: Waste Management
 *             vendor_location:
 *               type: string
 *               example: Lagos, Nigeria
 *             vendor_years:
 *               type: integer
 *               example: 5
 *     NGOUser:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             ngo_hub_type:
 *               type: string
 *               enum: [NGO]
 *               example: NGO
 *             ngo_name:
 *               type: string
 *               example: Environmental Trust NGO
 *             ngo_registration:
 *               type: string
 *               example: CAC/NGO/12345
 *             ngo_years:
 *               type: integer
 *               example: 10
 *             ngo_focus:
 *               type: string
 *               example: Waste Management & Recycling
 *             ngo_location:
 *               type: string
 *               example: Lagos, Nigeria
 *             ngo_mission:
 *               type: string
 *               example: To promote sustainable waste management practices
 *     HubUser:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             ngo_hub_type:
 *               type: string
 *               enum: [Hub]
 *               example: Hub
 *             hub_name:
 *               type: string
 *               example: Central Waste Hub
 *             hub_capacity:
 *               type: integer
 *               description: Daily capacity in kg
 *               example: 5000
 *             hub_location:
 *               type: string
 *               example: Lagos, Nigeria
 *             hub_availability:
 *               type: string
 *               example: 24/7
 *             hub_description:
 *               type: string
 *               example: Main waste collection and processing hub
 */

import { Schema, Document, Model, model } from "mongoose";

// Type definitions for different user roles
export type UserRole = "generator" | "vendor" | "ngo-hub";
export type GeneratorSubtype =
    | "Household"
    | "Hotel"
    | "School"
    | "Event Center"
    | "Restaurant"
    | "Office"
    | "Conference Center";
export type NGOHubType = "NGO" | "Hub";

// Common user fields
interface IUserCommon extends Document {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    email_verified: boolean;
    referred_by?: Schema.Types.ObjectId; // User who referred this user
    wallet_pin?: string; // Hashed PIN
    secret_phrase?: string[]; // Recovery phrase words
    created_at: Date;
    updated_at: Date;
}

// Waste Generator specific fields
export interface IGeneratorUser extends IUserCommon {
    generator_subtype?: GeneratorSubtype;
}

// Vendor specific fields
export interface IVendorUser extends IUserCommon {
    vendor_business_name?: string;
    vendor_business_type?: string;
    vendor_location?: string;
    vendor_years?: number;
    vendor_registration?: string;
}

// NGO specific fields
export interface INGOUser extends IUserCommon {
    ngo_hub_type?: "NGO";
    ngo_name?: string;
    ngo_registration?: string;
    ngo_years?: number;
    ngo_focus?: string;
    ngo_location?: string;
    ngo_mission?: string;
}

// Hub specific fields
export interface IHubUser extends IUserCommon {
    ngo_hub_type?: "Hub";
    hub_name?: string;
    hub_capacity?: number; // kg/day
    hub_location?: string;
    hub_availability?: string;
    hub_description?: string;
}

// Union type for all user types
export type IUser = IGeneratorUser | IVendorUser | INGOUser | IHubUser;

// Mongoose schema definition
const userSchema = new Schema<IUser>(
    {
        full_name: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/, "Please provide a valid email"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            match: [/^\+?[\d\s\-()]+$/, "Please provide a valid phone number"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false, // Don't include password by default in queries
        },
        role: {
            type: String,
            enum: {
                values: ["generator", "vendor", "ngo-hub"],
                message: "Role must be one of: generator, vendor, ngo-hub",
            },
            required: [true, "Role is required"],
        },
        email_verified: {
            type: Boolean,
            default: false,
        },
        referred_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        wallet_pin: {
            type: String,
            select: false, // Don't include PIN by default in queries
        },
        secret_phrase: {
            type: [String],
            select: false, // Don't include recovery phrase by default in queries
        },

        // Generator-specific fields
        generator_subtype: {
            type: String,
            enum: {
                values: [
                    "Household",
                    "Hotel",
                    "School",
                    "Event Center",
                    "Restaurant",
                    "Office",
                    "Conference Center",
                ],
                message: "Invalid generator subtype",
            },
        },

        // Vendor-specific fields
        vendor_business_name: String,
        vendor_business_type: String,
        vendor_location: String,
        vendor_years: Number,
        vendor_registration: String,

        // NGO-specific fields
        ngo_hub_type: {
            type: String,
            enum: {
                values: ["NGO", "Hub"],
                message: "NGO/Hub type must be either NGO or Hub",
            },
        },
        ngo_name: String,
        ngo_registration: String,
        ngo_years: Number,
        ngo_focus: String,
        ngo_location: String,
        ngo_mission: String,

        // Hub-specific fields
        hub_name: String,
        hub_capacity: Number,
        hub_location: String,
        hub_availability: String,
        hub_description: String,
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

// Indexes for commonly queried fields
userSchema.index({ role: 1 });

// Virtual for checking if user is generator
userSchema.virtual("is_generator").get(function (this: IUser) {
    return this.role === "generator";
});

// Virtual for checking if user is vendor
userSchema.virtual("is_vendor").get(function (this: IUser) {
    return this.role === "vendor";
});

// Virtual for checking if user is NGO/Hub
userSchema.virtual("is_ngo_hub").get(function (this: IUser) {
    return this.role === "ngo-hub";
});

// Create and export the model
const User: Model<IUser> = model<IUser>("User", userSchema);
export default User;

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
    wallet_pin?: string; // Hashed PIN
    secret_phrase?: string[]; // Recovery phrase words
    created_at: Date;
    updated_at: Date;
}

// Waste Generator specific fields
interface IGeneratorUser extends IUserCommon {
    generator_subtype?: GeneratorSubtype;
}

// Vendor specific fields
interface IVendorUser extends IUserCommon {
    vendor_business_name?: string;
    vendor_business_type?: string;
    vendor_location?: string;
    vendor_years?: number;
}

// NGO specific fields
interface INGOUser extends IUserCommon {
    ngo_hub_type?: "NGO";
    ngo_name?: string;
    ngo_registration?: string;
    ngo_years?: number;
    ngo_focus?: string;
    ngo_location?: string;
    ngo_mission?: string;
}

// Hub specific fields
interface IHubUser extends IUserCommon {
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

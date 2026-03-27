import { Schema, Document, model } from "mongoose";

interface IReferral extends Document {
    user: Schema.Types.ObjectId; // User who owns this referral
    code: string;
    link: string;
    bonus_amount: number; // ₦ per successful referral
    clicks: number; // Number of times link was clicked
    successful_referrals: number; // Number of successful signups using this code
    total_earnings: number; // Total earnings from referrals
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const referralSchema = new Schema<IReferral>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
        unique: true,
    },
    code: {
        type: String,
        required: [true, "Referral code is required"],
        unique: true,
        trim: true,
    },
    link: {
        type: String,
        required: [true, "Referral link is required"],
    },
    bonus_amount: {
        type: Number,
        default: 50, // ₦50 per successful referral
    },
    clicks: {
        type: Number,
        default: 0,
    },
    successful_referrals: {
        type: Number,
        default: 0,
    },
    total_earnings: {
        type: Number,
        default: 0,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

const Referral = model<IReferral>("Referral", referralSchema);

export default Referral;

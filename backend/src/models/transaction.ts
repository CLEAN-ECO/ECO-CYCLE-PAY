import { Schema, Document, model } from "mongoose";

type TransactionType = "crediting" | "withdrawal" | "referral_bonus" | "platform_fee" | "reversal";

type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface ITransaction extends Document {
    user: Schema.Types.ObjectId;
    amount: number; // ₦
    type: TransactionType;
    status: TransactionStatus;
    description: string;
    reference?: string; // Reference to waste submission, referral, etc.
    balance_before: number;
    balance_after: number;
    metadata?: Record<string, unknown>;
    created_at: Date;
    completed_at?: Date;
}

const transactionSchema = new Schema<ITransaction>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"],
    },
    type: {
        type: String,
        enum: {
            values: ["crediting", "withdrawal", "referral_bonus", "platform_fee", "reversal"],
            message: "Invalid transaction type",
        },
        required: [true, "Transaction type is required"],
    },
    status: {
        type: String,
        enum: {
            values: ["pending", "completed", "failed", "cancelled"],
            message: "Invalid transaction status",
        },
        default: "pending",
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    reference: String,
    balance_before: {
        type: Number,
        required: [true, "Balance before is required"],
    },
    balance_after: {
        type: Number,
        required: [true, "Balance after is required"],
    },
    metadata: Schema.Types.Mixed,
    created_at: {
        type: Date,
        default: Date.now,
    },
    completed_at: Date,
});

// Indexes for faster queries
transactionSchema.index({ user: 1, created_at: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ reference: 1 });

const Transaction = model<ITransaction>("Transaction", transactionSchema);

export default Transaction;

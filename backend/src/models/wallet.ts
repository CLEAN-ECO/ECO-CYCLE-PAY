import { Schema, Document, model } from "mongoose";

export interface IWallet extends Document {
    user: Schema.Types.ObjectId;
    balance: number;
    total_earned: number;
    total_withdrawn: number;
    last_transaction_date?: Date;
    created_at: Date;
    updated_at: Date;
}

const walletSchema = new Schema<IWallet>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: [0, "Balance cannot be negative"],
        },
        total_earned: {
            type: Number,
            default: 0,
            min: [0, "Total earned cannot be negative"],
        },
        total_withdrawn: {
            type: Number,
            default: 0,
            min: [0, "Total withdrawn cannot be negative"],
        },
        last_transaction_date: {
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

const Wallet = model<IWallet>("Wallet", walletSchema);

export default Wallet;

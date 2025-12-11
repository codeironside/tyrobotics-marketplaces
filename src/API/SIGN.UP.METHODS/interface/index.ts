import { Date, Document, Types } from "mongoose";

export interface ISignpmethods extends Document {
    id: Types.ObjectId;
    name: string;
    canSignUpwith: boolean;
    canLoginWith: boolean;
    createdAt: Date;
    updatedAt: Date;
}

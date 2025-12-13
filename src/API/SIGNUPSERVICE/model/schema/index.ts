import { Schema, model, type InferSchemaType } from "mongoose";

const signupSessionSchema = new Schema(
  {
    sessionToken: { type: String, required: true, unique: true, index: true },
    provider: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    profileData: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: true, expires: 1800 },
    metadata: { ipAddress: String, userAgent: String },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

type SignupSessionDoc = InferSchemaType<typeof signupSessionSchema>;

export const SignupSession = model<SignupSessionDoc>(
  "SignupSession",
  signupSessionSchema
);

import { Schema, model } from "mongoose";
import { ISignUpSession } from "API/SIGNUPSERVICE/interface";

const signupSessionSchema = new Schema<ISignUpSession>({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  provider: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  profileData: {
    type: Schema.Types.Mixed,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
    expires: 1800, // 30 minutes in seconds
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const SignupSession = model<ISignUpSession>(
  "SignupSession",
  signupSessionSchema
);

import { Types, Document, Mixed, Date } from "mongoose";

type MetaData = {
  ipAddress: string;
  userAgent: string;
};
export interface ISignUpSession extends Document {
  _id: Types.ObjectId;
  avatar: string;
  sessionToken: string;
  provider: string;
  email: string;
  firstName: string;
  lastName: string;
  profileData: Mixed;
  expiresAt: Date;
  metadata: MetaData;
  createdAt: Date;
}

export interface ISignUpSessionResponse {
  avatar: string;
  sessionToken: string;

  email: string;
  firstName: string;
  lastName: string;
}

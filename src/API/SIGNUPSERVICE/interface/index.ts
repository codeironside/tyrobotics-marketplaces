import { Types, Document, Mixed, Date } from "mongoose";

type MetaData = {
  ipAddress: string;
  userAgent: string;
};
export interface ISignUpSession extends Document {
  _id: Types.ObjectId;
  sessionToken: string;
  provider: string;
  email: string;
  profileData: Mixed;
  expiresAt: Date;
  metadata: MetaData;
  createdAt: Date;
}

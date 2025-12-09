import { Document, Types } from 'mongoose';
import{ Role} from "../../../../CORE/constants"

export interface IRole extends Document {
  _id: Types.ObjectId;
  name: Role;
  level: number; 
  permissions: string[];
  description?: string;
  isActive: boolean;
canSignUp:boolean;
canLogin:boolean
  createdAt: Date;
  updatedAt: Date;
}
import { Schema, model } from 'mongoose';
import {IRole} from "../interface"
import{ Role} from "../../../../CORE/constants"

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      enum: Object.values(Role),
      required: true,
      unique: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1, 
    },
    permissions: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    canSignUp: {
      type: Boolean,
      default: true,
    },
    canLogin: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

roleSchema.index({ level: 1 });

const RoleModel = model<IRole>('Role', roleSchema);



export class Roles {
  public static async create(data: Partial<IRole>): Promise<IRole> {
    
    return await RoleModel.create(data);
  }

  public static async findByName(name: Role): Promise<IRole | null> {
    return await RoleModel.findOne({ name, isActive: true });
  }

  public static async findById(id: string): Promise<IRole | null> {
    return await RoleModel.findById(id);
  }

  public static async findAll(): Promise<IRole[]> {
    return await RoleModel.find({ isActive: true }).sort({ level: 1 });
  }

  public static async updatePermissions(name: Role, permissions: string[]): Promise<IRole | null> {
    return await RoleModel.findOneAndUpdate(
      { name },
      { $set: { permissions } },
      { new: true }
    );
  }

  public static async delete(name: Role): Promise<IRole | null> {
    return await RoleModel.findOneAndUpdate(
      { name },
      { $set: { isActive: false } },
      { new: true }
    );
  }
}
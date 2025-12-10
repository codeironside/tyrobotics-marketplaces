import { Schema, model } from "mongoose";
import { IRole } from "../interface";
import { Role } from "../../../CORE/constants";
import { Logger } from "../../../CORE/utils/logger";
import { AppError } from "../../../CORE/utils/errorhandler";
import z from "zod";
const createRoleSchema = z.object({
  name: z.nativeEnum(Role),
  level: z.number().min(1, "number must be greater than one "),
  permissions: z.array(z.string()).default([]),
  descriptions: z.string().optional(),
  isActive: z.boolean().default(true),
  canSignUp: z.boolean().default(true),
  canLogin: z.boolean().default(true),
});

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
roleSchema.index({ name: 1 });

const RoleModel = model<IRole>("Role", roleSchema);

export class Roles {
  public static async create(data: Partial<IRole>): Promise<IRole> {
    try {
      const validatedata = createRoleSchema.parse(data);

      const role = await RoleModel.create(validatedata);
      Logger.info(`Role created successfully: ${role.name}`);
      return role;
    } catch (error: any) {
      console.log(error)
      Logger.error(`Error creating role: ${error.message}`);
      if (error.code === 11000) {
        throw new AppError(409, "Role already exists");
      }
      throw new AppError(500, "Database error while creating role");
    }
  }

  public static async findByName(name: Role): Promise<IRole | null> {
    try {
      return await RoleModel.findOne({ name, isActive: true });
    } catch (error: any) {
      Logger.error(`Error finding role by name: ${name} - ${error.message}`);
      throw new AppError(500, "Database error while fetching role");
    }
  }

  public static async findById(id: string): Promise<IRole | null> {
    try {
      return await RoleModel.findById(id);
    } catch (error: any) {
      Logger.error(`Error finding role by ID: ${id} - ${error.message}`);
      throw new AppError(500, "Database error while fetching role by ID");
    }
  }

  public static async findAll(): Promise<IRole[]> {
    try {
      return await RoleModel.find({ isActive: true }).sort({ level: 1 });
    } catch (error: any) {
      Logger.error(`Error fetching all roles: ${error.message}`);
      throw new AppError(500, "Database error while fetching roles");
    }
  }
  public static async canLogin(): Promise<IRole[]> {
    try {
      return await RoleModel.find({ canLogin: true });
    } catch (error: any) {
      Logger.error(`Error fetching login Roles${error}`);
      throw new AppError(500, "Error while fetching all roles");
    }
  }
  public static async canSignUp(): Promise<IRole[]> {
    try {
      return await RoleModel.find({ canSignUp: true });
    } catch (error: any) {
      Logger.error(`Error fetching login Roles${error}`);
      throw new AppError(500, "Error while fetching all roles");
    }
  }

  public static async updatePermissions(
    name: Role,
    permissions: string[]
  ): Promise<IRole | null> {
    try {
      const role = await RoleModel.findOneAndUpdate(
        { name },
        { $set: { permissions } },
        { new: true }
      );

      if (!role) {
        throw new AppError(404, "Role not found");
      }

      Logger.info(`Permissions updated for role: ${name}`);
      return role;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      Logger.error(`Error updating permissions for ${name}: ${error.message}`);
      throw new AppError(500, "Database error while updating permissions");
    }
  }

  public static async delete(name: Role): Promise<IRole | null> {
    try {
      const role = await RoleModel.findOneAndUpdate(
        { name },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!role) {
        throw new AppError(404, "Role not found");
      }

      Logger.warn(`Role soft-deleted: ${name}`);
      return role;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      Logger.error(`Error deleting role ${name}: ${error.message}`);
      throw new AppError(500, "Database error while deleting role");
    }
  }
}

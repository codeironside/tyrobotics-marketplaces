import { Schema, model } from "mongoose";
import { ISignpmethods } from "../interface";
import { SocialSignIns } from "../../../CORE/constants";
import { Logger } from "../../../CORE/utils/logger";
import { AppError } from "../../../CORE/utils/errorhandler";
import z from "zod";
const createSocialSigns = z.object({
  name: z.nativeEnum(SocialSignIns),
  canSignUpwith: z.boolean().default(true),
  canLoginWith: z.boolean().default(true),
});

const SocialsSchema = new Schema<ISignpmethods>(
  {
    name: {
      type: String,
      enum: Object.values(SocialSignIns),
      required: true,
      unique: true,
    },

    canSignUpwith: {
      type: Boolean,
      default: true,
    },
    canLoginWith: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

SocialsSchema.index({ name: 1 });

const SocialsModel = model<ISignpmethods>("Socials", SocialsSchema);

export class Socials {
  public static async create(
    data: Partial<ISignpmethods>
  ): Promise<ISignpmethods> {
    try {
      const validatedata = createSocialSigns.parse(data);

      const socials = await SocialsModel.create(validatedata);
      Logger.info(`${socials.name} social created successfully`);
      return socials;
    } catch (error: any) {
      console.log(error);
      Logger.error(`Error creating role: ${error.message}`);
      if (error.code === 11000) {
        throw new AppError(409, "Socials already exists");
      }
      throw new AppError(500, "Database error while creating role");
    }
  }

  public static async findByName(
    name: SocialSignIns
  ): Promise<ISignpmethods | null> {
    try {
      return await SocialsModel.findOne({ name, isActive: true });
    } catch (error: any) {
      Logger.error(`Error finding socials by name: ${name} - ${error.message}`);
      throw new AppError(500, "Database error while fetching role");
    }
  }

  public static async findById(id: string): Promise<ISignpmethods | null> {
    try {
      return await SocialsModel.findById(id);
    } catch (error: any) {
      Logger.error(`Error finding socials by ID: ${id} - ${error.message}`);
      throw new AppError(500, "Database error while fetching role by ID");
    }
  }

  public static async findAll(): Promise<ISignpmethods[]> {
    try {
      return await SocialsModel.find({ isActive: true }).sort({ level: 1 });
    } catch (error: any) {
      Logger.error(`Error fetching all socials: ${error.message}`);
      throw new AppError(500, "Database error while fetching roles");
    }
  }
  public static async canLogin(): Promise<ISignpmethods[]> {
    try {
      return await SocialsModel.find({ canLoginWith: true });
    } catch (error: any) {
      Logger.error(`Error fetching login socials${error}`);
      throw new AppError(500, "Error while fetching all socials");
    }
  }
  public static async canSignUp(): Promise<ISignpmethods[]> {
    try {
      return await SocialsModel.find({ canSignUpwith: true });
    } catch (error: any) {
      Logger.error(`Error fetching login socials${error}`);
      throw new AppError(500, "Error while fetching all socials");
    }
  }

  public static async updatePermissions(
    name: SocialSignIns,
    permissions: string[]
  ): Promise<ISignpmethods | null> {
    try {
      const socials = await SocialsModel.findOneAndUpdate(
        { name },
        { $set: { permissions } },
        { new: true }
      );

      if (!socials) {
        throw new AppError(404, "Role not found");
      }

      Logger.info(`Permissions updated for role: ${name}`);
      return socials;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      Logger.error(`Error updating r ${name}: ${error.message}`);
      throw new AppError(500, "Database error while updating permissions");
    }
  }

  public static async delete(
    name: SocialSignIns
  ): Promise<ISignpmethods | null> {
    try {
      const socials = await SocialsModel.findOneAndUpdate(
        { name },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!socials) {
        throw new AppError(404, "socials not found");
      }

      Logger.warn(`Role soft-deleted: ${name}`);
      return socials;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      Logger.error(`Error deleting social ${name}: ${error.message}`);
      throw new AppError(500, "Database error while deleting social");
    }
  }
}

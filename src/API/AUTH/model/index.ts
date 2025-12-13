import { Types, ClientSession } from "mongoose";
import { UserModel } from './schema';
import { IUser } from '../interface'; 
import { AppError } from '../../../CORE/utils/errorhandler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class User {
  static async createUserWithSocial(
    socialProfile: {
      provider: string;
      providerId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
      emailVerified: boolean;
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
    },
    selectedRoles: Array<{
      _id: Types.ObjectId;
      name: string;
      level: number;
      canLogin: boolean;
    }>,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      signupSource: 'web' | 'mobile' | 'api';
      referralCode?: string;
      campaign?: string;
    }
  ): Promise<IUser> {
    const session = await UserModel.startSession();
    
    try {
      session.startTransaction();

      const existingAuth = await UserModel.findOne({
        'authMethods.provider': socialProfile.provider,
        'authMethods.providerId': socialProfile.providerId
      }).session(session);

      if (existingAuth) {
        throw new AppError(409, 'Account already exists with this social profile');
      }

      const existingEmail = await UserModel.findOne({
        email: socialProfile.email.toLowerCase()
      }).session(session);

      if (existingEmail) {
        throw new AppError(409, 'Email already registered');
      }

      const requiredFields = this.getRequiredFieldsForRoles(selectedRoles);

      const userData = {
        email: socialProfile.email.toLowerCase(),
        firstName: socialProfile.firstName,
        lastName: socialProfile.lastName,
        avatar: socialProfile.avatar,
        isEmailVerified: socialProfile.emailVerified,
        isActive: true,
        isProfileComplete: false,
        roles: selectedRoles.map(role => ({
          roleId: role._id,
          name: role.name,
          level: role.level,
          assignedAt: new Date(),
          isActive: true,
          canLogin: role.canLogin
        })),
        authMethods: [{
          provider: socialProfile.provider,
          providerId: socialProfile.providerId,
          accessToken: socialProfile.accessToken,
          refreshToken: socialProfile.refreshToken,
          expiresAt: socialProfile.expiresAt,
          createdAt: new Date(),
          lastUsedAt: new Date(),
          isPrimary: true
        }],
        security: {
          twoFactorEnabled: false,
          loginAttempts: 0
        },
        metadata: {
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          signupSource: metadata.signupSource,
          referralCode: metadata.referralCode,
          campaign: metadata.campaign
        },
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          smsNotifications: false,
          newsletterSubscription: false,
          theme: 'auto'
        },
        profileCompletion: {
          personalInfo: false,
          contactInfo: false,
          preferences: false,
          requiredFields
        },
        signupStatus: {
          step: 'initial',
          completedSteps: ['social_auth', 'role_selection'],
          currentStep: 'profile_info',
          startedAt: new Date()
        }
      };

      const user = await UserModel.create([userData], { session });

      await session.commitTransaction();
      
      return user[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async createUserWithEmail(
    email: string,
    password: string,
    selectedRoles: Array<{
      _id: Types.ObjectId;
      name: string;
      level: number;
      canLogin: boolean;
    }>,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      signupSource: 'web' | 'mobile' | 'api';
      referralCode?: string;
      campaign?: string;
    }
  ): Promise<IUser> {
    const session = await UserModel.startSession();
    
    try {
      session.startTransaction();

      const existingUser = await UserModel.findOne({
        email: email.toLowerCase()
      }).session(session);

      if (existingUser) {
        throw new AppError(409, 'Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const requiredFields = this.getRequiredFieldsForRoles(selectedRoles);

      const userData = {
        email: email.toLowerCase(),
        isEmailVerified: false,
        isActive: true,
        isProfileComplete: false,
        roles: selectedRoles.map(role => ({
          roleId: role._id,
          name: role.name,
          level: role.level,
          assignedAt: new Date(),
          isActive: true,
          canLogin: role.canLogin
        })),
        authMethods: [{
          provider: 'email',
          providerId: email.toLowerCase(),
          createdAt: new Date(),
          lastUsedAt: new Date(),
          isPrimary: true
        }],
        security: {
          passwordHash,
          passwordChangedAt: new Date(),
          twoFactorEnabled: false,
          loginAttempts: 0,
          lastPasswordChange: new Date()
        },
        metadata: {
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          signupSource: metadata.signupSource,
          referralCode: metadata.referralCode,
          campaign: metadata.campaign
        },
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          smsNotifications: false,
          newsletterSubscription: false,
          theme: 'auto'
        },
        profileCompletion: {
          personalInfo: false,
          contactInfo: false,
          preferences: false,
          requiredFields
        },
        signupStatus: {
          step: 'initial',
          completedSteps: ['email_registration', 'role_selection'],
          currentStep: 'email_verification',
          startedAt: new Date()
        }
      };

      const user = await UserModel.create([userData], { session });

      await session.commitTransaction();
      
      return user[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async completeSignup(
    userId: Types.ObjectId,
    updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: Date;
      gender?: 'male' | 'female' | 'other';
      country?: string;
      timezone?: string;
      language?: string;
      preferences?: {
        emailNotifications?: boolean;
        pushNotifications?: boolean;
        smsNotifications?: boolean;
        newsletterSubscription?: boolean;
        theme?: 'light' | 'dark' | 'auto';
      };
    }
  ): Promise<IUser> {
    const session = await UserModel.startSession();
    
    try {
      session.startTransaction();

      const user = await UserModel.findById(userId).session(session);

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (user.signupStatus.step === 'completed') {
        throw new AppError(400, 'Signup already completed');
      }

      const updates: any = {
        ...updateData,
        signupStatus: {
          step: 'profile',
          completedSteps: [...user.signupStatus.completedSteps, 'profile_info'],
          currentStep: 'verification',
          startedAt: user.signupStatus.startedAt
        }
      };

      const completedUser = await UserModel.findByIdAndUpdate(
        userId,
        updates,
        { new: true, session }
      );

      await this.checkAndCompleteProfile(userId, completedUser, session);

      await session.commitTransaction();
      
      return completedUser;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async markSignupCompleted(
    userId: Types.ObjectId,
    completedStep: string
  ): Promise<IUser> {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const completedSteps = [...user.signupStatus.completedSteps, completedStep];
    const allRequiredSteps = ['role_selection', 'profile_info', 'verification'];
    const isCompleted = allRequiredSteps.every(step => completedSteps.includes(step));

    const updateData: any = {
      'signupStatus.completedSteps': completedSteps,
      'signupStatus.currentStep': isCompleted ? 'completed' : user.signupStatus.currentStep,
      'signupStatus.step': isCompleted ? 'completed' : user.signupStatus.step
    };

    if (isCompleted) {
      updateData['signupStatus.completedAt'] = new Date();
      updateData.isProfileComplete = true;
    }

    return await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
  }

  private static async checkAndCompleteProfile(
    userId: Types.ObjectId,
    user: IUser,
    session: any
  ): Promise<void> {
    const isProfileComplete = 
      user.firstName &&
      user.lastName &&
      user.country &&
      user.timezone &&
      user.language;

    if (isProfileComplete) {
      user.profileCompletion.personalInfo = true;
      user.profileCompletion.contactInfo = true;
      user.profileCompletion.completedAt = new Date();
      user.isProfileComplete = true;
      
      await user.save({ session });
    }
  }

  private static getRequiredFieldsForRoles(
    roles: Array<{ name: string; level: number }>
  ): string[] {
    const requiredFields = ['firstName', 'lastName', 'country', 'timezone'];
    
    const roleNames = roles.map(r => r.name);
    const roleLevels = roles.map(r => r.level);

    if (roleNames.includes('Admin') || Math.max(...roleLevels) >= 5) {
      requiredFields.push('phone', 'dateOfBirth');
    }

    if (roleNames.includes('Developer') || roleNames.includes('Manager')) {
      requiredFields.push('timezone', 'language');
    }

    return [...new Set(requiredFields)];
  }

  static async findById(userId: Types.ObjectId): Promise<IUser | null> {
    return await UserModel.findById(userId);
  }

  static async findByEmail(
  email: string,
  session?: ClientSession
): Promise<IUser | null> {
  return UserModel.findOne({ email: email.toLowerCase() }).session(session ?? null);
}

  static async findBySocialProvider(
    provider: string,
    providerId: string
  ): Promise<IUser | null> {
    return await UserModel.findOne({
      'authMethods.provider': provider,
      'authMethods.providerId': providerId
    });
  }

  static async addAuthMethod(
    userId: Types.ObjectId,
    authMethod: {
      provider: string;
      providerId: string;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
    }
  ): Promise<IUser> {
    return await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          authMethods: {
            ...authMethod,
            createdAt: new Date(),
            lastUsedAt: new Date(),
            isPrimary: false
          }
        }
      },
      { new: true }
    );
  }

  static async updateLastLogin(userId: Types.ObjectId): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        lastLoginAt: new Date(),
        'security.loginAttempts': 0,
        'security.lockUntil': null
      }
    );
  }

  static async incrementLoginAttempts(userId: Types.ObjectId): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $inc: { 'security.loginAttempts': 1 }
      }
    );

    const user = await UserModel.findById(userId);
    
    if (user && user.security.loginAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await UserModel.findByIdAndUpdate(
        userId,
        { 'security.lockUntil': lockUntil }
      );
    }
  }

  static async resetPassword(
    userId: Types.ObjectId,
    newPassword: string
  ): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    await UserModel.findByIdAndUpdate(
      userId,
      {
        'security.passwordHash': passwordHash,
        'security.passwordChangedAt': new Date(),
        'security.lastPasswordChange': new Date(),
        'security.loginAttempts': 0,
        'security.lockUntil': null
      }
    );
  }

  static async verifyEmail(userId: Types.ObjectId): Promise<IUser> {
    return await UserModel.findByIdAndUpdate(
      userId,
      {
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      },
      { new: true }
    );
  }

  static async verifyPhone(userId: Types.ObjectId): Promise<IUser> {
    return await UserModel.findByIdAndUpdate(
      userId,
      {
        isPhoneVerified: true,
        phoneVerifiedAt: new Date()
      },
      { new: true }
    );
  }

  static async updateRoles(
    userId: Types.ObjectId,
    newRoles: Array<{
      roleId: Types.ObjectId;
      name: string;
      level: number;
      canLogin: boolean;
    }>
  ): Promise<IUser> {
    return await UserModel.findByIdAndUpdate(
      userId,
      {
        roles: newRoles.map(role => ({
          roleId: role.roleId,
          name: role.name,
          level: role.level,
          assignedAt: new Date(),
          isActive: true,
          canLogin: role.canLogin
        }))
      },
      { new: true }
    );
  }

  static async deactivateAccount(userId: Types.ObjectId): Promise<IUser> {
    return await UserModel.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        deletedAt: new Date()
      },
      { new: true }
    );
  }

  static async reactivateAccount(userId: Types.ObjectId): Promise<IUser> {
    return await UserModel.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        deletedAt: null
      },
      { new: true }
    );
  }

  static async generateTwoFactorSecret(userId: Types.ObjectId): Promise<string> {
    const secret = crypto.randomBytes(20).toString('hex');
    
    await UserModel.findByIdAndUpdate(
      userId,
      {
        'security.twoFactorSecret': secret,
        'security.twoFactorRecoveryCodes': Array.from({ length: 8 }, () => 
          crypto.randomBytes(5).toString('hex').toUpperCase()
        )
      }
    );

    return secret;
  }

  static async enableTwoFactor(userId: Types.ObjectId): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        'security.twoFactorEnabled': true
      }
    );
  }

  static async disableTwoFactor(userId: Types.ObjectId): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        'security.twoFactorEnabled': false,
        'security.twoFactorSecret': null,
        'security.twoFactorRecoveryCodes': []
      }
    );
  }

  static async findUsersByRole(roleName: string): Promise<IUser[]> {
    return await UserModel.find({
      'roles.name': roleName,
      'roles.isActive': true,
      isActive: true
    });
  }

  static async findUsersByLevel(minLevel: number): Promise<IUser[]> {
    return await UserModel.find({
      'roles.level': { $gte: minLevel },
      'roles.isActive': true,
      isActive: true
    });
  }

  static async findIncompleteSignups(days: number = 7): Promise<IUser[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await UserModel.find({
      'signupStatus.step': { $ne: 'completed' },
      createdAt: { $gte: cutoffDate },
      isActive: true
    });
  }

  static async deleteOldIncompleteSignups(days: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const result = await UserModel.deleteMany({
      'signupStatus.step': { $ne: 'completed' },
      createdAt: { $lt: cutoffDate },
      isActive: true
    });

    return result.deletedCount;
  }
}

export const API_VERSION: string = "/api/v1";

export enum Role {
  SUPER_ADMIN = "SuperAdmin",
  ADMIN = "Admin",
  FRONTEND = "Frontend",
  BACKEND = "Backend",
  PRODUCT_MANAGER = "ProductManagers",
  PRODUCT_DESIGNER = "ProductDesigners",
  SELLER = "Seller",
  BUYER = "Buyer",
}

export const ROLES_FETCHED_SUCCESSFUL = "ALL ROlES GOTTEN SUCCESSFUL";
export const ROLE_CREATED = "ROLE CREATED";
export const SOCIALS_CREATED = "SOCIALS CREATED";
export const SOCIALS_FETCHED_SUCCESSFUL = "ALL SOCIALS GOTTEN SUCCESSFUL";
export const SIGN_UP_INITIATED = "SIGN UP INITIATED";

export enum SocialSignIns {
  EMAIL = "email",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  GITHUB = "github",
  LINKEDIN = "linkedin",
  TWITTER = "twitter",
}

export const API_VERSION:string = "/api/v1"

export enum Role {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  PRODUCT_MANAGER = 'ProductManagers',
  PRODUCT_DESIGNER = 'ProductDesigners',
  SELLER = 'Seller',
  BUYER = 'Buyer'
}

export const ROLES_FETCHED_SUCCESSFUL ="ALL ROlES GOTTEN SUCCESSFUL"
export const ROLE_CREATED ="ROLE CREATED"
import "module-alias/register";
import swaggerJsDoc from "swagger-jsdoc";
import { config } from "../CORE/utils/config";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tyrobotics Marketplaces API",
      version: "1.0.0",
    },
  },
 
  apis: ["./src/APP/AppRouter/index.ts", "./src/app/routes.ts"],
};

try {
  console.log("🔍 Validating Swagger JSDoc comments...");
  const specs = swaggerJsDoc(swaggerOptions);
  console.log("✅ Swagger validation passed! Docs generated successfully.");
} catch (error: any) {
  console.error("❌ Swagger Validation Failed:");
  console.error(error.message);
  process.exit(1);
}

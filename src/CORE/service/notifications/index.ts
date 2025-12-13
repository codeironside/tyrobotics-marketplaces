
export * from "./interfaces";
export { NotificationDispatcher } from "./dispatcher";
export { EmailService } from "./channels/emails";
export { SMSService } from "./channels/sms";
export { WhatsAppService } from "./channels/whatsapp";
export { PushService } from "./channels/push.notifications";
export { InAppService } from "./channels/app";
export { TemplateManager } from "./templates/manager";

import { NotificationDispatcher } from "./dispatcher";

export const notificationDispatcher = new NotificationDispatcher();

export default notificationDispatcher;

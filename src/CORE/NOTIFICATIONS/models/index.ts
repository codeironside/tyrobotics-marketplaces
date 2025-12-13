import { Schema, model } from "mongoose";
import { INotification } from "../../constants";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "transaction",
        "security",
        "account",
        "payment",
        "system",
        "marketing",
        "social",
        "alert",
        "reminder",
        "update",
        "verification",
        "support",
        "announcement",
      ],
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "financial",
        "security",
        "account",
        "system",
        "marketing",
        "social",
        "transaction",
        "alert",
        "info",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      read: {
        type: Boolean,
        default: false,
      },
      readAt: {
        type: Date,
      },
      archived: {
        type: Boolean,
        default: false,
      },
      archivedAt: {
        type: Date,
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      expiresAt: {
        type: Date,
      },
      actionRequired: {
        type: Boolean,
        default: false,
      },
      actionUrl: {
        type: String,
      },
      actionLabel: {
        type: String,
      },
      actionCompleted: {
        type: Boolean,
        default: false,
      },
      actionCompletedAt: {
        type: Date,
      },
    },
    channels: {
      inApp: {
        type: Boolean,
        default: false,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      whatsapp: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    deliveryStatus: {
      inApp: {
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        read: {
          type: Boolean,
          default: false,
        },
        readAt: Date,
      },
      email: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        opened: {
          type: Boolean,
          default: false,
        },
        openedAt: Date,
        clicked: {
          type: Boolean,
          default: false,
        },
        clickedAt: Date,
        providerResponse: Schema.Types.Mixed,
        error: String,
      },
      sms: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        providerResponse: Schema.Types.Mixed,
        error: String,
      },
      whatsapp: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        read: {
          type: Boolean,
          default: false,
        },
        readAt: Date,
        providerResponse: Schema.Types.Mixed,
        error: String,
      },
      push: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        opened: {
          type: Boolean,
          default: false,
        },
        openedAt: Date,
        providerResponse: Schema.Types.Mixed,
        error: String,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, "metadata.read": 1 });
notificationSchema.index({ userId: 1, "metadata.archived": 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, category: 1 });
notificationSchema.index({ "metadata.priority": 1 });
notificationSchema.index({ "metadata.expiresAt": 1 });
notificationSchema.index({ createdAt: -1 });

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema
);

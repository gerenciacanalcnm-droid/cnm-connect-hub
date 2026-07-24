export const SMS_STATUS = {
  queued: "queued",
  sending: "sending",
  sent: "sent",
  delivered: "delivered",
  failed: "failed",
  rejected: "rejected",
} as const;
export type SmsStatus = (typeof SMS_STATUS)[keyof typeof SMS_STATUS];

export const CAMPAIGN_STATUS = {
  draft: "draft",
  scheduled: "scheduled",
  running: "running",
  paused: "paused",
  completed: "completed",
  canceled: "canceled",
  failed: "failed",
} as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const USER_STATUS = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
  invited: "invited",
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

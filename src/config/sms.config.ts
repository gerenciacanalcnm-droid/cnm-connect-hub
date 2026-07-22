export const smsConfig = {
  maxLength: 160,
  maxLengthUnicode: 70,
  senderIdMaxLength: 11,
  defaultCountry: "CO",
  defaultCurrency: "COP",
  minRechargeAmount: 150_000,
} as const;

export type SmsConfig = typeof smsConfig;

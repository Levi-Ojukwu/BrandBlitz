import twilio from "twilio";
import { createError } from "../middleware/error";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const SERVICE_SID = process.env.TWILIO_SERVICE_SID!;

export async function sendVerificationCode(phoneNumber: string): Promise<void> {
  await client.verify.v2.services(SERVICE_SID).verifications.create({
    to: phoneNumber,
    channel: "sms",
  });
}

export async function checkVerificationCode(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const result = await client.verify.v2
    .services(SERVICE_SID)
    .verificationChecks.create({ to: phoneNumber, code });

  return result.status === "approved";
}

export async function requirePhoneVerified(
  userId: string,
  phoneVerified: boolean
): Promise<void> {
  if (!phoneVerified) {
    throw createError(
      "Phone verification required before claiming rewards",
      403,
      "PHONE_VERIFICATION_REQUIRED"
    );
  }
}

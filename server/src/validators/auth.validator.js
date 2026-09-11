import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name cannot exceed 50 characters."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

// Name only — email/password/role changes are out of scope for this
// endpoint (see ADR-041; a self-service role change would be a security
// hole the same way registerSchema already guards against).
export const updateMeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name cannot exceed 50 characters."),
  })
  .strict();

// Password reset, 3-step OTP flow (ADR-062).

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  })
  .strict();

export const verifyResetOtpSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "Reset token is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
  })
  .strict();

// Passwordless OTP login, 2-step flow (ADR-064).

export const otpLoginRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  })
  .strict();

export const otpLoginVerifySchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
  })
  .strict();

import { createHash, timingSafeEqual } from "node:crypto";

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader, useSession } from "@tanstack/react-start/server";
import { z } from "zod";

import { DOCTOR } from "./clinic-types";

const SESSION_NAME = "comrades-clinic-doctor";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const DEVELOPMENT_SESSION_SECRET = "comrades-clinic-development-session-secret-change-me";
const DEVELOPMENT_DOCTOR_EMAIL = "doctor@lovableclinic.co.ke";
const DEVELOPMENT_DOCTOR_PASSWORD = "ComradeClinic150!";

type DoctorSessionData = {
  userId: string;
  email: string;
  name: string;
  role: "doctor";
  authenticatedAt: string;
};

export interface AuthenticatedDoctor {
  id: string;
  email: string;
  name: string;
  role: "doctor";
}

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

function isProduction() {
  return process.env["NODE_ENV"] === "production";
}

function requiredProductionValue(name: string, developmentValue: string) {
  const value = process.env[name]?.trim();

  if (value) return value;
  if (!isProduction()) return developmentValue;

  throw new Error(`${name} must be configured before the doctor portal can be used.`);
}

function sessionSecret() {
  const secret = requiredProductionValue("SESSION_SECRET", DEVELOPMENT_SESSION_SECRET);

  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return secret;
}

function useDoctorSession() {
  return useSession<DoctorSessionData>({
    name: SESSION_NAME,
    password: sessionSecret(),
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction(),
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  });
}

function configuredCredentials() {
  return {
    email: requiredProductionValue("DOCTOR_EMAIL", DEVELOPMENT_DOCTOR_EMAIL).toLowerCase(),
    password: requiredProductionValue("DOCTOR_PASSWORD", DEVELOPMENT_DOCTOR_PASSWORD),
  };
}

/** Compare fixed-length hashes so credential checks do not leak prefix timing. */
function credentialsMatch(actual: string, expected: string) {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function preventAuthResponseCaching() {
  setResponseHeader("Cache-Control", "private, no-store, max-age=0");
  setResponseHeader("Vary", "Cookie, Origin");
}

export const getCurrentDoctor = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthenticatedDoctor | null> => {
    preventAuthResponseCaching();
    const session = await useDoctorSession();
    const { userId, email, name, role } = session.data;

    if (!userId || !email || !name || role !== "doctor") return null;

    return {
      id: userId,
      email,
      name,
      role,
    };
  },
);

export const loginDoctor = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    preventAuthResponseCaching();
    const credentials = configuredCredentials();
    const emailMatches = credentialsMatch(data.email.toLowerCase(), credentials.email);
    const passwordMatches = credentialsMatch(data.password, credentials.password);

    if (!emailMatches || !passwordMatches) {
      return {
        ok: false as const,
        error: "The email or password is incorrect.",
      };
    }

    const session = await useDoctorSession();
    await session.update({
      userId: "doctor-primary",
      email: credentials.email,
      name: DOCTOR.name,
      role: "doctor",
      authenticatedAt: new Date().toISOString(),
    });

    return { ok: true as const };
  });

export const logoutDoctor = createServerFn({ method: "POST" }).handler(async () => {
  preventAuthResponseCaching();
  const session = await useDoctorSession();
  await session.clear();
  return { ok: true as const };
});

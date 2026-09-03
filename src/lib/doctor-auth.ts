import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader, useSession } from "@tanstack/react-start/server";
import { z } from "zod";

import { DOCTOR } from "./clinic-types";
import { supabase } from "./supabase";

const SESSION_NAME = "comrades-clinic-doctor";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const DEVELOPMENT_SESSION_SECRET = "comrades-clinic-development-session-secret-change-me";

type DoctorSessionData = {
  userId: string;
  email: string;
  name: string;
  role: "doctor" | "admin" | "psychiatrist";
  authenticatedAt: string;
};

export interface AuthenticatedDoctor {
  id: string;
  email: string;
  name: string;
  role: "doctor" | "admin" | "psychiatrist";
}

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

function isProduction() {
  return process.env["NODE_ENV"] === "production";
}

function sessionSecret() {
  const secret =
    process.env["SESSION_SECRET"]?.trim() || (!isProduction() ? DEVELOPMENT_SESSION_SECRET : "");

  if (secret.length < 32) {
    if (isProduction()) {
      throw new Error("SESSION_SECRET must contain at least 32 characters.");
    }
    return DEVELOPMENT_SESSION_SECRET;
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

function preventAuthResponseCaching() {
  setResponseHeader("Cache-Control", "private, no-store, max-age=0");
  setResponseHeader("Vary", "Cookie, Origin");
}

export const getCurrentDoctor = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthenticatedDoctor | null> => {
    preventAuthResponseCaching();
    const session = await useDoctorSession();
    const { userId, email, name, role } = session.data;

    if (
      !userId ||
      !email ||
      !name ||
      (role !== "doctor" && role !== "admin" && role !== "psychiatrist")
    )
      return null;

    return {
      id: userId,
      email,
      name,
      role,
    };
  },
);

/**
 * Role from the portal session cookie ("doctor" | "admin" | "psychiatrist"), or null when not
 * signed in. Used by admin server functions to gate management actions.
 */
export const getCurrentSessionRole = createServerFn({ method: "GET" }).handler(
  async (): Promise<"doctor" | "admin" | "psychiatrist" | null> => {
    preventAuthResponseCaching();
    const session = await useDoctorSession();
    const { role } = session.data;
    if (role !== "doctor" && role !== "admin" && role !== "psychiatrist") return null;
    return role;
  },
);

export const loginDoctor = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    preventAuthResponseCaching();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData?.user) {
      return {
        ok: false as const,
        error: "Invalid doctor email or password.",
      };
    }

    // Verify clinician role in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, kmpdc_license")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (
      profile?.role !== "doctor" &&
      profile?.role !== "admin" &&
      profile?.role !== "psychiatrist"
    ) {
      await supabase.auth.signOut();
      return {
        ok: false as const,
        error: "Access denied. This account does not have clinician authorization.",
      };
    }

    const session = await useDoctorSession();
    await session.update({
      userId: authData.user.id,
      email: authData.user.email || data.email,
      name: profile.full_name || DOCTOR.name,
      role: profile.role,
      authenticatedAt: new Date().toISOString(),
    });

    return { ok: true as const };
  });

export const logoutDoctor = createServerFn({ method: "POST" }).handler(async () => {
  preventAuthResponseCaching();
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore signOut errors if offline
  }
  const session = await useDoctorSession();
  await session.clear();
  return { ok: true as const };
});

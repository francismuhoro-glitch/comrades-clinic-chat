import { n as supabase, t as DOCTOR } from "./supabase-DdBqf3_N.mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
import { i as useSession$1, r as setResponseHeader } from "./request-response-Dtzl9ZrW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/doctor-auth-Bn2qx2NY.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var SESSION_NAME = "comrades-clinic-doctor";
var SESSION_MAX_AGE_SECONDS = 28800;
var DEVELOPMENT_SESSION_SECRET = "comrades-clinic-development-session-secret-change-me";
var loginSchema = objectType({
	email: stringType().trim().email().max(254),
	password: stringType().min(1).max(128)
});
function isProduction() {
	return true;
}
function sessionSecret() {
	const secret = process.env["SESSION_SECRET"]?.trim() || (!isProduction() ? DEVELOPMENT_SESSION_SECRET : "");
	if (secret.length < 32) {
		if (isProduction()) throw new Error("SESSION_SECRET must contain at least 32 characters.");
		return DEVELOPMENT_SESSION_SECRET;
	}
	return secret;
}
function useDoctorSession() {
	return useSession$1({
		name: SESSION_NAME,
		password: sessionSecret(),
		maxAge: SESSION_MAX_AGE_SECONDS,
		cookie: {
			httpOnly: true,
			sameSite: "lax",
			secure: isProduction(),
			path: "/",
			maxAge: SESSION_MAX_AGE_SECONDS
		}
	});
}
function preventAuthResponseCaching() {
	setResponseHeader("Cache-Control", "private, no-store, max-age=0");
	setResponseHeader("Vary", "Cookie, Origin");
}
var getCurrentDoctor_createServerFn_handler = createServerRpc({
	id: "cb8973e3c2513aeb12e755ab36d3b29a7802f298aaf140d5079a6e7fb6b89d34",
	name: "getCurrentDoctor",
	filename: "src/lib/doctor-auth.ts"
}, (opts) => getCurrentDoctor.__executeServer(opts));
var getCurrentDoctor = createServerFn({ method: "GET" }).handler(getCurrentDoctor_createServerFn_handler, async () => {
	preventAuthResponseCaching();
	const { userId, email, name, role } = (await useDoctorSession()).data;
	if (!userId || !email || !name || role !== "doctor") return null;
	return {
		id: userId,
		email,
		name,
		role
	};
});
var loginDoctor_createServerFn_handler = createServerRpc({
	id: "c7ad70a135faf71b84660278a0f80541176535fb9a7d22a9090dab5779ebf83a",
	name: "loginDoctor",
	filename: "src/lib/doctor-auth.ts"
}, (opts) => loginDoctor.__executeServer(opts));
var loginDoctor = createServerFn({ method: "POST" }).validator(loginSchema).handler(loginDoctor_createServerFn_handler, async ({ data }) => {
	preventAuthResponseCaching();
	const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
		email: data.email,
		password: data.password
	});
	if (authError || !authData?.user) return {
		ok: false,
		error: "Invalid doctor email or password."
	};
	const { data: profile } = await supabase.from("profiles").select("full_name, role, kmpdc_license").eq("id", authData.user.id).maybeSingle();
	if (profile?.role !== "doctor") {
		await supabase.auth.signOut();
		return {
			ok: false,
			error: "Access denied. This account does not have clinician authorization."
		};
	}
	await (await useDoctorSession()).update({
		userId: authData.user.id,
		email: authData.user.email || data.email,
		name: profile.full_name || DOCTOR.name,
		role: "doctor",
		authenticatedAt: (/* @__PURE__ */ new Date()).toISOString()
	});
	return { ok: true };
});
var logoutDoctor_createServerFn_handler = createServerRpc({
	id: "1feefb899edb7c03e4301d09b58ef8780347fb36ea743d0e3f6ad7c5f35952f8",
	name: "logoutDoctor",
	filename: "src/lib/doctor-auth.ts"
}, (opts) => logoutDoctor.__executeServer(opts));
var logoutDoctor = createServerFn({ method: "POST" }).handler(logoutDoctor_createServerFn_handler, async () => {
	preventAuthResponseCaching();
	try {
		await supabase.auth.signOut();
	} catch {}
	await (await useDoctorSession()).clear();
	return { ok: true };
});
//#endregion
export { getCurrentDoctor_createServerFn_handler, loginDoctor_createServerFn_handler, logoutDoctor_createServerFn_handler };

import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-DgjA_z9u.mjs";
import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/doctor-BdfMTmGj.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var loginSchema = objectType({
	email: stringType().trim().email().max(254),
	password: stringType().min(1).max(128)
});
var getCurrentDoctor = createServerFn({ method: "GET" }).handler(createSsrRpc("cb8973e3c2513aeb12e755ab36d3b29a7802f298aaf140d5079a6e7fb6b89d34"));
var loginDoctor = createServerFn({ method: "POST" }).validator(loginSchema).handler(createSsrRpc("c7ad70a135faf71b84660278a0f80541176535fb9a7d22a9090dab5779ebf83a"));
var logoutDoctor = createServerFn({ method: "POST" }).handler(createSsrRpc("1feefb899edb7c03e4301d09b58ef8780347fb36ea743d0e3f6ad7c5f35952f8"));
var $$splitComponentImporter = () => import("./doctor-Cte0K1bH.mjs");
var Route = createFileRoute("/doctor")({
	head: () => ({ meta: [
		{ title: "Doctor Portal — Lovable Student Clinic" },
		{
			name: "description",
			content: "Doctor dashboard for Lovable Student Clinic: manage the student queue, chat live, and issue prescriptions, referrals or lab requests."
		},
		{
			property: "og:title",
			content: "Doctor Portal — Lovable Student Clinic"
		},
		{
			property: "og:description",
			content: "Manage the student consultation queue, chat in real time, and issue digital prescriptions and referrals."
		},
		{
			name: "robots",
			content: "noindex, nofollow"
		}
	] }),
	loader: () => getCurrentDoctor(),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { loginDoctor as n, logoutDoctor as r, Route as t };

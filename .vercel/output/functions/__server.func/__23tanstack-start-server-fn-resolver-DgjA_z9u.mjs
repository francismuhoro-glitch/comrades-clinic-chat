//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-DgjA_z9u.js
var manifest = {
	"1feefb899edb7c03e4301d09b58ef8780347fb36ea743d0e3f6ad7c5f35952f8": {
		functionName: "logoutDoctor_createServerFn_handler",
		importer: () => import("./_ssr/doctor-auth-CAVotkN6.mjs")
	},
	"c7ad70a135faf71b84660278a0f80541176535fb9a7d22a9090dab5779ebf83a": {
		functionName: "loginDoctor_createServerFn_handler",
		importer: () => import("./_ssr/doctor-auth-CAVotkN6.mjs")
	},
	"cb8973e3c2513aeb12e755ab36d3b29a7802f298aaf140d5079a6e7fb6b89d34": {
		functionName: "getCurrentDoctor_createServerFn_handler",
		importer: () => import("./_ssr/doctor-auth-CAVotkN6.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };

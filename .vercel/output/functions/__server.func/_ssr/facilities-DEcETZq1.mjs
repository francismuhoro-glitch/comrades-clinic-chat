import { r as __toESM } from "../_runtime.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { i as Stethoscope, u as Send } from "../_libs/lucide-react.mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/facilities-DEcETZq1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function timeOf(iso) {
	return new Date(iso).toLocaleTimeString("en-KE", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function ChatWindow({ messages, viewer, onSend, disabled, disabledLabel = "This session has ended", className, emptyHint = "Say hello and describe how you are feeling." }) {
	const [draft, setDraft] = (0, import_react.useState)("");
	const endRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [messages.length]);
	const submit = () => {
		const body = draft.trim();
		if (!body || disabled) return;
		onSend(body);
		setDraft("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex min-h-0 flex-1 flex-col bg-gradient-surface", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5",
			children: [
				messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto max-w-xs rounded-xl bg-card px-4 py-3 text-center text-xs text-muted-foreground shadow-card",
					children: emptyHint
				}),
				messages.map((m) => {
					if (m.sender === "system") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground",
							children: m.body
						})
					}, m.id);
					const mine = m.sender === viewer;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("flex items-end gap-2", mine ? "justify-end" : "justify-start"),
						children: [!mine && m.sender === "doctor" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, { className: "size-3.5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card", mine ? "rounded-br-md bg-chat-student text-chat-student-foreground" : "rounded-bl-md bg-chat-doctor text-chat-doctor-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "whitespace-pre-wrap break-words",
								children: m.body
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("mt-1 text-[10px] tabular-nums", mine ? "text-chat-student-foreground/70" : "text-muted-foreground"),
								children: timeOf(m.created_at)
							})]
						})]
					}, m.id);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border-t bg-card px-3 py-3",
			children: disabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-muted px-4 py-3 text-center text-sm font-medium text-muted-foreground",
				children: disabledLabel
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex items-end gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					submit();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					rows: 1,
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							submit();
						}
					},
					placeholder: "Type your message…",
					className: "max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "icon",
					className: "size-11 shrink-0 rounded-full",
					disabled: !draft.trim(),
					"aria-label": "Send message",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
				})]
			})
		})]
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn(labelVariants(), className),
	...props
}));
Label.displayName = Root.displayName;
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var FALLBACK_FACILITIES = [
	{
		name: "Kenyatta National Hospital (KNH)",
		district: "Nairobi",
		facility_type: "National Referral Hospital",
		latitude: -1.3015,
		longitude: 36.8066,
		phone: "+254 20 272 6300",
		is_emergency: true,
		agency: "Ministry of Health",
		level: "Level 6",
		ownership: "public"
	},
	{
		name: "Moi Teaching and Referral Hospital (MTRH)",
		district: "Uasin Gishu",
		facility_type: "National Referral Hospital",
		latitude: .5143,
		longitude: 35.2797,
		phone: "+254 53 203 3471",
		is_emergency: true,
		agency: "Ministry of Health",
		level: "Level 6",
		ownership: "public"
	},
	{
		name: "Coast General Teaching & Referral Hospital",
		district: "Mombasa",
		facility_type: "County Referral Hospital",
		latitude: -4.0478,
		longitude: 39.6802,
		phone: "+254 41 231 4204",
		is_emergency: true,
		agency: "Ministry of Health",
		level: "Level 5",
		ownership: "public"
	},
	{
		name: "Jaramogi Oginga Odinga Teaching & Referral Hospital",
		district: "Kisumu",
		facility_type: "County Referral Hospital",
		latitude: -.0917,
		longitude: 34.7679,
		phone: "+254 57 202 0801",
		is_emergency: true,
		agency: "Ministry of Health",
		level: "Level 5",
		ownership: "public"
	},
	{
		name: "Nakuru Level 5 Teaching & Referral Hospital",
		district: "Nakuru",
		facility_type: "County Referral Hospital",
		latitude: -.2858,
		longitude: 36.0664,
		phone: "+254 51 221 5580",
		is_emergency: true,
		agency: "Ministry of Health",
		level: "Level 5",
		ownership: "public"
	}
];
/**
* Calculates distance between two coordinates in Kilometers (Haversine formula)
*/
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
	const R = 6371;
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Number((R * c).toFixed(1));
}
/**
* Generates Google Maps Turn-by-Turn Navigation URL
*/
function getGoogleMapsDirectionsUrl(destinationLat, destinationLng, userLat, userLng) {
	if (userLat && userLng) return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destinationLat},${destinationLng}&travelmode=walking`;
	return `https://www.google.com/maps/search/?api=1&query=${destinationLat},${destinationLng}`;
}
//#endregion
export { Textarea as a, Label as i, FALLBACK_FACILITIES as n, calculateDistanceKm as o, Input as r, getGoogleMapsDirectionsUrl as s, ChatWindow as t };

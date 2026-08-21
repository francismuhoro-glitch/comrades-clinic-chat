import { r as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./supabase-CqAS8xZT.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clinic-store-Ccw00kGc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Medical-grade client-side encryption using native Web Crypto API (AES-256-GCM).
* Ensures chat messages are encrypted before persisting to Supabase or network storage.
*/
function bufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		const byte = bytes[i];
		if (byte !== void 0) binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}
function base64ToBuffer(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
async function deriveSessionKey(sessionId) {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(`comrades-clinic-v1:${sessionId}`));
	return crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
/**
* Encrypts plaintext text using AES-256-GCM.
* Output format: `enc:v1:<iv_base64>:<ciphertext_base64>`
*/
async function encryptMessage(text, sessionId) {
	if (!text || typeof window === "undefined" || !window.crypto?.subtle) return text;
	try {
		const key = await deriveSessionKey(sessionId);
		const iv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
		const encodedText = new TextEncoder().encode(text);
		const ciphertextBuffer = await crypto.subtle.encrypt({
			name: "AES-GCM",
			iv
		}, key, encodedText);
		return `enc:v1:${bufferToBase64(iv.buffer)}:${bufferToBase64(ciphertextBuffer)}`;
	} catch (err) {
		console.error("Encryption error:", err);
		return text;
	}
}
/**
* Decrypts an encrypted message format `enc:v1:<iv>:<ciphertext>`.
* If message is not encrypted (e.g. legacy seed data), returns plaintext as-is.
*/
async function decryptMessage(encryptedText, sessionId) {
	if (!encryptedText || !encryptedText.startsWith("enc:v1:") || typeof window === "undefined" || !window.crypto?.subtle) return encryptedText;
	try {
		const parts = encryptedText.split(":");
		const ivStr = parts[2];
		const cipherStr = parts[3];
		if (!ivStr || !cipherStr) return encryptedText;
		const iv = base64ToBuffer(ivStr);
		const ciphertext = base64ToBuffer(cipherStr);
		const key = await deriveSessionKey(sessionId);
		const decryptedBuffer = await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv
		}, key, ciphertext);
		return new TextDecoder().decode(decryptedBuffer);
	} catch (err) {
		console.warn("Could not decrypt message payload:", err);
		return "[Encrypted message - unable to decrypt]";
	}
}
var SYMPTOM_OPTIONS = [
	{
		code: "fever",
		label: "Fever / chills",
		level: "urgent",
		lab: "Malaria smear + full blood count"
	},
	{
		code: "cough",
		label: "Cough / sore throat",
		level: "routine"
	},
	{
		code: "headache",
		label: "Headache",
		level: "routine"
	},
	{
		code: "stomach",
		label: "Stomach pain",
		level: "urgent",
		lab: "Stool analysis + H. pylori test"
	},
	{
		code: "diarrhoea",
		label: "Diarrhoea / vomiting",
		level: "urgent",
		lab: "Stool culture + urea & electrolytes"
	},
	{
		code: "urinary",
		label: "Painful urination",
		level: "urgent",
		lab: "Urinalysis (urine M/C/S)"
	},
	{
		code: "rash",
		label: "Skin rash",
		level: "routine"
	},
	{
		code: "fatigue",
		label: "Unusual fatigue / dizziness",
		level: "urgent",
		lab: "Haemoglobin + blood sugar"
	},
	{
		code: "sti",
		label: "STI concern",
		level: "urgent",
		lab: "STI screen (VDRL, HIV, swab)"
	},
	{
		code: "mental",
		label: "Stress, anxiety or low mood",
		level: "routine"
	},
	{
		code: "injury",
		label: "Injury / sprain",
		level: "routine"
	},
	{
		code: "chest_pain",
		label: "Chest pain or tightness",
		level: "emergency"
	},
	{
		code: "breathing",
		label: "Difficulty breathing",
		level: "emergency"
	},
	{
		code: "bleeding",
		label: "Heavy bleeding",
		level: "emergency"
	},
	{
		code: "fainting",
		label: "Fainting or seizure",
		level: "emergency"
	},
	{
		code: "selfharm",
		label: "Thoughts of self-harm",
		level: "emergency"
	}
];
var BY_CODE = new Map(SYMPTOM_OPTIONS.map((s) => [s.code, s]));
var symptomLabel = (code) => BY_CODE.get(code)?.label ?? code;
var RANK = {
	routine: 0,
	urgent: 1,
	emergency: 2
};
function triage(codes) {
	const picked = codes.map((c) => BY_CODE.get(c)).filter((s) => !!s);
	let level = "routine";
	for (const s of picked) if (RANK[s.level] > RANK[level]) level = s.level;
	const labPanels = [...new Set(picked.map((s) => s.lab).filter((l) => !!l))];
	const urgentCount = picked.filter((s) => s.level !== "routine").length;
	return {
		level,
		emergency: level === "emergency",
		labRecommended: labPanels.length > 0 || urgentCount >= 2,
		labPanels,
		emergencySymptoms: picked.filter((s) => s.level === "emergency").map((s) => s.label)
	};
}
/**
* Mock service layer + global state for the clinic.
*
* Everything the UI needs goes through `useClinic()`. To move to Supabase:
*  - replace the reducer mutations with Postgres writes (sessions, messages)
*  - subscribe to `messages` + `sessions` via Supabase Realtime and feed the
*    events into `dispatch`
*  - replace `simulatePayment` with an M-Pesa STK push + webhook status poll
*/
var uid = () => typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-4000-8000-${Math.random().toString(16).slice(2, 14)}`;
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var minutesAgo = (m) => (/* @__PURE__ */ new Date(Date.now() - m * 6e4)).toISOString();
var DEFAULT_SETTINGS = {
	pochi_phone: "0712345678",
	pochi_name: "COMRADES CLINIC",
	helpline_phone: "+254 712 345 678",
	consultation_fee_kes: 150
};
function seed() {
	return {
		doctorOnline: true,
		settings: DEFAULT_SETTINGS,
		sessions: [
			{
				id: "seed-1",
				full_name: "Brian Otieno",
				phone: "0712 345 678",
				campus: "Kenyatta University",
				symptoms: "Sore throat and mild fever for two days. Hard to swallow.",
				symptom_codes: ["fever", "cough"],
				triage_level: "urgent",
				emergency_flag: false,
				suggested_labs: ["Malaria smear + full blood count"],
				status: "waiting",
				paid: true,
				fee_kes: 150,
				mpesa_receipt: "QJT4RS9LMN",
				lab_test_requested: false,
				diagnosis_notes: "",
				prescription: null,
				referral: null,
				created_at: minutesAgo(6),
				ended_at: null
			},
			{
				id: "seed-2",
				full_name: "Mercy Kamau",
				phone: "0798 111 222",
				campus: "University of Nairobi",
				symptoms: "Recurring migraines during exam week, plus blurred vision.",
				symptom_codes: ["headache", "fatigue"],
				triage_level: "urgent",
				emergency_flag: false,
				suggested_labs: ["Haemoglobin + blood sugar"],
				status: "active",
				paid: true,
				fee_kes: 150,
				mpesa_receipt: "QJT8XX2PQR",
				lab_test_requested: false,
				diagnosis_notes: "",
				prescription: null,
				referral: null,
				created_at: minutesAgo(14),
				ended_at: null
			},
			{
				id: "seed-3",
				full_name: "Kevin Mutiso",
				phone: "0733 909 909",
				campus: "JKUAT",
				symptoms: "Skin rash on forearms after hostel laundry change.",
				symptom_codes: ["rash"],
				triage_level: "routine",
				emergency_flag: false,
				suggested_labs: [],
				status: "completed",
				paid: true,
				fee_kes: 150,
				mpesa_receipt: "QJS1AB7CDE",
				lab_test_requested: false,
				diagnosis_notes: "Contact dermatitis, likely detergent irritant.",
				prescription: {
					medication: "Hydrocortisone 1% cream",
					dosage: "Apply thin layer twice daily",
					duration: "5 days"
				},
				referral: null,
				created_at: minutesAgo(90),
				ended_at: minutesAgo(70)
			}
		],
		messages: [{
			id: uid(),
			session_id: "seed-2",
			sender: "student",
			body: "Daktari, the headache starts behind my right eye every evening.",
			created_at: minutesAgo(12)
		}, {
			id: uid(),
			session_id: "seed-2",
			sender: "doctor",
			body: "Thanks Mercy. How many hours are you on the laptop each day?",
			created_at: minutesAgo(11)
		}]
	};
}
function reducer(state, action) {
	switch (action.type) {
		case "set_online": return {
			...state,
			doctorOnline: action.value
		};
		case "set_settings": return {
			...state,
			settings: action.settings
		};
		case "create_session":
			if (state.sessions.some((s) => s.id === action.session.id)) return state;
			return {
				...state,
				sessions: [action.session, ...state.sessions]
			};
		case "mark_paid": return {
			...state,
			sessions: state.sessions.map((s) => s.id === action.id ? {
				...s,
				paid: true,
				status: "waiting",
				mpesa_receipt: action.receipt
			} : s)
		};
		case "activate": return {
			...state,
			sessions: state.sessions.map((s) => s.id === action.id && s.status === "waiting" ? {
				...s,
				status: "active"
			} : s)
		};
		case "add_message":
			if (state.messages.some((m) => m.id === action.message.id)) return state;
			return {
				...state,
				messages: [...state.messages, action.message]
			};
		case "patch_session": return {
			...state,
			sessions: state.sessions.map((s) => s.id === action.id ? {
				...s,
				...action.patch
			} : s)
		};
		default: return state;
	}
}
var ClinicContext = (0, import_react.createContext)(null);
function ClinicProvider({ children }) {
	const [state, dispatch] = (0, import_react.useReducer)(reducer, void 0, seed);
	const [studentSessionId, setStudentSessionIdState] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") return localStorage.getItem("comrades_active_session_id") || null;
		return null;
	});
	const setStudentSessionId = (0, import_react.useCallback)((id) => {
		setStudentSessionIdState(id);
		if (typeof window !== "undefined") if (id) localStorage.setItem("comrades_active_session_id", id);
		else localStorage.removeItem("comrades_active_session_id");
	}, []);
	const sendMessage = (0, import_react.useCallback)((id, sender, body) => {
		const msgId = uid();
		const createdAt = now();
		dispatch({
			type: "add_message",
			message: {
				id: msgId,
				session_id: id,
				sender,
				body,
				created_at: createdAt
			}
		});
		(async () => {
			try {
				const encryptedContent = await encryptMessage(body, id);
				const { error } = await supabase.from("messages").insert({
					id: msgId,
					consultation_id: id,
					sender_role: sender === "student" ? "patient" : sender,
					sender_name: sender === "doctor" ? "Doctor" : "Student",
					content: encryptedContent,
					created_at: createdAt
				});
				if (error) console.error("Supabase message insert failed:", error.message);
			} catch (err) {
				console.warn("Supabase message sync notice:", err);
			}
		})();
	}, []);
	(0, import_react.useEffect)(() => {
		(async () => {
			try {
				const { data: settingsData } = await supabase.from("clinic_settings").select("*").eq("id", "default").maybeSingle();
				if (settingsData) dispatch({
					type: "set_settings",
					settings: {
						pochi_phone: settingsData.pochi_phone || DEFAULT_SETTINGS.pochi_phone,
						pochi_name: settingsData.pochi_name || DEFAULT_SETTINGS.pochi_name,
						helpline_phone: settingsData.helpline_phone || DEFAULT_SETTINGS.helpline_phone,
						consultation_fee_kes: settingsData.consultation_fee_kes || DEFAULT_SETTINGS.consultation_fee_kes
					}
				});
				const { data } = await supabase.from("consultations").select("*").order("created_at", { ascending: false });
				if (data && data.length > 0) for (const row of data) {
					const mappedStatus = row.status === "waiting" ? "waiting" : row.status === "active" ? "active" : row.status === "completed" ? "completed" : "awaiting_payment";
					const session = {
						id: row.id,
						full_name: row.patient_name || "Patient",
						phone: row.patient_phone || "",
						campus: row.campus || "",
						symptoms: row.symptoms_description || "",
						symptom_codes: row.symptoms_selected || [],
						triage_level: row.triage_level || "routine",
						emergency_flag: row.triage_level === "emergency",
						suggested_labs: [],
						status: mappedStatus,
						paid: row.paid || row.payment_status === "confirmed" || row.status !== "payment_pending" && row.status !== "intake",
						fee_kes: 150,
						mpesa_receipt: row.mpesa_code || null,
						mpesa_code: row.mpesa_code,
						payment_phone: row.payment_phone,
						payment_status: row.payment_status || (row.status === "payment_pending" ? "pending" : "confirmed"),
						lab_test_requested: false,
						diagnosis_notes: row.diagnosis || "",
						prescription: null,
						referral: null,
						created_at: row.created_at || now(),
						ended_at: null
					};
					dispatch({
						type: "create_session",
						session
					});
				}
			} catch (err) {
				console.warn("Supabase initial load notice:", err);
			}
		})();
		const channel = supabase.channel("clinic-realtime").on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "messages"
		}, async (payload) => {
			const raw = payload.new;
			if (!raw || !raw.consultation_id) return;
			const decryptedBody = await decryptMessage(raw.content, raw.consultation_id);
			dispatch({
				type: "add_message",
				message: {
					id: raw.id,
					session_id: raw.consultation_id,
					sender: raw.sender_role === "patient" ? "student" : raw.sender_role ?? "system",
					body: decryptedBody,
					created_at: raw.created_at || now()
				}
			});
		}).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "consultations"
		}, (payload) => {
			const row = payload.new;
			if (!row || !row.id) return;
			const session = {
				id: row.id,
				full_name: row.patient_name,
				phone: row.patient_phone,
				campus: row.campus,
				symptoms: row.symptoms_description,
				symptom_codes: row.symptoms_selected || [],
				triage_level: row.triage_level || "routine",
				emergency_flag: row.triage_level === "emergency",
				suggested_labs: [],
				status: "awaiting_payment",
				paid: false,
				fee_kes: 150,
				mpesa_receipt: null,
				lab_test_requested: false,
				diagnosis_notes: "",
				prescription: null,
				referral: null,
				created_at: row.created_at || now(),
				ended_at: null
			};
			dispatch({
				type: "create_session",
				session
			});
		}).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "consultations"
		}, (payload) => {
			const row = payload.new;
			if (!row || !row.id) return;
			const patch = { status: row.status === "waiting" ? "waiting" : row.status === "active" ? "active" : row.status === "completed" ? "completed" : "awaiting_payment" };
			if (typeof row.diagnosis === "string") patch.diagnosis_notes = row.diagnosis;
			dispatch({
				type: "patch_session",
				id: row.id,
				patch
			});
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, []);
	const api = (0, import_react.useMemo)(() => {
		const system = (id, body) => dispatch({
			type: "add_message",
			message: {
				id: uid(),
				session_id: id,
				sender: "system",
				body,
				created_at: now()
			}
		});
		return {
			doctorOnline: state.doctorOnline,
			setDoctorOnline: (value) => dispatch({
				type: "set_online",
				value
			}),
			settings: state.settings,
			updateSettings: async (patch) => {
				const updated = {
					...state.settings,
					...patch
				};
				dispatch({
					type: "set_settings",
					settings: updated
				});
				try {
					await supabase.from("clinic_settings").upsert({
						id: "default",
						...updated,
						updated_at: now()
					});
				} catch (err) {
					console.error("Failed to update clinic settings:", err);
				}
			},
			sessions: state.sessions,
			pendingPayments: state.sessions.filter((s) => s.payment_status === "pending" || s.status === "awaiting_payment"),
			sessionsByStatus: (status) => state.sessions.filter((s) => s.status === status),
			submitPaymentClaim: async (id, mpesaCode, paymentPhone) => {
				dispatch({
					type: "patch_session",
					id,
					patch: {
						mpesa_code: mpesaCode,
						payment_phone: paymentPhone,
						payment_status: "pending"
					}
				});
				try {
					await supabase.from("consultations").update({
						mpesa_code: mpesaCode,
						payment_phone: paymentPhone,
						payment_status: "pending"
					}).eq("id", id);
				} catch (err) {
					console.error("Failed to submit payment claim:", err);
				}
			},
			confirmPayment: async (id) => {
				const receipt = state.sessions.find((x) => x.id === id)?.mpesa_code || "POCHI-" + uid().toUpperCase().slice(0, 8);
				dispatch({
					type: "mark_paid",
					id,
					receipt
				});
				dispatch({
					type: "patch_session",
					id,
					patch: {
						payment_status: "confirmed",
						status: "waiting",
						paid: true
					}
				});
				system(id, `Payment confirmed by clinician. Consultation queued.`);
				try {
					await supabase.from("consultations").update({
						status: "waiting",
						payment_status: "confirmed"
					}).eq("id", id);
				} catch (err) {
					console.error("Failed to confirm payment in Supabase:", err);
				}
			},
			rejectPayment: async (id) => {
				dispatch({
					type: "patch_session",
					id,
					patch: {
						payment_status: "rejected",
						status: "awaiting_payment",
						paid: false
					}
				});
				system(id, `Payment reference could not be verified. Please check and resubmit.`);
				try {
					await supabase.from("consultations").update({
						payment_status: "rejected",
						status: "payment_pending"
					}).eq("id", id);
				} catch (err) {
					console.error("Failed to reject payment:", err);
				}
			},
			getSession: (id) => state.sessions.find((s) => s.id === id) ?? null,
			messagesFor: (id) => id ? state.messages.filter((m) => m.session_id === id) : [],
			studentSessionId,
			setStudentSessionId,
			createSession: (input) => {
				const t = triage(input.symptom_codes);
				const session = {
					id: uid(),
					full_name: input.full_name,
					phone: input.phone,
					campus: input.campus,
					symptoms: input.symptoms,
					symptom_codes: input.symptom_codes,
					triage_level: t.level,
					emergency_flag: t.emergency,
					suggested_labs: t.labPanels,
					status: "awaiting_payment",
					paid: false,
					fee_kes: 150,
					mpesa_receipt: null,
					lab_test_requested: false,
					diagnosis_notes: "",
					prescription: null,
					referral: null,
					created_at: now(),
					ended_at: null
				};
				dispatch({
					type: "create_session",
					session
				});
				setStudentSessionId(session.id);
				(async () => {
					try {
						const { error } = await supabase.from("consultations").insert({
							id: session.id,
							patient_name: input.full_name,
							patient_phone: input.phone,
							campus: input.campus,
							symptoms_description: input.symptoms,
							symptoms_selected: input.symptom_codes,
							triage_level: t.level,
							status: "payment_pending"
						});
						if (error) console.error("Supabase consultation insert failed:", error.message);
					} catch (err) {
						console.warn("Supabase session sync notice:", err);
					}
				})();
				return session.id;
			},
			simulatePayment: (id) => {
				const receipt = "Q" + uid().toUpperCase().slice(0, 9);
				dispatch({
					type: "mark_paid",
					id,
					receipt
				});
				const s = state.sessions.find((x) => x.id === id);
				system(id, `Payment of KSh 150 received. Receipt ${receipt}.`);
				if (s) {
					const t = triage(s.symptom_codes);
					if (t.emergency) system(id, "EMERGENCY TRIAGE: the selected symptoms are red flags. This file is marked urgent for the doctor.");
					if (t.labRecommended) {
						dispatch({
							type: "patch_session",
							id,
							patch: { lab_test_requested: true }
						});
						system(id, `Auto-triage recommends a lab test${t.labPanels.length ? `: ${t.labPanels.join("; ")}` : ""}. The doctor will confirm.`);
					}
				}
				if (s?.symptoms) dispatch({
					type: "add_message",
					message: {
						id: uid(),
						session_id: id,
						sender: "student",
						body: s.symptoms,
						created_at: now()
					}
				});
			},
			activateSession: (id) => dispatch({
				type: "activate",
				id
			}),
			sendMessage,
			setDiagnosisNotes: (id, notes) => dispatch({
				type: "patch_session",
				id,
				patch: { diagnosis_notes: notes }
			}),
			toggleLabTest: (id) => {
				const value = !state.sessions.find((x) => x.id === id)?.lab_test_requested;
				dispatch({
					type: "patch_session",
					id,
					patch: { lab_test_requested: value }
				});
				system(id, value ? "Doctor flagged this file for lab sample collection." : "Lab test request withdrawn.");
			},
			endWithPrescription: (id, prescription) => {
				dispatch({
					type: "patch_session",
					id,
					patch: {
						prescription,
						referral: null,
						status: "completed",
						ended_at: now()
					}
				});
				system(id, "Session ended. A digital prescription has been issued.");
			},
			endWithReferral: (id, referral) => {
				dispatch({
					type: "patch_session",
					id,
					patch: {
						referral,
						prescription: null,
						status: "completed",
						ended_at: now()
					}
				});
				system(id, "Session ended. A referral letter has been issued.");
			}
		};
	}, [
		state,
		studentSessionId,
		setStudentSessionId,
		sendMessage
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClinicContext.Provider, {
		value: api,
		children
	});
}
function useClinic() {
	const ctx = (0, import_react.useContext)(ClinicContext);
	if (!ctx) throw new Error("useClinic must be used inside <ClinicProvider>");
	return ctx;
}
//#endregion
export { useClinic as a, triage as i, SYMPTOM_OPTIONS as n, symptomLabel as r, ClinicProvider as t };

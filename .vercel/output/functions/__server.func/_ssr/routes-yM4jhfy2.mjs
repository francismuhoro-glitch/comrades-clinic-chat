import { r as __toESM } from "../_runtime.mjs";
import { n as supabase, t as DOCTOR } from "./supabase-CqAS8xZT.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as CheckboxIndicator, p as require_jsx_runtime, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as useClinic, i as triage, n as SYMPTOM_OPTIONS } from "./clinic-store-Ccw00kGc.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { A as Check, D as CircleAlert, O as ChevronUp, b as FlaskConical, d as Printer, h as MapPin, i as Stethoscope, k as ChevronDown, o as Siren, p as Navigation, r as TriangleAlert, s as ShieldCheck, v as LoaderCircle, y as Landmark } from "../_libs/lucide-react.mjs";
import { a as Textarea, i as Label, n as FALLBACK_FACILITIES, o as calculateDistanceKm, r as Input, s as getGoogleMapsDirectionsUrl, t as ChatWindow } from "./facilities-DEcETZq1.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-yM4jhfy2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatDate(iso) {
	return new Date(iso ?? Date.now()).toLocaleString("en-KE", {
		dateStyle: "medium",
		timeStyle: "short"
	});
}
function SheetShell({ kicker, title, session, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "print-sheet overflow-hidden rounded-2xl border bg-card shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-gradient-medical px-5 py-4 text-primary-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-semibold uppercase tracking-[0.18em] opacity-85",
					children: kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-0.5 text-lg font-semibold",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs opacity-90",
					children: "Lovable Student Clinic · Telemedicine Services"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 px-5 py-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "grid grid-cols-2 gap-3 text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Patient"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-medium",
							children: session.full_name
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Campus"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-medium",
							children: session.campus
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Issued"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-medium",
							children: formatDate(session.ended_at)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Ref. No."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
							className: "font-medium uppercase",
							children: ["LSC-", session.id.slice(0, 6)]
						})] })
					]
				}),
				children,
				session.diagnosis_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
					children: "Clinical notes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm leading-relaxed",
					children: session.diagnosis_notes
				})] }),
				session.lab_test_requested && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2 rounded-xl bg-warning/15 px-3 py-2.5 text-xs text-warning-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Lab test required." }), " Present this document at the campus clinic laboratory for sample collection."] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-4 border-t pt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-sm italic text-primary",
							children: DOCTOR.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: DOCTOR.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: ["KMPDC No. ", DOCTOR.kmpdc_license]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-semibold text-success",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3" }), " Digitally signed"]
					})]
				})
			]
		})]
	});
}
function PrescriptionTemplate({ session }) {
	const rx = session.prescription;
	if (!rx) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetShell, {
		kicker: "Digital prescription",
		title: "Your Prescription (Rx)",
		session,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-dashed bg-secondary/60 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl text-primary",
					children: "℞"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-base font-semibold",
					children: rx.medication
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: ["Dosage: ", rx.dosage]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: ["Duration: ", rx.duration]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Present this prescription at any licensed pharmacy. Complete the full course even if you start feeling better."
		})]
	});
}
function ReferralTemplate({ session }) {
	const ref = session.referral;
	if (!ref) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetShell, {
		kicker: "Referral letter",
		title: "Your Referral Letter",
		session,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-dashed bg-secondary/60 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: "Referred to"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ref.destination)}`,
						target: "_blank",
						rel: "noreferrer",
						className: "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "size-3" }), "Get Directions"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 flex items-center gap-1.5 text-base font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 shrink-0 text-primary" }), ref.destination]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed",
					children: ref.reason
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Kindly attend to the above patient. This consultation was conducted remotely via Lovable Student Clinic."
		})]
	});
}
function DocumentActions({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "no-print mt-3 flex gap-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			className: "flex-1",
			onClick: () => window.print(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }),
				" Download / print ",
				label
			]
		})
	});
}
var KENYAN_INSTITUTIONS = [
	{
		name: "University of Nairobi (UoN)",
		category: "public_uni",
		region: "Nairobi"
	},
	{
		name: "Kenyatta University (KU)",
		category: "public_uni",
		region: "Nairobi / Kiambu"
	},
	{
		name: "Jomo Kenyatta University of Agriculture and Technology (JKUAT)",
		category: "public_uni",
		region: "Kiambu"
	},
	{
		name: "Technical University of Kenya (TUK)",
		category: "public_uni",
		region: "Nairobi"
	},
	{
		name: "Multimedia University of Kenya (MMU)",
		category: "public_uni",
		region: "Nairobi"
	},
	{
		name: "The Co-operative University of Kenya (CUK)",
		category: "public_uni",
		region: "Nairobi"
	},
	{
		name: "Moi University",
		category: "public_uni",
		region: "Uasin Gishu"
	},
	{
		name: "University of Eldoret (UoE)",
		category: "public_uni",
		region: "Uasin Gishu"
	},
	{
		name: "Egerton University",
		category: "public_uni",
		region: "Nakuru"
	},
	{
		name: "Dedan Kimathi University of Technology (DeKUT)",
		category: "public_uni",
		region: "Nyeri"
	},
	{
		name: "Karatina University",
		category: "public_uni",
		region: "Nyeri"
	},
	{
		name: "Murang'a University of Technology (MUT)",
		category: "public_uni",
		region: "Murang'a"
	},
	{
		name: "Kirinyaga University",
		category: "public_uni",
		region: "Kirinyaga"
	},
	{
		name: "University of Embu",
		category: "public_uni",
		region: "Embu"
	},
	{
		name: "Chuka University",
		category: "public_uni",
		region: "Tharaka Nithi"
	},
	{
		name: "Tharaka University",
		category: "public_uni",
		region: "Tharaka Nithi"
	},
	{
		name: "Meru University of Science and Technology (MUST)",
		category: "public_uni",
		region: "Meru"
	},
	{
		name: "Machakos University",
		category: "public_uni",
		region: "Machakos"
	},
	{
		name: "South Eastern Kenya University (SEKU)",
		category: "public_uni",
		region: "Kitui"
	},
	{
		name: "Technical University of Mombasa (TUM)",
		category: "public_uni",
		region: "Mombasa"
	},
	{
		name: "Pwani University",
		category: "public_uni",
		region: "Kilifi"
	},
	{
		name: "Taita Taveta University",
		category: "public_uni",
		region: "Taita Taveta"
	},
	{
		name: "Garissa University",
		category: "public_uni",
		region: "Garissa"
	},
	{
		name: "Maseno University",
		category: "public_uni",
		region: "Kisumu"
	},
	{
		name: "Jaramogi Oginga Odinga University of Science and Technology (JOOUST)",
		category: "public_uni",
		region: "Siaya"
	},
	{
		name: "Masinde Muliro University of Science and Technology (MMUST)",
		category: "public_uni",
		region: "Kakamega"
	},
	{
		name: "Kaimosi Friends University",
		category: "public_uni",
		region: "Vihiga"
	},
	{
		name: "Kibabii University",
		category: "public_uni",
		region: "Bungoma"
	},
	{
		name: "Alupe University",
		category: "public_uni",
		region: "Busia"
	},
	{
		name: "Kisii University",
		category: "public_uni",
		region: "Kisii"
	},
	{
		name: "Rongo University",
		category: "public_uni",
		region: "Migori"
	},
	{
		name: "Tom Mboya University",
		category: "public_uni",
		region: "Homa Bay"
	},
	{
		name: "Maasai Mara University",
		category: "public_uni",
		region: "Narok"
	},
	{
		name: "University of Kabianga",
		category: "public_uni",
		region: "Kericho"
	},
	{
		name: "Laikipia University",
		category: "public_uni",
		region: "Laikipia"
	},
	{
		name: "Bomet University",
		category: "public_uni",
		region: "Bomet"
	},
	{
		name: "Strathmore University",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "United States International University - Africa (USIU)",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Catholic University of Eastern Africa (CUEA)",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Daystar University",
		category: "private_uni",
		region: "Nairobi / Machakos"
	},
	{
		name: "KCA University",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Mount Kenya University (MKU)",
		category: "private_uni",
		region: "Kiambu"
	},
	{
		name: "Zetech University",
		category: "private_uni",
		region: "Kiambu"
	},
	{
		name: "Africa Nazarene University (ANU)",
		category: "private_uni",
		region: "Kajiado"
	},
	{
		name: "Kenya Methodist University (KeMU)",
		category: "private_uni",
		region: "Meru"
	},
	{
		name: "St. Paul's University",
		category: "private_uni",
		region: "Kiambu"
	},
	{
		name: "Pan Africa Christian University (PAC)",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Kabarak University",
		category: "private_uni",
		region: "Nakuru"
	},
	{
		name: "University of Eastern Africa, Baraton",
		category: "private_uni",
		region: "Nandi"
	},
	{
		name: "Scott Christian University",
		category: "private_uni",
		region: "Machakos"
	},
	{
		name: "Africa International University (AIU)",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Kenya Highlands Evangelical University",
		category: "private_uni",
		region: "Kericho"
	},
	{
		name: "Great Lakes University of Kisumu",
		category: "private_uni",
		region: "Kisumu"
	},
	{
		name: "Adventist University of Africa",
		category: "private_uni",
		region: "Kajiado"
	},
	{
		name: "KAG EAST University",
		category: "private_uni",
		region: "Kajiado"
	},
	{
		name: "Umma University",
		category: "private_uni",
		region: "Kajiado"
	},
	{
		name: "Presbyterian University of East Africa (PUEA)",
		category: "private_uni",
		region: "Kiambu"
	},
	{
		name: "Aga Khan University",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Kiriri Women's University of Science and Technology",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "The East African University",
		category: "private_uni",
		region: "Kajiado"
	},
	{
		name: "Lukenya University",
		category: "private_uni",
		region: "Makueni"
	},
	{
		name: "Management University of Africa (MUA)",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Tangaza University",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Islamic University of Kenya",
		category: "private_uni",
		region: "Kajiado"
	},
	{
		name: "Riara University",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "Uzima University",
		category: "private_uni",
		region: "Kisumu"
	},
	{
		name: "Gretsa University",
		category: "private_uni",
		region: "Kiambu"
	},
	{
		name: "Amref International University",
		category: "private_uni",
		region: "Nairobi"
	},
	{
		name: "National Defence University–Kenya",
		category: "specialized",
		region: "Nakuru"
	},
	{
		name: "Open University of Kenya",
		category: "specialized",
		region: "Machakos"
	},
	{
		name: "National Intelligence Research University",
		category: "specialized",
		region: "Nairobi"
	},
	{
		name: "The Kenya Coast National Polytechnic",
		category: "national_poly",
		region: "Mombasa"
	},
	{
		name: "Kabete National Polytechnic",
		category: "national_poly",
		region: "Nairobi"
	},
	{
		name: "Nairobi Technical Training Institute (NTTI)",
		category: "national_poly",
		region: "Nairobi"
	},
	{
		name: "Kisumu National Polytechnic",
		category: "national_poly",
		region: "Kisumu"
	},
	{
		name: "Eldoret National Polytechnic",
		category: "national_poly",
		region: "Uasin Gishu"
	},
	{
		name: "Nyeri National Polytechnic",
		category: "national_poly",
		region: "Nyeri"
	},
	{
		name: "Meru National Polytechnic",
		category: "national_poly",
		region: "Meru"
	},
	{
		name: "Sigalagala National Polytechnic",
		category: "national_poly",
		region: "Kakamega"
	},
	{
		name: "Kitale National Polytechnic",
		category: "national_poly",
		region: "Trans Nzoia"
	},
	{
		name: "Machakos Technical Training Institute",
		category: "national_poly",
		region: "Machakos"
	},
	{
		name: "Ambritch College of Technology",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "East Africa Institute of Certified Studies",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Talanta Institute",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "African International Technical College (AITEC)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Africa Digital Media Institute (ADMI)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "AirSwiss International College",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Divas Technology College",
		category: "tvet",
		region: "Kilifi"
	},
	{
		name: "Amboseli Institute of Hospitality and Technology",
		category: "tvet",
		region: "Thika / Nakuru"
	},
	{
		name: "Nairobi Institute of Software Development",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "NairoBits College",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Nairobi Industrial Institute College",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Coffee School",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Barista Coffee Skills and Technology Training Institute",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Atlas College",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Highways and Building Technology (KIHBT)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Adept College of Professional Studies",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "African Institute of Research and Development Studies (AIRDES)",
		category: "tvet",
		region: "Mombasa"
	},
	{
		name: "Bandari College",
		category: "tvet",
		region: "Mombasa"
	},
	{
		name: "Baraton Teachers' Training College",
		category: "tvet",
		region: "Nandi"
	},
	{
		name: "Bungoma North Technical Vocational College",
		category: "tvet",
		region: "Bungoma"
	},
	{
		name: "Consolata Cathedral Institute",
		category: "tvet",
		region: "Nyeri"
	},
	{
		name: "Cascade Institute of Hospitality",
		category: "tvet",
		region: "Thika"
	},
	{
		name: "Eldoret Technical Training Institute",
		category: "tvet",
		region: "Uasin Gishu"
	},
	{
		name: "Eldoret Polytechnic",
		category: "tvet",
		region: "Uasin Gishu"
	},
	{
		name: "Emma Daniel Arts Training Institute (EDATI)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Government Training Institute (GTI)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Gusii Institute of Technology",
		category: "tvet",
		region: "Kisii"
	},
	{
		name: "Harvard Institute of Development Studies",
		category: "tvet",
		region: "Thika"
	},
	{
		name: "Hemland College of Professional and Technical Studies",
		category: "tvet",
		region: "Thika"
	},
	{
		name: "ICT Fire and Rescue",
		category: "tvet",
		region: "Thika"
	},
	{
		name: "Indian Institute of Hardware Technology (IIHT)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "International Centre of Technology (ICT-Thika)",
		category: "tvet",
		region: "Thika"
	},
	{
		name: "Intraglobal Training Institute - Nairobi CBD",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Intraglobal Training Institute - Kisumu",
		category: "tvet",
		region: "Kisumu"
	},
	{
		name: "Intraglobal Training Institute - Kisii",
		category: "tvet",
		region: "Kisii"
	},
	{
		name: "Intraglobal Training Institute - Embu",
		category: "tvet",
		region: "Embu"
	},
	{
		name: "Intraglobal Training Institute - Nakuru",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "Intraglobal Training Institute - Donholm",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Jaffery Institute of Professional Studies",
		category: "tvet",
		region: "Mombasa"
	},
	{
		name: "Kagumo College",
		category: "tvet",
		region: "Nyeri"
	},
	{
		name: "Kaiboi Technical Training Institute",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "The Kenya College of Science and Technology",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Forestry College",
		category: "tvet",
		region: "Kericho"
	},
	{
		name: "Kenya School of Government (KSG)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Biomedical Sciences and Technology (KIBSAT)",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "Kenya Institute of Management (KIM)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Mass Communication (KIMC)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Monitoring and Evaluation Studies (KIMES)",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "Kenya Institute of Software Engineering",
		category: "tvet",
		region: "Thika"
	},
	{
		name: "Kenya School of Medical Science and Technology",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya School of Monetary Studies",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Science Teachers College",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Technical Teachers College (KTTC)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Water Institute",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Wildlife Service Training Institute",
		category: "tvet",
		region: "Naivasha"
	},
	{
		name: "Kiambu Institute of Science and Technology",
		category: "tvet",
		region: "Kiambu"
	},
	{
		name: "Kigari Teachers College",
		category: "tvet",
		region: "Embu"
	},
	{
		name: "Kilimambogo Teachers College",
		category: "tvet",
		region: "Machakos"
	},
	{
		name: "Kipkabus Technical and Vocational College (KTVC)",
		category: "tvet",
		region: "Uasin Gishu"
	},
	{
		name: "Kisumu Polytechnic",
		category: "tvet",
		region: "Kisumu"
	},
	{
		name: "Kitale Technical Institute",
		category: "tvet",
		region: "Trans Nzoia"
	},
	{
		name: "Machakos Institute of Technology",
		category: "tvet",
		region: "Machakos"
	},
	{
		name: "Mboya Labour College",
		category: "tvet",
		region: "Kisumu"
	},
	{
		name: "Michuki Technical Institute",
		category: "tvet",
		region: "Murang'a"
	},
	{
		name: "Nairobi Aviation College - Kisumu Campus",
		category: "tvet",
		region: "Kisumu"
	},
	{
		name: "Nakuru Counselling & Training Institute",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "PC Kinyanjui Technical Training Institute (PCKTTI)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Railway Training Institute",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Ramogi Institute of Advanced Technology",
		category: "tvet",
		region: "Kisumu"
	},
	{
		name: "Rifkins College",
		category: "tvet",
		region: "Mombasa"
	},
	{
		name: "Rift Valley Technical Training Institute",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "Sacred Training Institute",
		category: "tvet",
		region: "Bungoma / Nairobi"
	},
	{
		name: "Savannah Institute for Business and Informatics",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "Sensei Institute of Technology",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "Sirisia Youth Polytechnic",
		category: "tvet",
		region: "Bungoma"
	},
	{
		name: "Technical Training Institute (MTTI)",
		category: "tvet",
		region: "Mombasa"
	},
	{
		name: "Thika Technical Training Institute",
		category: "tvet",
		region: "Thika"
	},
	{
		name: "United Africa College",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Rift Valley Institute of Science & Technology",
		category: "tvet",
		region: "Nakuru"
	},
	{
		name: "Vision Empowerment Training Institute - Nairobi",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Vision Empowerment Training Institute - Kitengela",
		category: "tvet",
		region: "Kajiado"
	},
	{
		name: "Vision Stars Training Institute",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Visualdo Institute",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Development Studies (KIDS)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya Christian Industrial Training Institute (KCITI)",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Kenya School of Law",
		category: "tvet",
		region: "Nairobi"
	},
	{
		name: "Meru University TVET",
		category: "tvet",
		region: "Meru"
	},
	{
		name: "KMTC - Nairobi Campus",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "KMTC - Mombasa Campus",
		category: "college",
		region: "Mombasa"
	},
	{
		name: "KMTC - Nakuru Campus",
		category: "college",
		region: "Nakuru"
	},
	{
		name: "KMTC - Kisumu Campus",
		category: "college",
		region: "Kisumu"
	},
	{
		name: "KMTC - Eldoret Campus",
		category: "college",
		region: "Uasin Gishu"
	},
	{
		name: "KMTC - Nyeri Campus",
		category: "college",
		region: "Nyeri"
	},
	{
		name: "KMTC - Kilifi Campus",
		category: "college",
		region: "Kilifi"
	},
	{
		name: "Kenya Utalii College",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "St. Joseph's Medical Training College",
		category: "college",
		region: "Kisumu"
	},
	{
		name: "St. Mary's School of Clinical Medicine",
		category: "college",
		region: "Kakamega"
	},
	{
		name: "Kenya Aeronautical College",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "Nairobi Aviation College",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "East African School of Aviation",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "Skypath Aviation College",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "Eagle Air Aviation College (EAAC)",
		category: "college",
		region: "Kajiado"
	},
	{
		name: "Eldoret Aviation Training Institute",
		category: "college",
		region: "Uasin Gishu"
	},
	{
		name: "Kericho Teachers College",
		category: "college",
		region: "Kericho"
	},
	{
		name: "Migori Teachers College",
		category: "college",
		region: "Migori"
	},
	{
		name: "Mosoriot Teachers College",
		category: "college",
		region: "Uasin Gishu"
	},
	{
		name: "Narok Teachers College",
		category: "college",
		region: "Narok"
	},
	{
		name: "Shanzu Teachers College",
		category: "college",
		region: "Mombasa"
	},
	{
		name: "Tambach Teachers Training College",
		category: "college",
		region: "Elgeyo Marakwet"
	},
	{
		name: "Nkabune Technical Institute",
		category: "college",
		region: "Meru"
	},
	{
		name: "Mawego Technical Institute",
		category: "college",
		region: "Homa Bay"
	},
	{
		name: "Murang'a Institute of Technology",
		category: "college",
		region: "Murang'a"
	},
	{
		name: "Sagana Institute of Technology",
		category: "college",
		region: "Kirinyaga"
	},
	{
		name: "Karatina Institute of Technology (KIT)",
		category: "college",
		region: "Nyeri"
	},
	{
		name: "Meru Technical Institute",
		category: "college",
		region: "Meru"
	},
	{
		name: "Nairobi Institute of Business Studies (NIBS)",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "National Youth Service Engineering Institute",
		category: "college",
		region: "Nairobi"
	},
	{
		name: "Africa College of Social Work",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Airways Travel Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Alphax College",
		category: "proprietary",
		region: "Uasin Gishu"
	},
	{
		name: "Amani College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Arkline College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Associated Computer Services",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "AUGAB Computer College",
		category: "proprietary",
		region: "Garissa"
	},
	{
		name: "Augustana College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Australian Studies Institute (AUSI)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Bell Institute of Technology",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Belmont International College",
		category: "proprietary",
		region: "Kajiado"
	},
	{
		name: "Bible College of East Africa",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "BizSmart Inter Technology",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Bungoma Technical Training Institute",
		category: "proprietary",
		region: "Bungoma"
	},
	{
		name: "Career Training Centre",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Century Park College",
		category: "proprietary",
		region: "Machakos"
	},
	{
		name: "Coast Institute of Technology",
		category: "proprietary",
		region: "Mombasa"
	},
	{
		name: "College of Management Sciences",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Compuera College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Compugoal College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Computer Learning Centre (CLC)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Computer Pride Training Centre",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Newview College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Consolata Institute of Communication and Technology",
		category: "proprietary",
		region: "Nyeri"
	},
	{
		name: "Cornerstone Training Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Dairy Training Institute Naivasha (DTI)",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Digital Resource Center (DRC)",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Digiworld Computer School",
		category: "proprietary",
		region: "Meru"
	},
	{
		name: "Don Bosco Boys' Town",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Don Bosco Institute of Management Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Duolotech Computers",
		category: "proprietary",
		region: "Kiambu / Thika"
	},
	{
		name: "Eagle College of Management Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "East Africa School of Journalism (EASJ)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "East Africa School of Management",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "East Africa Vision Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "East African Media Institute (EAMI)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Elite Centre",
		category: "proprietary",
		region: "Nairobi / Nakuru"
	},
	{
		name: "Elite Commercial Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Elix Centre of Informatics",
		category: "proprietary",
		region: "Turkana"
	},
	{
		name: "Emanex Computer College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Esmart College",
		category: "proprietary",
		region: "Kiambu"
	},
	{
		name: "Felma College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "German Institute of Professional Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Globoville Shanzu Beach College",
		category: "proprietary",
		region: "Mombasa"
	},
	{
		name: "Graffins College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Hansons College of Professional Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Hemland Computer Institute",
		category: "proprietary",
		region: "Thika"
	},
	{
		name: "Hi-tec Institute of Professional Studies",
		category: "proprietary",
		region: "Mombasa"
	},
	{
		name: "Higher Institute of Development Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Holy Rosary College",
		category: "proprietary",
		region: "Machakos"
	},
	{
		name: "The iNet College",
		category: "proprietary",
		region: "Bungoma"
	},
	{
		name: "Institute of Advanced Technology",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Institute of Business and Technology",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Institute of Information Technology Studies & Research",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Institute of Zaburi Technologies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Inter-Afrika Development Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "International College of Kenya",
		category: "proprietary",
		region: "Nairobi / Machakos"
	},
	{
		name: "International Hotel & Tourism Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "InterWorld College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Jodan College of Technology",
		category: "proprietary",
		region: "Thika"
	},
	{
		name: "Jogoo Commercial College",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Keiway Mining & Technology College",
		category: "proprietary",
		region: "Kilifi"
	},
	{
		name: "Kenair Travel and Related Studies",
		category: "proprietary",
		region: "Nairobi / Mombasa"
	},
	{
		name: "Kenya College of Communications Technology",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya College of Medicine & Related Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya College of Skills and Talent Development",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Applied Sciences",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Media and Technology (KIMT)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Professional Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Social Work and Community Development (KISWCD)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya Institute of Special Education (KISE)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya School of Accountancy and Finance",
		category: "proprietary",
		region: "Trans Nzoia / Kisii"
	},
	{
		name: "Kenya School of Professional Counseling & Behavioural Sciences",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya School of Professional Studies (KSPS)",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenya School of Technology Studies (KSTS)",
		category: "proprietary",
		region: "Thika"
	},
	{
		name: "Kima International School of Theology (KIST)",
		category: "proprietary",
		region: "Vihiga"
	},
	{
		name: "Kinyanjui Technical Training Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Lake Region Business Training and Consultancy",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Lakeview Training Institute",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Language School in Kenya",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Maxton College of Media & Communications",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Motion City International",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Naivasha Computer & Business Studies College",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Nakuru College of Health Sciences and Management",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Nakuru Institute of Information Communication Technology",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Nationwide Hotel and Tourism College (NHTC)",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "Neema Lutheran College",
		category: "proprietary",
		region: "Nyamira"
	},
	{
		name: "Oshwal College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Pan African School of Theology (PAST)",
		category: "proprietary",
		region: "Nyandarua"
	},
	{
		name: "PCEA Shalom Training College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Pioneer's Training Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "PREMESE Africa Development Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Premier College of Hospitality and Business Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Premier College of Professional Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Prestige Academy and College",
		category: "proprietary",
		region: "Nakuru"
	},
	{
		name: "The Regional Institute of Business Management",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Regional Centre for Tourism and Foreign Language",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Regional Training Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Regions Group International College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Rift Valley Institute of Business Studies",
		category: "proprietary",
		region: "Nakuru / Kericho"
	},
	{
		name: "Rehoboth College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Riccatti Business College of East Africa",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Rochester Business School",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Royal Institute of Applied Sciences",
		category: "proprietary",
		region: "Meru"
	},
	{
		name: "Sacred Lake Institute of Technology",
		category: "proprietary",
		region: "Meru"
	},
	{
		name: "School of Professional Studies",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Shalom Information Technology Centre",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Shepherds Foundation Education & Research Centre",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Skynet Business College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "SMA Swiss Management Academy",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Softpro Computer Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "South Rift International College (SORICO)",
		category: "proprietary",
		region: "Kericho"
	},
	{
		name: "St. Andrew's Pre-Medical College",
		category: "proprietary",
		region: "Mombasa"
	},
	{
		name: "St. Joseph Vocational Training Centre",
		category: "proprietary",
		region: "Machakos"
	},
	{
		name: "Stanbridge College",
		category: "proprietary",
		region: "Taita Taveta"
	},
	{
		name: "Star Media Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Starnet College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Stonebic College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Superior Group of Colleges",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Talent Institute",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Tangaza College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Taznaam Tutorial College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Tec Institute of Management",
		category: "proprietary",
		region: "Nairobi / Uasin Gishu"
	},
	{
		name: "Thomas Asingo College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Times Training Centre",
		category: "proprietary",
		region: "Mombasa"
	},
	{
		name: "Universal Group of Colleges",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Vision Institute of Professionals",
		category: "proprietary",
		region: "Nairobi / Mombasa"
	},
	{
		name: "Wang Point Technologies College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Western College of Hospitality and Professional Studies (Wechaps)",
		category: "proprietary",
		region: "Kisumu"
	},
	{
		name: "Zetech College",
		category: "proprietary",
		region: "Nairobi"
	},
	{
		name: "Kenyaplex Institute of Technology",
		category: "proprietary",
		region: "Machakos"
	}
];
var NearbyFacilities = ({ onlyEmergency = false }) => {
	const [userCoords, setUserCoords] = (0, import_react.useState)(null);
	const [facilities, setFacilities] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [locationError, setLocationError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined" && navigator.geolocation) navigator.geolocation.getCurrentPosition((pos) => {
			setUserCoords({
				lat: pos.coords.latitude,
				lng: pos.coords.longitude
			});
		}, () => {
			setLocationError("Enable location to automatically sort the 5 closest hospitals to you.");
		}, {
			enableHighAccuracy: true,
			timeout: 1e4
		});
		async function loadFacilities() {
			setLoading(true);
			try {
				let query = supabase.from("campus_facilities").select("*").limit(5e3);
				if (onlyEmergency) query = query.eq("is_emergency", true);
				const { data, error } = await query;
				if (error || !data || data.length === 0) setFacilities(FALLBACK_FACILITIES);
				else {
					const mapped = data.map((f) => {
						const fac = {
							name: f["Facility Name"] || f.name || "Medical Facility",
							facility_type: f["Facility Type"] || f.facility_type || "Hospital",
							district: f["District"] || f["LOCATION"] || f["Province"] || "Kenya",
							latitude: Number(f["Latitude"] || f.latitude || 0),
							longitude: Number(f["Longitude"] || f.longitude || 0),
							agency: f["Agency"] || "Health Provider",
							is_emergency: Boolean(f.is_emergency)
						};
						if (f.id) fac.id = f.id;
						return fac;
					}).filter((f) => f.latitude !== 0 && f.longitude !== 0);
					setFacilities(mapped.length > 0 ? mapped : FALLBACK_FACILITIES);
				}
			} catch {
				setFacilities(FALLBACK_FACILITIES);
			} finally {
				setLoading(false);
			}
		}
		loadFacilities();
	}, [onlyEmergency]);
	const sortedFacilities = facilities.map((fac) => {
		const distance = userCoords ? calculateDistanceKm(userCoords.lat, userCoords.lng, fac.latitude, fac.longitude) : void 0;
		return {
			...fac,
			distanceKm: distance
		};
	}).sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999)).slice(0, 5);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "flex items-center gap-2 font-semibold text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-5 w-5 text-primary" }), onlyEmergency ? "Top 5 Nearest Emergency Hospitals" : "Top 5 Nearest Health Facilities"]
				})
			}),
			locationError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-3.5 w-3.5 text-warning" }), locationError]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-center py-6 text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin mr-2" }), "Calculating nearest facilities from 4,800+ Kenyan hospital database..."]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: sortedFacilities.map((fac, idx) => {
					const mapsUrl = getGoogleMapsDirectionsUrl(fac.latitude, fac.longitude, userCoords?.lat, userCoords?.lng);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1 pr-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 flex-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-sm text-foreground",
									children: fac.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] uppercase font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded",
									children: fac.facility_type
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 text-xs text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									fac.district,
									" (",
									fac.agency,
									")"
								] }), fac.distanceKm !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-success",
									children: [
										"~",
										fac.distanceKm,
										" km away"
									]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							className: "gap-1.5 text-xs h-8 shrink-0",
							onClick: () => window.open(mapsUrl, "_blank"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "h-3.5 w-3.5 text-primary" }), "Directions"]
						})]
					}, idx);
				})
			})
		]
	});
};
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
function IntakeForm({ onSubmit }) {
	const { doctorOnline } = useClinic();
	const [form, setForm] = (0, import_react.useState)({
		full_name: "",
		phone: "",
		campus: "",
		symptoms: "",
		symptom_codes: []
	});
	const [agreed, setAgreed] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const set = (key, value) => setForm((f) => ({
		...f,
		[key]: value
	}));
	const assessment = triage(form.symptom_codes);
	const toggleSymptom = (code) => setForm((f) => ({
		...f,
		symptom_codes: f.symptom_codes.includes(code) ? f.symptom_codes.filter((c) => c !== code) : [...f.symptom_codes, code]
	}));
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!form.full_name.trim() || !form.phone.trim() || !form.campus || !form.symptoms.trim()) {
			setError("Please fill in all the fields above.");
			return;
		}
		if (!/^(?:\+?254|0)7\d{8}$|^(?:\+?254|0)1\d{8}$/.test(form.phone.replace(/\s/g, ""))) {
			setError("Enter a valid Kenyan M-Pesa number, e.g. 0712345678.");
			return;
		}
		if (form.symptom_codes.length === 0) {
			setError("Select at least one symptom so we can triage your case.");
			return;
		}
		if (!agreed) {
			setError("Please accept the medical disclaimer to continue.");
			return;
		}
		setError(null);
		onSubmit(form);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: handleSubmit,
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "full_name",
					children: "Full name"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "full_name",
					value: form.full_name,
					onChange: (e) => set("full_name", e.target.value),
					placeholder: "e.g. Brian Otieno",
					autoComplete: "name"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "phone",
					children: "Phone number (M-Pesa)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "phone",
					type: "tel",
					inputMode: "tel",
					value: form.phone,
					onChange: (e) => set("phone", e.target.value),
					placeholder: "07XX XXX XXX",
					autoComplete: "tel"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "campus",
					children: "Institution / Campus / College"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: form.campus,
					onValueChange: (v) => set("campus", v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						id: "campus",
						className: "w-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select your institution or campus" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
						className: "max-h-72",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-2 py-1.5 text-xs font-bold text-primary",
								children: "Public Universities"
							}),
							KENYAN_INSTITUTIONS.filter((u) => u.category === "public_uni").map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: u.name,
								children: [
									u.name,
									" (",
									u.region,
									")"
								]
							}, u.name)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-2 py-1.5 text-xs font-bold text-primary",
								children: "Private Universities"
							}),
							KENYAN_INSTITUTIONS.filter((u) => u.category === "private_uni").map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: u.name,
								children: [
									u.name,
									" (",
									u.region,
									")"
								]
							}, u.name)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-2 py-1.5 text-xs font-bold text-primary",
								children: "National Polytechnics"
							}),
							KENYAN_INSTITUTIONS.filter((u) => u.category === "national_poly").map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: u.name,
								children: [
									u.name,
									" (",
									u.region,
									")"
								]
							}, u.name)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-2 py-1.5 text-xs font-bold text-primary",
								children: "TVETs, Colleges & Institutes"
							}),
							KENYAN_INSTITUTIONS.filter((u) => u.category === "tvet" || u.category === "college" || u.category === "proprietary" || u.category === "specialized").map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: u.name,
								children: [
									u.name,
									" (",
									u.region,
									")"
								]
							}, u.name))
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "What are you experiencing? (select all that apply)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: SYMPTOM_OPTIONS.map((s) => {
							const active = form.symptom_codes.includes(s.code);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": active,
								onClick: () => toggleSymptom(s.code),
								className: cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", active ? s.level === "emergency" ? "border-destructive bg-destructive/12 text-destructive" : "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground hover:border-primary/40"),
								children: s.label
							}, s.code);
						})
					}),
					assessment.emergency && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-2 rounded-xl border border-destructive bg-destructive/10 p-3 text-xs font-medium text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "block",
								children: "Emergency warning"
							}), "Your answers suggest a possible emergency. Go to the nearest hospital or call 999 / 1199 now — do not wait for the chat."] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NearbyFacilities, {
							campus: form.campus,
							onlyEmergency: true
						})]
					}),
					!assessment.emergency && assessment.labRecommended && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-start gap-2 rounded-xl border border-warning bg-warning/12 p-3 text-xs text-warning-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "mt-0.5 size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"A lab test will likely be needed",
							assessment.labPanels.length ? `: ${assessment.labPanels.join("; ")}` : "",
							". The doctor confirms this in your consultation."
						] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "symptoms",
					children: "Describe your symptoms or reason for visit"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "symptoms",
					rows: 4,
					value: form.symptoms,
					onChange: (e) => set("symptoms", e.target.value),
					placeholder: "Tell the doctor what you are feeling, for how long, and any medication you have taken."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex cursor-pointer items-start gap-3 rounded-xl border bg-secondary/50 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
					checked: agreed,
					onCheckedChange: (v) => setAgreed(v === true),
					className: "mt-0.5"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs leading-relaxed text-secondary-foreground",
					children: "I understand this service is for basic care only. For emergencies, I will visit a physical hospital immediately."
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-xs font-medium text-destructive",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }),
					" ",
					error
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				size: "lg",
				className: "h-13 w-full rounded-xl text-base",
				children: [
					"Start Consultation (KSh ",
					150,
					")"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5 text-success" }), "Paid securely with M-Pesa · Private & confidential"]
			}),
			!doctorOnline && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-[11px] text-muted-foreground",
				children: "The doctor is offline. You can still submit — you will be queued for the next available session."
			})
		]
	});
}
function MpesaProcessing({ phone, onCancel }) {
	const { submitPaymentClaim, studentSessionId, settings } = useClinic();
	const [refCode, setRefCode] = (0, import_react.useState)("");
	const [payPhone, setPaymentPhone] = (0, import_react.useState)(phone);
	const [submitted, setSubmitted] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const pochiPhone = settings?.pochi_phone || "0712345678";
	const pochiName = settings?.pochi_name || "COMRADES CLINIC";
	const helpline = settings?.helpline_phone || "+254 712 345 678";
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		const cleanRef = refCode.trim().toUpperCase();
		if (cleanRef.length < 8 || cleanRef.length > 12) {
			setError("Please enter a valid M-Pesa reference code (e.g. SFI89G7H7H).");
			return;
		}
		if (!studentSessionId) {
			setError("Active session not found. Please try again.");
			return;
		}
		setSubmitted(true);
		await submitPaymentClaim(studentSessionId, cleanRef, payPhone);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 overflow-hidden rounded-2xl border bg-card shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-5 py-6",
			children: !submitted ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-2 text-center pb-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-14 items-center justify-center rounded-full bg-success/10 text-success",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "size-7" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-base font-semibold",
								children: "Payment via Pochi la Biashara"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground leading-relaxed",
								children: [
									"To consult the doctor, please send exactly",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
										className: "text-foreground",
										children: ["KSh ", 150]
									}),
									" to the Pochi details below:"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/60 p-3.5 text-xs space-y-2 border border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Pochi Phone Number:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-foreground select-all",
									children: pochiPhone
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Recipient Name:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-foreground",
									children: pochiName
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Amount to Send:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
									className: "text-foreground font-semibold",
									children: ["KSh ", 150]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "refCode",
								children: "M-Pesa Reference Code"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "refCode",
								placeholder: "e.g. SFI89G7H7H",
								value: refCode,
								onChange: (e) => setRefCode(e.target.value),
								className: "uppercase",
								required: true
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "payPhone",
								children: "Your M-Pesa Phone Number"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "payPhone",
								type: "tel",
								placeholder: "e.g. 0712345678",
								value: payPhone,
								onChange: (e) => setPaymentPhone(e.target.value),
								required: true
							})]
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1.5 text-xs font-medium text-destructive",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "size-4" }),
							" ",
							error
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 pt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full h-11 rounded-xl",
							children: "Submit Reference Code"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							className: "w-full text-xs text-muted-foreground",
							onClick: onCancel,
							children: "Cancel intake"
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center gap-4 py-4 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning animate-pulse",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-7 animate-spin" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-semibold",
						children: "Verifying Your Payment"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs leading-relaxed text-muted-foreground max-w-sm",
						children: [
							"We have received reference code",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-foreground uppercase",
								children: refCode
							}),
							". The clinic is reviewing M-Pesa statements to confirm. Your dashboard will unlock automatically."
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-full rounded-xl border border-dashed border-warning/40 bg-warning/5 p-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-warning-foreground",
								children: "Delayed verification?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-muted-foreground text-left",
								children: "If confirmation takes longer than 5 minutes, please call support:"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `tel:${helpline}`,
								className: "mt-2 inline-flex items-center gap-1.5 font-bold text-primary hover:underline text-sm",
								children: ["📞 ", helpline]
							})
						]
					})
				]
			})
		})
	});
}
function StatusBadge({ status, paid }) {
	if (!paid || status === "awaiting_payment") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground",
		children: "Payment required"
	});
	const map = {
		awaiting_payment: {
			label: "Payment required",
			className: "bg-warning/15 text-warning-foreground"
		},
		waiting: {
			label: "In queue",
			className: "bg-primary/10 text-primary"
		},
		active: {
			label: "In consultation",
			className: "bg-success/15 text-success"
		},
		completed: {
			label: "Completed",
			className: "bg-muted text-muted-foreground"
		}
	};
	const current = map[status] || map.waiting;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${current.className}`,
		children: current.label
	});
}
function StudentLayout({ subtitle, compact = false, children }) {
	const { doctorOnline } = useClinic();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground flex flex-col justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-20 border-b bg-card/95 backdrop-blur px-4 py-3 shadow-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-lg items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2.5 transition-opacity hover:opacity-90",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-sm font-bold leading-none",
						children: "Comrades Clinic"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground mt-0.5",
						children: "Student Telemedicine Kenya"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 rounded-full ${doctorOnline ? "bg-success animate-pulse" : "bg-muted-foreground"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: doctorOnline ? "Doctor Online" : "Offline"
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: `mx-auto max-w-lg px-4 py-5 space-y-4 ${compact ? "pt-8" : ""}`,
			children: [subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: subtitle
			}), children]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
			className: "border-t bg-card/60 px-4 py-4 text-center text-[11px] text-muted-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-lg space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/terms",
							className: "hover:text-primary transition-colors underline-offset-4 hover:underline",
							children: "Terms & Disclaimer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/privacy",
							className: "hover:text-primary transition-colors underline-offset-4 hover:underline",
							children: "Privacy Policy (ODPC)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/doctor",
							className: "hover:text-primary transition-colors underline-offset-4 hover:underline",
							children: "Clinician Portal"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "© 2026 Comrades Clinic Kenya · Verified Non-Emergency Student Care" })]
			})
		})]
	});
}
function PatientRouteComponent() {
	const { doctorOnline, studentSessionId, setStudentSessionId, getSession, messagesFor, createSession, simulatePayment, sendMessage } = useClinic();
	const session = getSession(studentSessionId);
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentLayout, {
		subtitle: "Affordable care for comrades across Kenyan campuses",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntakeForm, { onSubmit: (input) => createSession(input) })
	});
	if (session.status === "awaiting_payment" && !session.paid) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentLayout, {
		subtitle: "Pochi la Biashara Consultation Payment",
		compact: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MpesaProcessing, {
			phone: session.phone,
			onSimulateSuccess: () => simulatePayment(session.id),
			onCancel: () => setStudentSessionId(null)
		})
	});
	const msgs = messagesFor(session.id);
	const assessment = triage(session.symptom_codes);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentLayout, {
		subtitle: `${session.campus} · ${session.phone}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-lg font-bold sm:text-xl",
						children: ["Consultation · ", session.full_name]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
						status: session.status,
						paid: session.paid
					})]
				}),
				assessment.emergency && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-destructive bg-destructive/10 p-3.5 text-xs text-destructive",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "block font-semibold",
						children: "Emergency Guidance"
					}), "Your answers suggest a possible emergency. Go to the nearest hospital or call 999 / 1199 now — do not wait for the chat."]
				}),
				session.status === "waiting" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border bg-card p-4 text-center shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-primary animate-ping" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 font-semibold text-sm",
							children: "You are in the queue"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground leading-relaxed",
							children: doctorOnline ? "The doctor will accept your consultation shortly. Please keep this screen open." : "The doctor is currently offline. You will be attended as soon as clinic hours resume."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[480px] overflow-hidden rounded-2xl border bg-card shadow-card",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatWindow, {
						messages: msgs,
						viewer: "student",
						onSend: (body) => sendMessage(session.id, "student", body),
						disabled: session.status === "completed"
					})
				}),
				session.status === "completed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 pt-2",
					children: [
						session.prescription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrescriptionTemplate, { session }),
						session.referral && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferralTemplate, { session }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocumentActions, { label: session.prescription ? "prescription" : "referral" })
					]
				})
			]
		})
	});
}
//#endregion
export { PatientRouteComponent as component };

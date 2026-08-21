import { r as __toESM } from "../_runtime.mjs";
import { t as DOCTOR } from "./supabase-DJ9FuPcY.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as useClinic, i as triage, r as symptomLabel } from "./clinic-store-BzYN6GDd.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as loginDoctor, r as logoutDoctor, t as Route } from "./doctor-BTiQxNrY.mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { A as Check, C as EyeOff, E as CircleCheck, S as Eye, T as Clock, _ as LockKeyhole, a as Sparkles, b as FlaskConical, c as ShieldAlert, f as Pill, g as LogOut, h as MapPin, i as Stethoscope, l as Settings, m as MessageSquare, o as Siren, r as TriangleAlert, s as ShieldCheck, t as X, v as LoaderCircle, w as CreditCard, x as FileText } from "../_libs/lucide-react.mjs";
import { a as Textarea, i as Label, n as FALLBACK_FACILITIES, r as Input, t as ChatWindow } from "./facilities-DEcETZq1.mjs";
import { a as DialogOverlay$1, c as DialogTrigger$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/doctor-AO0a666M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
function ClinicalPanel({ session }) {
	const { setDiagnosisNotes, toggleLabTest, endWithPrescription, endWithReferral } = useClinic();
	const [rx, setRx] = (0, import_react.useState)({
		medication: "",
		dosage: "",
		duration: ""
	});
	const [referral, setReferral] = (0, import_react.useState)({
		destination: "",
		reason: ""
	});
	const ended = session.status === "completed";
	const assessment = triage(session.symptom_codes);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border bg-card p-4 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "Auto-triage"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", assessment.level === "emergency" ? "bg-destructive/12 text-destructive" : assessment.level === "urgent" ? "bg-warning/20 text-warning-foreground" : "bg-success/15 text-success"),
							children: assessment.level
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2.5 flex flex-wrap gap-1.5",
						children: session.symptom_codes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "No symptoms selected."
						}) : session.symptom_codes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground",
							children: symptomLabel(c)
						}, c))
					}),
					assessment.emergency && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-2.5 text-xs font-medium text-destructive",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, { className: "mt-0.5 size-3.5 shrink-0" }),
							"Red flags: ",
							assessment.emergencySymptoms.join(", "),
							". Advise immediate physical hospital care and consider a referral."
						]
					}),
					assessment.labRecommended && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 flex items-start gap-2 rounded-lg border border-warning bg-warning/12 p-2.5 text-xs text-warning-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "mt-0.5 size-3.5 shrink-0" }),
							"Lab test recommended",
							assessment.labPanels.length ? `: ${assessment.labPanels.join("; ")}` : " (multiple urgent symptoms)",
							".",
							session.lab_test_requested ? " Already flagged for sample collection." : ""
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border bg-card p-4 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "notes",
						className: "text-sm font-semibold",
						children: "Diagnosis notes (SOAP format)"
					}), !ended && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							const labels = session.symptom_codes.map((c) => symptomLabel(c)).join(", ");
							const soapDraft = `[S - Subjective]: Student (${session.full_name}, ${session.campus}) presents with: ${session.symptoms || "unspecified symptoms"}. Selected flags: ${labels || "None"}.\n\n[O - Objective]: Triage evaluation: ${assessment.level.toUpperCase()}. ${assessment.labRecommended ? `Recommended lab panels: ${assessment.labPanels.join(", ")}.` : "No urgent lab markers indicated."}\n\n[A - Assessment]: Clinical impression consistent with acute symptomatic episode. ${assessment.emergency ? "RED FLAG: Emergency symptoms present." : "Routine/Urgent outpatient management."}\n\n[P - Plan]: Prescribed supportive therapy, hydration and rest. Advised to seek in-person review if symptoms escalate within 24-48 hours.`;
							setDiagnosisNotes(session.id, soapDraft);
						},
						className: "inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), "Auto-Draft SOAP Note"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "notes",
					rows: 5,
					className: "mt-2 text-xs leading-relaxed",
					disabled: ended,
					value: session.diagnosis_notes,
					onChange: (e) => setDiagnosisNotes(session.id, e.target.value),
					placeholder: "Working diagnosis, observations, advice given… or click 'Auto-Draft SOAP Note' to generate."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "rounded-xl border bg-card p-4 shadow-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: ended,
					onClick: () => toggleLabTest(session.id),
					className: cn("flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60", session.lab_test_requested ? "border-warning bg-warning/15" : "hover:border-primary/40"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("flex size-9 items-center justify-center rounded-lg", session.lab_test_requested ? "bg-warning/25 text-warning-foreground" : "bg-muted text-muted-foreground"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-semibold",
							children: "Request lab test"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-xs text-muted-foreground",
							children: session.lab_test_requested ? "Flagged: Needs Sample Collection" : "Flag this patient file for sample collection"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border bg-card p-4 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Close the consultation"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						defaultValue: "rx",
						className: "mt-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid w-full grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "rx",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-3.5" }), " Prescription"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "ref",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5" }), " Referral"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "rx",
								className: "mt-4 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "med",
											children: "Medication name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "med",
											disabled: ended,
											value: rx.medication,
											onChange: (e) => setRx({
												...rx,
												medication: e.target.value
											}),
											placeholder: "e.g. Amoxicillin 500mg, Paracetamol 1g, ORS sachets"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "dosage",
												children: "Dosage"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "dosage",
												disabled: ended,
												value: rx.dosage,
												onChange: (e) => setRx({
													...rx,
													dosage: e.target.value
												}),
												placeholder: "1 tablet, 3x daily"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "duration",
												children: "Duration"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "duration",
												disabled: ended,
												value: rx.duration,
												onChange: (e) => setRx({
													...rx,
													duration: e.target.value
												}),
												placeholder: "5 days"
											})]
										})]
									}),
									rx.medication.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 font-semibold text-primary",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-3.5" }), "Clinical Safety Verification"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 space-y-1 text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3 text-success" }), "Standard dosing format verified"]
											}), rx.medication.toLowerCase().includes("amox") || rx.medication.toLowerCase().includes("penicillin") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-center gap-1 font-medium text-warning",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3 text-warning" }), "Penicillin class antibiotic: Confirm patient has no allergy history."]
											}) : null]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										className: "w-full",
										disabled: ended || !rx.medication.trim() || !rx.dosage.trim() || !rx.duration.trim(),
										onClick: () => endWithPrescription(session.id, rx),
										children: "End Session & Send Prescription"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "ref",
								className: "mt-4 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "dest",
												children: "Destination Facility (Hospital / Level 4/5 / Lab)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "dest",
												list: "referral-facilities-list",
												disabled: ended,
												value: referral.destination,
												onChange: (e) => setReferral({
													...referral,
													destination: e.target.value
												}),
												placeholder: "Type or select: e.g. Kenyatta National Hospital, MTRH, Aga Khan..."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
												id: "referral-facilities-list",
												children: FALLBACK_FACILITIES.map((fac) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: `${fac.name} (${fac.level || "Hospital"} · ${fac.ownership || "Public"})` }, fac.name))
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "reason",
												children: "Reason for referral"
											}), !ended && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													const autoReason = `Patient ${session.full_name} referred from Comrades Clinic for urgent clinical evaluation regarding ${session.symptoms || "symptoms"}. Triage classification: ${assessment.level.toUpperCase()}. Please evaluate, perform necessary diagnostic tests, and manage accordingly.`;
													setReferral((prev) => ({
														...prev,
														reason: autoReason
													}));
												},
												className: "text-[11px] font-medium text-primary hover:underline",
												children: "Auto-Fill Summary"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											id: "reason",
											rows: 4,
											disabled: ended,
											value: referral.reason,
											onChange: (e) => setReferral({
												...referral,
												reason: e.target.value
											}),
											placeholder: "Clinical summary and what the receiving facility should assess."
										})]
									}),
									referral.destination && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1 text-xs text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3 text-primary" }), "Google Maps directions will be auto-attached to the student's referral slip."]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										className: "w-full",
										disabled: ended || !referral.destination.trim() || !referral.reason.trim(),
										onClick: () => endWithReferral(session.id, referral),
										children: "End Session & Send Referral Letter"
									})
								]
							})
						]
					}),
					ended && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground",
						children: "This session is closed and archived under Completed."
					})
				]
			})
		]
	});
}
var alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7", {
	variants: { variant: {
		default: "bg-background text-foreground",
		destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
	} },
	defaultVariants: { variant: "default" }
});
var Alert = import_react.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	role: "alert",
	className: cn(alertVariants({ variant }), className),
	...props
}));
Alert.displayName = "Alert";
var AlertTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
	ref,
	className: cn("mb-1 font-medium leading-none tracking-tight", className),
	...props
}));
AlertTitle.displayName = "AlertTitle";
var AlertDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm [&_p]:leading-relaxed", className),
	...props
}));
AlertDescription.displayName = "AlertDescription";
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
function DoctorLogin() {
	const router = useRouter();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const submit = async (event) => {
		event.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const result = await loginDoctor({ data: {
				email,
				password
			} });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			await router.invalidate();
		} catch {
			setError("We could not sign you in. Check the portal configuration and try again.");
		} finally {
			setSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-[calc(100vh-49px)] overflow-hidden bg-gradient-surface px-4 py-10 sm:py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -left-24 top-12 size-64 rounded-full bg-primary/10 blur-3xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-24 bottom-12 size-72 rounded-full bg-success/10 blur-3xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-medical text-primary-foreground shadow-float",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, {
									className: "size-7",
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary",
								children: "Clinician access"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 text-2xl font-semibold sm:text-3xl",
								children: "Welcome back, doctor"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed text-muted-foreground",
								children: "Sign in before viewing patient consultations and clinical records."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border-border/80 shadow-float",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "space-y-1 pb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "flex items-center gap-2 text-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {
									className: "size-4 text-primary",
									"aria-hidden": "true"
								}), "Doctor portal login"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Use your clinic-issued account details." })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: submit,
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "doctor-email",
										children: "Email address"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "doctor-email",
										type: "email",
										inputMode: "email",
										autoComplete: "username",
										placeholder: "doctor@clinic.co.ke",
										value: email,
										onChange: (event) => setEmail(event.target.value),
										required: true,
										disabled: submitting
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "doctor-password",
										children: "Password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "doctor-password",
											type: showPassword ? "text" : "password",
											autoComplete: "current-password",
											value: password,
											onChange: (event) => setPassword(event.target.value),
											className: "pr-11",
											required: true,
											disabled: submitting
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setShowPassword((visible) => !visible),
											className: "absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
											"aria-label": showPassword ? "Hide password" : "Show password",
											"aria-pressed": showPassword,
											children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
												className: "size-4",
												"aria-hidden": "true"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
												className: "size-4",
												"aria-hidden": "true"
											})
										})]
									})]
								}),
								error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, {
									variant: "destructive",
									role: "alert",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDescription, { children: error })
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									className: "w-full",
									size: "lg",
									disabled: submitting,
									children: [submitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										className: "size-4 animate-spin",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
										className: "size-4",
										"aria-hidden": "true"
									}), submitting ? "Signing in…" : "Secure sign in"]
								})
							]
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
							className: "size-3.5 text-success",
							"aria-hidden": "true"
						}), "Protected by an encrypted, HTTP-only session cookie"]
					})
				]
			})
		]
	});
}
function since(iso) {
	const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));
	return mins < 1 ? "just now" : `${mins} min ago`;
}
function PatientQueue({ sessions, selectedId, onSelect, emptyLabel, actionLabel }) {
	if (sessions.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-xl border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground",
		children: emptyLabel
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2.5",
		children: sessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => onSelect(s.id),
			className: cn("w-full rounded-xl border bg-card p-3.5 text-left shadow-card transition-colors hover:border-primary/40", selectedId === s.id && "border-primary ring-1 ring-primary/30", s.emergency_flag && "border-destructive/60 bg-destructive/5"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-semibold",
							children: s.full_name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs text-muted-foreground",
							children: [
								s.campus,
								" · ",
								s.phone
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
							" ",
							since(s.created_at)
						]
					})]
				}),
				s.emergency_flag && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 flex items-center gap-1.5 rounded-lg bg-destructive/12 px-2 py-1 text-[11px] font-semibold text-destructive",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, { className: "size-3" }), " Emergency triage — prioritise"]
				}),
				s.symptom_codes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[11px] font-medium text-muted-foreground",
					children: s.symptom_codes.map(symptomLabel).join(" · ")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 line-clamp-2 text-sm text-foreground/80",
					children: s.symptoms
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2.5 flex flex-wrap items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success",
							children: ["Paid KSh ", s.fee_kes]
						}),
						s.mpesa_receipt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
							children: s.mpesa_receipt
						}),
						s.lab_test_requested && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "size-2.5" }), " Needs sample collection"]
						}),
						s.prescription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary",
							children: "Prescription issued"
						}),
						s.referral && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground",
							children: "Referred"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-auto flex items-center gap-1 text-[11px] font-semibold text-primary",
							children: [s.status === "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-3" }), actionLabel]
						})
					]
				})
			]
		}) }, s.id))
	});
}
var Dialog = Dialog$1;
var DialogTrigger = DialogTrigger$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
function DoctorPortalRoute() {
	const authenticatedDoctor = Route.useLoaderData();
	if (!authenticatedDoctor) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DoctorLogin, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DoctorPortal, { authenticatedDoctor });
}
function DoctorPortal({ authenticatedDoctor }) {
	const router = useRouter();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const { doctorOnline, setDoctorOnline, settings, updateSettings, pendingPayments, confirmPayment, rejectPayment, sessionsByStatus, getSession, messagesFor, sendMessage } = useClinic();
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [pochiPhone, setPochiPhone] = (0, import_react.useState)(settings.pochi_phone);
	const [pochiName, setPochiName] = (0, import_react.useState)(settings.pochi_name);
	const [helpline, setHelpline] = (0, import_react.useState)(settings.helpline_phone);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [savingSettings, setSavingSettings] = (0, import_react.useState)(false);
	const selectedSession = getSession(selectedId);
	const signOut = async () => {
		setSigningOut(true);
		try {
			await logoutDoctor();
			await router.invalidate();
		} finally {
			setSigningOut(false);
		}
	};
	const handleSaveSettings = async (e) => {
		e.preventDefault();
		setSavingSettings(true);
		await updateSettings({
			pochi_phone: pochiPhone,
			pochi_name: pochiName,
			helpline_phone: helpline
		});
		setSavingSettings(false);
		setSettingsOpen(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-30 border-b bg-card px-4 py-3 shadow-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-7xl items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-base font-bold leading-tight",
						children: "Comrades Clinic · Doctor Portal"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							authenticatedDoctor.name,
							" · KMPDC ",
							DOCTOR.kmpdc_license
						]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 rounded-full ${doctorOnline ? "bg-success animate-pulse" : "bg-muted-foreground"}` }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: doctorOnline ? "Online (Accepting)" : "Offline"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: doctorOnline,
									onCheckedChange: setDoctorOnline
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
							open: settingsOpen,
							onOpenChange: setSettingsOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									className: "gap-1.5 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-3.5" }), "Clinic Settings"]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
								className: "sm:max-w-[425px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleSaveSettings,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Pochi la Biashara & Helpline Settings" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Update the Pochi payment number, business name, and helpline displayed to students." })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-4 py-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "pochi-phone",
														children: "Pochi Phone Number"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "pochi-phone",
														value: pochiPhone,
														onChange: (e) => setPochiPhone(e.target.value),
														placeholder: "07XX XXX XXX",
														required: true
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "pochi-name",
														children: "Recipient / Account Name"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "pochi-name",
														value: pochiName,
														onChange: (e) => setPochiName(e.target.value),
														placeholder: "COMRADES CLINIC",
														required: true
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "helpline-phone",
														children: "Helpline / Support Phone"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "helpline-phone",
														value: helpline,
														onChange: (e) => setHelpline(e.target.value),
														placeholder: "+254 7XX XXX XXX",
														required: true
													})]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											disabled: savingSettings,
											children: savingSettings ? "Saving…" : "Save Clinic Settings"
										}) })
									]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: signOut,
							disabled: signingOut,
							className: "gap-1.5 text-xs text-muted-foreground hover:text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-3.5" }), signingOut ? "Signing out…" : "Sign out"]
						})
					]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[340px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "space-y-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: pendingPayments.length > 0 ? "payments" : "waiting",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "w-full",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									className: "flex-1 relative",
									value: "payments",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-3.5 mr-1" }),
										"Payments",
										pendingPayments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1.5 rounded-full bg-warning px-1.5 py-0.2 text-[10px] font-bold text-warning-foreground",
											children: pendingPayments.length
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									className: "flex-1",
									value: "waiting",
									children: "Waiting"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									className: "flex-1",
									value: "active",
									children: "Active"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									className: "flex-1",
									value: "completed",
									children: "Done"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "payments",
							className: "mt-3 space-y-2.5",
							children: pendingPayments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-xl border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground",
								children: "No pending payment verifications."
							}) : pendingPayments.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border bg-card p-3.5 shadow-card space-y-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-sm",
											children: p.full_name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												p.campus,
												" · ",
												p.phone
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning-foreground uppercase",
											children: ["KSh ", p.fee_kes]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg bg-muted/60 p-2.5 text-xs space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "M-Pesa Ref:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-foreground font-mono select-all uppercase",
												children: p.mpesa_code || "Pending Code"
											})]
										}), p.payment_phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Paid via:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.payment_phone })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 pt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											className: "flex-1 bg-success hover:bg-success/90 text-success-foreground h-8 text-xs gap-1",
											onClick: () => confirmPayment(p.id),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }), "Confirm Payment"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "outline",
											className: "text-destructive hover:bg-destructive/10 h-8 text-xs gap-1",
											onClick: () => rejectPayment(p.id),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), "Reject"]
										})]
									})
								]
							}, p.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "waiting",
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PatientQueue, {
								sessions: sessionsByStatus("waiting"),
								selectedId,
								onSelect: (id) => setSelectedId(id),
								emptyLabel: "No comrades waiting in queue right now.",
								actionLabel: "Start consultation"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "active",
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PatientQueue, {
								sessions: sessionsByStatus("active"),
								selectedId,
								onSelect: (id) => setSelectedId(id),
								emptyLabel: "No active consultations in progress.",
								actionLabel: "Open workspace"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "completed",
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PatientQueue, {
								sessions: sessionsByStatus("completed"),
								selectedId,
								onSelect: (id) => setSelectedId(id),
								emptyLabel: "No completed records yet.",
								actionLabel: "View record"
							})
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { children: selectedSession ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[650px] overflow-hidden rounded-xl border bg-card shadow-card",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatWindow, {
						messages: messagesFor(selectedSession.id),
						viewer: "doctor",
						onSend: (body) => sendMessage(selectedSession.id, "doctor", body),
						disabled: selectedSession.status === "completed"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClinicalPanel, { session: selectedSession }) })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-6 text-center text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, { className: "size-10 text-muted-foreground/40 mb-2" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold text-foreground",
						children: "No patient selected"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground max-w-xs mt-1",
						children: "Select a waiting comrade from the left panel to begin consultation and review notes."
					})
				]
			}) })]
		})]
	});
}
//#endregion
export { DoctorPortalRoute as component };

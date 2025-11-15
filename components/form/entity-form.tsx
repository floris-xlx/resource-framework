"use client";

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import md5 from "md5";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { APP_CONFIG } from "@/config";
import { useApiClient } from "@/hooks/use-api-client";
import { useFormationsStore, useUserStore } from "@/lib/stores";
import { validateEmail } from "@/lib/utils";
import { FormField } from "./form-field";
import type { EntitySchema, FormData } from "./types";

interface EntityFormProps {
	schema: EntitySchema;
	onSubmit: (data: FormData) => void;
	onStepChange?: (step: number) => void;
}

export function EntityForm({
	schema,
	onSubmit,
	onStepChange,
}: EntityFormProps) {
	const [formData, setFormData] = useState<FormData>({ total_members: 0 });
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const { form, setMany } = useFormationsStore();
	const { user } = useUserStore();
	const [isSubmitting, setIsSubmitting] = useState(false); // add: track submit loading

	// API client for sf_formations_cases
	const { insert: insertCase } = useApiClient<any>({
		table: "sf_formations_cases",
		enabled: false,
	});

	const {
		insert: insertCustomer,
		data: _customerData,
		mutate: _mutateCustomers,
	} = useApiClient<any>({
		table: "customers",
		enabled: false,
	});
	const { insert: insertTicket } = useApiClient<any>({
		table: "tickets",
		enabled: false,
	});
	const { update: updateCase } = useApiClient<any>({
		table: "sf_formations_cases",
		enabled: false,
	});

	// Hydrate local state from persisted store on first mount
	useEffect(() => {
		try {
			if (form && Object.keys(form as any).length > 0) {
				setFormData((prev) => ({ ...prev, ...(form as any) }));
			}
		} catch {}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const steps = Object.entries(schema.steps);
	const [currentStepName, currentStepFields] = steps[currentStepIndex];
	const progress = ((currentStepIndex + 1) / steps.length) * 100;
	const supportsMultipleMembers = currentStepName === "members";
	const membersCount = Array.isArray((formData as any).members)
		? (formData as any).members.length
		: 0;

	// If we enter the members step and there are no members, prefill the first
	// member with the current user's name as a default value.
	useEffect(() => {
		if (!supportsMultipleMembers) return;
		const list = (formData as any)?.members;
		if (!Array.isArray(list) || list.length === 0) {
			setFormData((prev: any) => ({
				...prev,
				members: [
					{
						first_name: user?.first_name ?? "",
						middle_name: "",
						surname: user?.last_name ?? "",
						email: "",
						dob: null,
						share_pct: "",
					},
				],
			}));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [supportsMultipleMembers]);

	// Initialize default values per step (prefer defaultValue/default_value across types)
	useEffect(() => {
		if (!Array.isArray(currentStepFields)) return;
		const updates: Record<string, any> = {};
		for (const field of currentStepFields as any[]) {
			const existing = (formData as any)[field.key];
			const defaultValue =
				(field as any)?.defaultValue ?? (field as any)?.default_value;

			const isEmpty =
				existing === undefined || existing === null || existing === "";

			if (!isEmpty) continue;

			// Prefer explicit defaultValue/default_value if provided
			if (defaultValue !== undefined) {
				updates[field.key] = defaultValue;
				continue;
			}

			// Fallback behavior by type when no default is provided
			if (field?.type === "number") {
				const minVal = typeof field.min === "number" ? field.min : 0;
				updates[field.key] = minVal;
			} else if (field?.type === "date") {
				updates[field.key] = null;
			}
		}
		if (Object.keys(updates).length > 0) {
		 setFormData((prev) => ({ ...prev, ...updates }));
		}
		// also clear previous step errors on step change
		setFieldErrors({});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentStepIndex]);

	useEffect(() => {
		if (schema.entity === "Dubai FZCO") {
			const proposedCapital = Number(formData.proposed_capital) || 0;
			const shareValue = Number(formData.share_value) || 0;

			if (proposedCapital && shareValue) {
				const totalShares = proposedCapital / shareValue;
				setFormData((prev) => ({
					...prev,
					total_shares: totalShares,
				}));
			}
		}
		onStepChange?.(currentStepIndex);
	}, [
		formData.proposed_capital,
		formData.share_value,
		schema.entity,
		currentStepIndex,
		onStepChange,
	]);

	// Keep a calculated total_members value in sync with current members list
	useEffect(() => {
		const next = membersCount;
		const current = (formData as any)?.total_members;
		if (current !== next) {
			setFormData((prev) => ({ ...prev, total_members: next }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [membersCount]);

	const updateField = (key: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[key]: value,
		}));
		// clear error for this field on change
		setFieldErrors((prev) => {
			if (!prev[key]) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
		});
	};

	// Persist every local change into the store so refresh restores it
	useEffect(() => {
		try {
			setMany(formData as any);
		} catch {}
	}, [formData, setMany]);

	const getMembersShareTotal = () => {
		const list = (formData as any)?.members;
		if (!Array.isArray(list)) return 0;
		return list.reduce((sum: number, m: any) => {
			const v = m?.share_pct;
			const n = v === "" || v === null || v === undefined ? 0 : Number(v);
			return sum + (Number.isFinite(n) ? n : 0);
		}, 0);
	};

	// --------- DRY VALIDATION HELPERS (only change) ---------
	const isValidSelect = (field: any, value: any) => {
		if (value === undefined || value === null || value === "") return false;
		const opts = Array.isArray(field?.options)
			? field.options
			: Array.isArray((field as any)?.options)
			? (field as any).options
			: null;
		if (!Array.isArray(opts)) return true;
		// Supports string arrays or {label,value} arrays
		return opts.some((o: any) => (o && typeof o === "object" ? o.value : o) === value);
	};

	const validateField = (field: any, value: any) => {
		if (!field?.required) return true;

		if (field.type === "email") {
			if (typeof value !== "string" || value.trim() === "") return false;
			return validateEmail(value.trim());
		}

		if (field.type === "number") {
			return value !== undefined && value !== null && value !== "";
		}

		if (field.type === "select") {
			return isValidSelect(field, value);
		}

		if (field.key === "dob" && value) {
			const birthDate = new Date(value);
			if (Number.isNaN(birthDate.getTime())) return false;
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
				age -= 1;
			}
			return age >= 18;
		}

		if (field.key === "utility_bill_type") {
			if (typeof value !== "string" || value.trim() === "") return false;
			const lowered = value.toLowerCase();
			if (lowered.includes("mobile") || lowered.includes("cell")) return false;
			return true;
		}

		if (field.key === "utility_bill_issue_date") {
			if (!value) return false;
			const issue = new Date(value);
			const now = new Date();
			const msInDay = 24 * 60 * 60 * 1000;
			const diffDays = Math.floor((now.getTime() - issue.getTime()) / msInDay);
			if (Number.isNaN(diffDays) || diffDays > 92 || diffDays < 0) return false;
			return true;
		}

		if (typeof value === "string") return value.trim() !== "";
		return value !== undefined && value !== null && value !== "";
	};
	// --------------------------------------------------------

	// build a message for a single field
	const getFieldError = (field: any, value: any): string => {
		if (!field?.required) return "";
		const label = field?.label || field?.key || "This field";

		if (field.type === "email") {
			if (!value || typeof value !== "string" || value.trim() === "") return `${label} is required.`;
			if (!validateEmail(value.trim())) return `enter a valid email.`;
			return "";
		}

		if (field.type === "number") {
			if (value === undefined || value === null || value === "") return `${label} is required.`;
			return "";
		}

		if (field.type === "select") {
			if (!isValidSelect(field, value)) return `${label} is required.`;
			return "";
		}

		if (field.key === "dob") {
			if (!value) return `${label} is required.`;
			const birthDate = new Date(value);
			if (Number.isNaN(birthDate.getTime())) return `enter a valid date.`;
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const md = today.getMonth() - birthDate.getMonth();
			if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) age -= 1;
			if (age < 18) return `must be 18 or older.`;
			return "";
		}

		if (field.key === "utility_bill_type") {
			if (!value) return `${label} is required.`;
			const lowered = String(value).toLowerCase();
			if (lowered.includes("mobile") || lowered.includes("cell")) return `mobile bills are not accepted.`;
			return "";
		}

		if (field.key === "utility_bill_issue_date") {
			if (!value) return `${label} is required.`;
			const issue = new Date(value);
			const now = new Date();
			const msInDay = 24 * 60 * 60 * 1000;
			const diffDays = Math.floor((now.getTime() - issue.getTime()) / msInDay);
			if (Number.isNaN(diffDays) || diffDays > 92 || diffDays < 0) return `must be within last 3 months.`;
			return "";
		}

		if (typeof value === "string") return value.trim() ? "" : `${label} is required.`;
		return value !== undefined && value !== null && value !== "" ? "" : `${label} is required.`;
	};

	const getStepErrors = (): Record<string, string> => {
		const errors: Record<string, string> = {};
		(currentStepFields as any[]).forEach((field) => {
			const v = (formData as any)[field.key];
			const msg = getFieldError(field, v);
			if (msg) errors[field.key] = msg;
		});

		// cross-field date rules within the current step
		const hasField = (k: string) => (currentStepFields as any[]).some((f) => f?.key === k);

		// fy_start <= fy_end
		if (hasField("fy_start") && hasField("fy_end")) {
			const s = (formData as any)?.fy_start;
			const e = (formData as any)?.fy_end;
			if (!s || !e) {
				if (!s) errors["fy_start"] = "financial year start is required.";
				if (!e) errors["fy_end"] = "financial year end is required.";
			} else {
				const sd = new Date(s);
				const ed = new Date(e);
				if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
					if (Number.isNaN(sd.getTime())) errors["fy_start"] = "enter a valid date.";
					if (Number.isNaN(ed.getTime())) errors["fy_end"] = "enter a valid date.";
				} else if (sd.getTime() > ed.getTime()) {
					errors["fy_end"] = "financial year end must be on or after start.";
				}
			}
		}

		// passport_expiry >= passport_issue_date
		if (hasField("passport_issue_date") && hasField("passport_expiry")) {
			const i = (formData as any)?.passport_issue_date;
			const x = (formData as any)?.passport_expiry;
			if (!i || !x) {
				if (!i) errors["passport_issue_date"] = "passport issue date is required.";
				if (!x) errors["passport_expiry"] = "passport expiry date is required.";
			} else {
				const id = new Date(i);
				const xd = new Date(x);
				if (Number.isNaN(id.getTime()) || Number.isNaN(xd.getTime())) {
					if (Number.isNaN(id.getTime())) errors["passport_issue_date"] = "enter a valid date.";
					if (Number.isNaN(xd.getTime())) errors["passport_expiry"] = "enter a valid date.";
				} else if (xd.getTime() < id.getTime()) {
					errors["passport_expiry"] = "passport expiry must be on or after issue date.";
				}
			}
		}

		// members' share % total
		if (supportsMultipleMembers) {
			const total = getMembersShareTotal();
			if (total > 100) {
				errors["share_pct_total"] = "total member share % cannot exceed 100.";
			}
		}

		return errors;
	};

	// Build a unique, deduplicated list of error messages for the bottom error component.
	const getUniqueBottomErrors = (): string[] => {
		// merge current step errors and any global (already computed) fieldErrors in state
		const merged: Record<string, string> = { ...fieldErrors };
		// ensure current step computed errors are included
		const current = getStepErrors();
		for (const k of Object.keys(current)) merged[k] = current[k];

		// Map field.key -> error_key for this step
		const keyToErrorKey = new Map<string, string>();
		(currentStepFields as any[]).forEach((f) => {
			if (f?.key) {
				keyToErrorKey.set(String(f.key), String(f.error_key || ""));
			}
		});

		// For special aggregate errors ensure they have a stable group key
		if (merged["share_pct_total"]) {
			if (!keyToErrorKey.has("share_pct_total")) {
				keyToErrorKey.set("share_pct_total", "share_pct_total");
			}
		}

		const seen = new Set<string>();
		const unique: string[] = [];
		for (const [k, message] of Object.entries(merged)) {
			const ek = keyToErrorKey.get(k);
			const groupKey = (ek && ek.length > 0) ? ek : message;
			if (!seen.has(groupKey) && typeof message === "string" && message.length > 0) {
				seen.add(groupKey);
				unique.push(message);
			}
		}
		return unique;
	};

	const getAllErrors = (): Record<string, string> => {
		const errors: Record<string, string> = {};

		steps.forEach(([, fields]) => {
			(fields as any[]).forEach((field: any) => {
				const v = (formData as any)[field.key];
				const msg = getFieldError(field, v);
				if (msg) errors[field.key] = msg;
			});
		});

		const fyStart = (formData as any)?.fy_start;
		const fyEnd = (formData as any)?.fy_end;
		if (fyStart && fyEnd) {
			const sd = new Date(fyStart);
			const ed = new Date(fyEnd);
			if (!Number.isNaN(sd.getTime()) && !Number.isNaN(ed.getTime()) && sd.getTime() > ed.getTime()) {
				errors["fy_end"] = "financial year end must be on or after start.";
			}
		}

		const passIssue = (formData as any)?.passport_issue_date;
		const passExpiry = (formData as any)?.passport_expiry;
		if (passIssue && passExpiry) {
			const id = new Date(passIssue);
			const xd = new Date(passExpiry);
			if (!Number.isNaN(id.getTime()) && !Number.isNaN(xd.getTime()) && xd.getTime() < id.getTime()) {
				errors["passport_expiry"] = "passport expiry must be on or after issue date.";
			}
		}

		if (Array.isArray((formData as any)?.members)) {
			const total = getMembersShareTotal();
			if (total > 100) errors["share_pct_total"] = "total member share % cannot exceed 100.";
		}

		return errors;
	};

	const validateCurrentStep = () => {
		const baseValid = (currentStepFields as any[]).every((field) =>
			validateField(field, (formData as any)[field.key]),
		);

		if (!baseValid) return false;

		// Additional rule: members' share % must not exceed 100 in total
		if (supportsMultipleMembers) {
			const total = getMembersShareTotal();
			if (total > 100) return false;
		}

		// cross-field date rules within the current step

		const hasField = (k: string) =>
			(currentStepFields as any[]).some((f) => f?.key === k);

		// fy_start <= fy_end
		if (hasField("fy_start") && hasField("fy_end")) {
			const s = (formData as any)?.fy_start;
			const e = (formData as any)?.fy_end;
			if (!s || !e) return false;
			const sd = new Date(s);
			const ed = new Date(e);
			if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) return false;
			if (sd.getTime() > ed.getTime()) return false;
		}

		// passport_expiry >= passport_issue_date
		if (hasField("passport_issue_date") && hasField("passport_expiry")) {
			const i = (formData as any)?.passport_issue_date;
			const x = (formData as any)?.passport_expiry;
			if (!i || !x) return false;
			const id = new Date(i);
			const xd = new Date(x);
			if (Number.isNaN(id.getTime()) || Number.isNaN(xd.getTime())) return false;
			if (xd.getTime() < id.getTime()) return false;
		}

		return true;
	};

	const validateAllRequired = () => {
		// validate every field
		const fieldsOk = steps.every(([, fields]) =>
			(fields as any[]).every((field: any) =>
				validateField(field, (formData as any)[field.key]),
			),
		);

		if (!fieldsOk) return false;

		// global cross-field rules that span steps

		const fyStart = (formData as any)?.fy_start;
		const fyEnd = (formData as any)?.fy_end;
		if (fyStart && fyEnd) {
			const sd = new Date(fyStart);
			const ed = new Date(fyEnd);
			if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) return false;
			if (sd.getTime() > ed.getTime()) return false;
		}

		const passIssue = (formData as any)?.passport_issue_date;
		const passExpiry = (formData as any)?.passport_expiry;
		if (passIssue && passExpiry) {
			const id = new Date(passIssue);
			const xd = new Date(passExpiry);
			if (Number.isNaN(id.getTime()) || Number.isNaN(xd.getTime())) return false;
			if (xd.getTime() < id.getTime()) return false;
		}

		if (Array.isArray((formData as any)?.members)) {
			const total = getMembersShareTotal();
			if (total > 100) return false;
		}

		return true;
	};

	const handleNext = () => {
		// let the user click next to see errors
		const errs = getStepErrors();
		setFieldErrors(errs);
		if (Object.keys(errs).length > 0) return;
		if (currentStepIndex < steps.length - 1) {
			setCurrentStepIndex((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStepIndex > 0) {
			setCurrentStepIndex((prev) => prev - 1);
		}
	};

	const handleSubmit = async () => {
		if (isSubmitting) return; // guard against double clicks

		// show all errors then stop if any
		const errs = getAllErrors();
		setFieldErrors(errs);
		if (Object.keys(errs).length > 0) return;

		if (!validateAllRequired()) return;

		setIsSubmitting(true); // start loading only after validation passes

		const pkg = (formData as any)?.contract_package as string | undefined;
		const links: Record<string, string> = {
			"Management and holding":
				"https://payment-links.mollie.com/payment/fRsUX5AaTLG9imPM5QEYK",
			"Online entrepreneur":
				"https://payment-links.mollie.com/payment/ozp2PH656BR4mxp7gPBLp",
			"Business complete":
				"https://payment-links.mollie.com/payment/tbiowKccyvqRhomcPjD7z",
			"Essential contracts":
				"https://payment-links.mollie.com/payment/CS7oNLhXWdtgP5XuJs6iK",
		};

		const target = pkg && links[pkg] ? links[pkg] : undefined;

		let createdCase: any = null;
		let ensuredCustomerId: string | null = null;
		let createdTicketId: string | null = null;

		try {
			// Resolve basic metadata first
			const nameCandidate =
				(formData as any)?.company_name ||
				(formData as any)?.company_name_1 ||
				[(formData as any)?.first_name, (formData as any)?.surname]
					.filter(Boolean)
					.join(" ") ||
				String((formData as any)?.email || "");
			const entityCountry: Record<string, string> = {
				"Dutch BV": "NL",
				"Belgian BV": "BE",
				"US LLC": "US",
				"US Corp": "US",
				"Hong Kong Pvt. Ltd.": "HK",
				"Dubai FZCO": "AE",
			};
			const countryCode = entityCountry[String(schema?.entity || "")] || "";
			const emailForCompany = String(
				(formData as any)?.email ||
					(formData as any)?.contact_email ||
					(formData as any)?.author_email ||
					"",
			).trim();

			// 1) Insert the case record with status "pending"
			createdCase = await insertCase({
				status: "pending",
				entity_type: schema?.entity ?? null,
				title:
					(formData as any)?.company_name ||
					(formData as any)?.company_name_1 ||
					null,
				author_user_id: user?.user_id ?? null,
				company_id: user?.company_id ?? null,
				metadata: formData ?? null,
			});

			// 2) Create company with dummy company number derived from case id
			try {
				const caseId =
					createdCase?.sf_formations_case_id ??
					(createdCase && (createdCase as any)["sf_formations_case_id"]) ??
					null;
				const dummyCompanyNumber = md5(`formations_${String(caseId)}`);

				const addressLine1 = String(
					(formData as any)?.address_line_1 || "",
				).trim();
				const addressLine2 = String(
					(formData as any)?.address_line_2 || "",
				).trim();
				const composedAddress = [addressLine1, addressLine2]
					.filter(Boolean)
					.join(", ");
				const selectedCountry = String(
					(formData as any)?.country || countryCode || "",
				).trim();

				await fetch(`${APP_CONFIG.api.xylex}/company/create`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-User-Id": String(user?.user_id || ""),
						"X-Organization-Id": String(user?.organization_id || ""),
					},
					body: JSON.stringify({
						name: nameCandidate,
						address: composedAddress,
						country: selectedCountry,
						entity_type: String(schema?.entity || ""),
						company_number: dummyCompanyNumber,
						email: emailForCompany,
					}),
				});
			} catch {}

			// 2) Ensure a customer exists in admin company for provided email
			const adminCompanyId = (APP_CONFIG as any)?.sf_formations
				?.admin_company_id as string | undefined;
			const emailFromForm = String(
				(formData as any)?.email ||
					(formData as any)?.contact_email ||
					(formData as any)?.author_email ||
					"",
			).trim();
			if (adminCompanyId && emailFromForm) {
				try {
					// fetch existing customer by email and company_id
					const resp = await fetch(`${APP_CONFIG.api.xylex}/fetch/data`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-Company-Id": String(user?.company_id || ""),
							"X-Organization-Id": String(user?.organization_id || ""),
							"X-User-Id": String(user?.user_id || ""),
							"Cache-Control": "no-cache",
						},
						body: JSON.stringify({
							table_name: "customers",
							conditions: [
								{ eq_column: "email", eq_value: emailFromForm },
								{ eq_column: "company_id", eq_value: adminCompanyId },
							],
							limit: 1,
						}),
					});
					if (resp.ok) {
						const json = await resp.json();
						const existing =
							Array.isArray(json?.data) && json.data.length > 0
								? json.data[0]
								: null;
						if (existing?.customer_id) {
							ensuredCustomerId = String(existing.customer_id);
						}
					}
				} catch {}

				// If not found, create it
				if (!ensuredCustomerId) {
					try {
						const nameCandidate =
							(formData as any)?.company_name ||
							(formData as any)?.company_name_1 ||
							[(formData as any)?.first_name, (formData as any)?.surname]
								.filter(Boolean)
								.join(" ") ||
							emailFromForm;
						const createdCustomer = await insertCustomer({
							email: emailFromForm,
							name: nameCandidate,
							company_id: adminCompanyId,
							status: "ACTIVE",
							metadata: formData ?? null,
						});
						if (createdCustomer?.customer_id) {
							ensuredCustomerId = String(createdCustomer.customer_id);
						}
					} catch {}
				}
			}

			// 3) Create a ticket for that customer/company if we have customer_id
			if (ensuredCustomerId) {
				try {
					// Map the formation entity to a ticket scope, default to none if not mapped
					const entityLabel = String(schema?.entity || "").toLowerCase();
					const formationScope = (() => {
						if (entityLabel.includes("us llc")) return "formation_us_llc";
						if (entityLabel.includes("us corp")) return "formation_us_corp";
						if (entityLabel.includes("dutch bv")) return "formation_nl_bv";
						if (entityLabel.includes("belgian bv")) return "formation_be_be";
						if (entityLabel.includes("dubai") || entityLabel.includes("ifzo"))
						 return "formation_ue_ifzo";
						if (entityLabel.includes("hong kong")) return "formation_hk_pt_ltd";
						return undefined;
					})();

					const ticket = await insertTicket({
						title:
							`Formation case: ` +
							((formData as any)?.company_name ||
								(formData as any)?.company_name_1 ||
								schema?.entity ||
								""),
						description: (formData as any)?.description || null,
						creator_userid: user?.user_id ?? null,
						assignee_userid: null,
						priority: null,
						status: "open",
						company_id: user?.company_id ?? null,
						customer_id: ensuredCustomerId,
						...(formationScope ? { scope: formationScope } : {}),
						note: null,
					} as any);
					if (ticket?.ticket_id) {
						createdTicketId = String(ticket.ticket_id);
					}
				} catch {}
			}

			// 4) Update the case with customer_id and ticket_id if we have them
			try {
				if (
					(createdCase?.sf_formations_case_id ||
						createdCase?.sf_formations_case_id === 0) &&
					(ensuredCustomerId || createdTicketId)
				) {
					await updateCase(
						"sf_formations_case_id",
						String(createdCase.sf_formations_case_id),
						{
							...(ensuredCustomerId ? { customer_id: ensuredCustomerId } : {}),
							...(createdTicketId ? { ticket_id: createdTicketId } : {}),
						},
					);
				}
			} catch {}

			// 5) If no KYC provided then pre-make a task
			try {
				const hasKycField = Object.keys((formData as any) || {}).some((k) =>
					k.toLowerCase().includes("kyc"),
				);
				if (!hasKycField) {
					const taskPayload = {
						table_name: "tasks",
						insert_body: {
							active: true,
							completed: false,
							title: "Provide KYC",
							description:
								"Please provide KYC documentation for this formation case.",
							company_id: user?.company_id ?? null,
							affected_user: user?.user_id ?? null,
							impact: null,
							language: null,
							start_href: null,
							view_details_href: null,
							affected_resource_objects: {
								case_id: createdCase?.sf_formations_case_id ?? null,
							},
						},
					} as any;

					await fetch(`${APP_CONFIG.api.xylex}/data/insert`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							"X-Company-Id": String(user?.company_id || ""),
							"X-Organization-Id": String(user?.organization_id || ""),
							"X-User-Id": String(user?.user_id || ""),
						},
						body: JSON.stringify(taskPayload),
					});
				}
			} catch {}
		} catch (e) {
			// non-fatal; proceed to the original onSubmit handler
			// eslint-disable-next-line no-console
			console.error("Failed to submit formation case flow", e);
		} finally {
			onSubmit(formData);

			if (target) {
				try {
					window.location.assign(target);
				} catch {}
			}

			setIsSubmitting(false); // stop loading when we are done
		}
	};

	const isLastStep = currentStepIndex === steps.length - 1;

	const shouldShowCapitalNote = () => {
		if (schema.entity !== "Dubai FZCO") return false;
		const proposedCapital = Number(formData.proposed_capital) || 0;
		const numShareholders = Number(formData.num_shareholders) || 1;
		const capitalPerShareholder = proposedCapital / numShareholders;

		return capitalPerShareholder < 48000;
	};

	const renderFieldsWithLayout = (fields: any[]) => {
		const result = [];
		let i = 0;

		while (i < fields.length) {
			const currentField = fields[i];
			const nextField = fields[i + 1];

			if (schema.entity === "Dubai FZCO") {
				if (
					currentField.key === "license_type" &&
					nextField?.key === "license_validity"
				) {
					result.push(
						<div
							key={`${currentField.key}-${nextField.key}`}
							className="grid grid-cols-1 gap-4 sm:grid-cols-2"
						>
							<FormField
								field={currentField}
								value={formData[currentField.key]}
								onChange={(value) => updateField(currentField.key, value)}
								formData={formData}
								error={fieldErrors[currentField.key]}
							/>
							<FormField
								field={nextField}
								value={formData[nextField.key]}
								onChange={(value) => updateField(nextField.key, value)}
								formData={formData}
								error={fieldErrors[nextField.key]}
							/>
						</div>,
					);
					i += 2;
					continue;
				}

				if (currentField.key === "fy_start" && nextField?.key === "fy_end") {
					result.push(
						<div
							key={`${currentField.key}-${nextField.key}`}
							className="grid grid-cols-1 gap-4 sm:grid-cols-2"
						>
							<FormField
								field={currentField}
								value={formData[currentField.key]}
								onChange={(value) => updateField(currentField.key, value)}
								formData={formData}
								error={fieldErrors[currentField.key]}
							/>
							<FormField
								field={nextField}
								value={formData[nextField.key]}
								onChange={(value) => updateField(nextField.key, value)}
								formData={formData}
								error={fieldErrors[nextField.key]}
							/>
						</div>,
					);
					i += 2;
					continue;
				}
			}

			if (currentField.key === "first_name" && nextField?.key === "surname") {
				result.push(
					<div
						key={`${currentField.key}-${nextField.key}`}
						className="flex w-full flex-col gap-4 sm:flex-row"
					>
						<div className="w-full">
							<FormField
								field={currentField}
								value={formData[currentField.key]}
								onChange={(value) => updateField(currentField.key, value)}
								formData={formData}
								error={fieldErrors[currentField.key]}
							/>
						</div>
						<div className="w-full">
							<FormField
								field={nextField}
								value={formData[nextField.key]}
								onChange={(value) => updateField(nextField.key, value)}
								formData={formData}
								error={fieldErrors[nextField.key]}
							/>
						</div>
					</div>,
				);
				i += 2;
			} else {
				const shouldShowConditional =
					currentField.type === "conditional_note" &&
					currentField.condition === "capital_per_shareholder_below_48000" &&
					shouldShowCapitalNote();

				result.push(
					<FormField
						key={currentField.key}
						field={currentField}
						value={formData[currentField.key]}
						onChange={(value) => updateField(currentField.key, value)}
						formData={{ ...formData, entity: schema?.entity }}
						shouldShowConditionalNote={shouldShowConditional}
						error={fieldErrors[currentField.key]}
					/>,
				);
				i += 1;
			}
		}

		return result;
	};

	return (
		<div className="space-y-8">
			<h2 className="px-4 text-xl font-semibold capitalize text-primary">
				{currentStepName.replace("_", " ")}
			</h2>

			<Container>
				<div className="space-y-6">
					{renderFieldsWithLayout(currentStepFields)}
					{/* show a single step-level message for aggregate constraints if present */}
					{fieldErrors["share_pct_total"] ? (
						<p className="text-sm text-red-600">{fieldErrors["share_pct_total"]}</p>
					) : null}
				</div>
			</Container>

			<div className="space-y-4">
				{supportsMultipleMembers ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-primary">Members</h3>
							<Button
								type="button"
								variant="invisible"
								onClick={() => {
									setFormData((prev: any) => {
										const list = Array.isArray(prev.members)
											? prev.members
											: [];
										return {
											...prev,
											members: [
												...list,
												{
													first_name:
														list.length === 0 ? (user?.first_name ?? "") : "",
													middle_name: "",
													surname:
														list.length === 0 ? (user?.last_name ?? "") : "",
													email: "",
													dob: null,
													share_pct: "",
												},
											],
										};
									});
								}}
							>
								<Plus className="stroke-icon h-5 w-5" />
								Member
							</Button>
						</div>

						{/* Calculated total members (disabled) */}
						<div>
							<FormField
								field={{
									key: "total_members",
									label: "Total members",
									type: "calculated",
									required: false,
								}}
								value={membersCount}
								onChange={() => {}}
								formData={formData}
							/>
						</div>

						{Array.isArray((formData as any).members) &&
						(formData as any).members.length > 0 ? (
							<div className="space-y-4">
								{(formData as any).members.map((m: any, idx: number) => (
									<div key={idx} className="rounded-sm border p-4">
										<div className="mb-3 flex items-center justify-between">
											<div className="text-sm font-medium text-primary">
												Member {idx + 1}
											</div>
											<Button
												type="button"
												variant="ghost"
												className="rounded-sm"
												onClick={() => {
													setFormData((prev: any) => {
														const list = Array.isArray(prev.members)
															? [...prev.members]
															: [];
														list.splice(idx, 1);
														return { ...prev, members: list };
													});
												}}
												aria-label={`Remove member ${idx + 1}`}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>

										<div className="space-y-4">
											<div className="flex w-full flex-col gap-4 sm:flex-row">
												<div className="w-full">
													<FormField
														field={{
															key: "first_name",
															label: "First name",
															type: "text",
															required: false,
														}}
														value={m.first_name}
														onChange={(value) =>
															setFormData((prev: any) => {
																const list = Array.isArray(prev.members)
																	? [...prev.members]
																	: [];
																list[idx] = { ...list[idx], first_name: value };
																return { ...prev, members: list };
															})
														}
														formData={formData}
													/>
												</div>
												<div className="w-full">
													<FormField
														field={{
															key: "surname",
															label: "Surname",
															type: "text",
															required: false,
														}}
														value={m.surname}
														onChange={(value) =>
															setFormData((prev: any) => {
																const list = Array.isArray(prev.members)
																	? [...prev.members]
																	: [];
																list[idx] = { ...list[idx], surname: value };
																return { ...prev, members: list };
															})
														}
														formData={formData}
													/>
												</div>
											</div>
											<FormField
												field={{
													key: "middle_name",
													label: "Middle name",
													type: "text",
													required: false,
												}}
												value={m.middle_name}
												onChange={(value) =>
													setFormData((prev: any) => {
														const list = Array.isArray(prev.members)
															? [...prev.members]
															: [];
														list[idx] = { ...list[idx], middle_name: value };
														return { ...prev, members: list };
													})
												}
												formData={formData}
											/>
											<FormField
												field={{
													key: "email",
													label: "Email",
													type: "email",
													required: false,
												}}
												value={m.email}
												onChange={(value) =>
													setFormData((prev: any) => {
														const list = Array.isArray(prev.members)
															? [...prev.members]
															: [];
														list[idx] = { ...list[idx], email: value };
														return { ...prev, members: list };
													})
												}
												formData={formData}
											/>
											<FormField
												field={{
													key: "dob",
													label: "Date of birth",
													type: "date",
													required: false,
												}}
												value={m.dob}
												onChange={(value) =>
													setFormData((prev: any) => {
														const list = Array.isArray(prev.members)
															? [...prev.members]
															: [];
														list[idx] = { ...list[idx], dob: value };
														return { ...prev, members: list };
													})
												}
												formData={formData}
											/>
											<FormField
												field={{
													key: "share_pct",
													label: "Share %",
													type: "number",
													required: false,
													min: 0,
													max: 100,
													step_size: 10,
												}}
												value={m.share_pct ?? ""}
												onChange={(value) =>
													setFormData((prev: any) => {
														const list = Array.isArray(prev.members)
															? [...prev.members]
															: [];
														list[idx] = { ...list[idx], share_pct: value };
														return { ...prev, members: list };
													})
												}
												formData={formData}
											/>
										</div>
									</div>
								))}
							</div>
						) : null}
					</div>
				) : null}
			</div>

			<div className="flex justify-between px-4 pt-4">
				{currentStepIndex > 0 ? (
					<Button
						variant="ghost"
						onClick={handlePrevious}
						className="rounded-sm border-0"
					>
						<ChevronLeft className="mr-2 h-4 w-4" />
						Previous
					</Button>
				) : (
					<div />
				)}

				{isLastStep ? (
					<Button onClick={handleSubmit} variant="brand" aria-busy={isSubmitting}>
						{isSubmitting ? (
							<span className="flex items-center">
								<svg
									className="mr-2 h-4 w-4 animate-spin"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
										fill="none"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
									/>
								</svg>
								Submitting...
							</span>
						) : (
							"Submit"
						)}
					</Button>
				) : (
					<Button onClick={handleNext} variant="brand">
						Next
						<ChevronRight className="ml-2 h-4 w-4 stroke-white" />
					</Button>
				)}
			</div>
		</div>
	);
}



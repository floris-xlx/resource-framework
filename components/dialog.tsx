"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";

type Primitive = string | number | boolean | null | undefined;

export type FieldEditorSpec = {
	type?: "text" | "number" | "boolean" | "select" | "keyvalue";
	options?: Array<{ label: string; value: string | number | boolean }>;
};

export type FieldSpec =
	| string
	| {
			column_name: string;
			header?: string;
			header_label?: string;
			hidden?: boolean;
			data_type?: string;
			// Optional default value. Useful for hidden/system fields like customer_id.
			default_value?: Primitive;
			editor?: FieldEditorSpec;
	  };

export function SpecDrivenDialog(props: {
	open: boolean;
	onClose: () => void;
	title: string;
	spec: Array<FieldSpec>;
	initial?: Partial<Record<string, Primitive>>;
	pending?: boolean;
	submitLabel?: string;
	cancelLabel?: string;
	onSubmit(values: Record<string, unknown>): void;
	stripEmpty?: boolean;
}) {
	const {
		open,
		onClose,
		title,
		spec,
		initial = {},
		pending = false,
		submitLabel = "Create",
		cancelLabel = "Cancel",
		onSubmit,
		stripEmpty = true,
	} = props;

	const [values, setValues] = useState<Record<string, Primitive>>({});

	useEffect(() => {
		if (!open) return;
		const init: Record<string, Primitive> = {};
		const mapped = Array.isArray(spec) ? spec : [];
		mapped.forEach((s) => {
			const key = typeof s === "string" ? s : String(s?.column_name || "");
			if (!key) return;
			init[key] = initial[key] ?? "";
		});
		setValues(init);
	}, [open, JSON.stringify(spec), JSON.stringify(initial)]);

	const fields = useMemo(() => {
		const normalize = (s: FieldSpec) => {
			if (typeof s === "string") {
				return {
					key: s,
					label: s.replace(/_/g, " "),
					hidden: false,
					data_type: "",
					editor: undefined as FieldEditorSpec | undefined,
				};
			}
			const key = String(s?.column_name || "").trim();
			const label = String(s?.header_label || s?.header || key).trim();
			return {
				key,
				label: label.replace(/_/g, " "),
				hidden: Boolean(s?.hidden),
				data_type: String(s?.data_type || ""),
				editor: s?.editor,
			};
		};
		const detectType = (
			dataType: string,
			editor?: FieldEditorSpec,
		): "text" | "number" | "boolean" | "select" | "keyvalue" => {
			if (editor?.type) return editor.type;
			const dt = String(dataType || "").toLowerCase();
			if (dt.includes("bool")) return "boolean";
			if (
				dt.includes("num") ||
				dt.includes("int") ||
				dt.includes("decimal") ||
				dt.includes("currency")
			)
				return "number";
			return editor?.options ? "select" : "text";
		};
		return (Array.isArray(spec) ? spec : [])
			.map(normalize)
			.filter((f) => f.key && !f.hidden)
			.map((f) => {
				const type = detectType(f.data_type, f.editor);
				const options =
					type === "select" && Array.isArray(f.editor?.options)
						? f.editor?.options
						: undefined;
				return { ...f, type, options };
			});
	}, [JSON.stringify(spec)]);

	function handleSubmit() {
		const out: Record<string, unknown> = {};
		Object.entries(values).forEach(([k, v]) => {
			if (!stripEmpty) {
				out[k] = v as unknown;
				return;
			}
			if (v === "" || v == null) return;
			out[k] = v as unknown;
		});
		onSubmit(out);
	}

	return (
		<ResponsiveDialog isOpen={open} onClose={onClose} title={title} className="max-w-[620px]">
			<div className="space-y-4 px-1">
				{fields.map((col) => (
					<label key={col.key} className="flex flex-col gap-1">
						<span className="text-sm font-medium capitalize text-secondary">
							{col.label}
						</span>
						{col.type === "boolean" ? (
							<label className="inline-flex items-center gap-2">
								<input
									type="checkbox"
									className="rounded-sm"
									checked={Boolean(values[col.key])}
									onChange={(e) =>
										setValues((s) => ({ ...s, [col.key]: e.target.checked }))
									}
								/>
								<span className="text-xs text-secondary">
									{values[col.key] ? "Yes" : "No"}
								</span>
							</label>
						) : col.type === "select" && Array.isArray(col.options) ? (
							<div className="h-8">
								<ResponsiveDropdownV2
									items={(col.options || []).map((opt) => ({
										buttonText: String(opt.label ?? opt.value),
										isActive: String(values[col.key]) === String(opt.value),
										onClick: () =>
											setValues((s) => ({
												...s,
												[col.key]: opt.value as any,
											})),
									}))}
									triggerButton={
										<Button
											variant="outline"
											size="sm"
											className="h-8 w-full justify-between"
										>
											<span className="truncate text-left text-secondary">
												{(() => {
													const current = (col.options || []).find(
														(o) => String(o.value) === String(values[col.key]),
													);
													return current
														? String(current.label ?? current.value)
														: "Select…";
												})()}
											</span>
										</Button>
									}
									enableSearch
									inputPlaceholder="Search…"
									noResultsMessage="No options"
									forceNativeOnMobile
									scrollBarInvisible
								/>
							</div>
						) : col.type === "keyvalue" ? (
							<div className="space-y-2 rounded-sm border p-2">
								{(() => {
									const obj = (values[col.key] ?? {}) as Record<string, unknown>;
									const entries = Object.entries(obj);
									const setKV = (k: string, v: unknown) => {
										setValues((s) => {
											const next = { ...(s[col.key] as any) };
											if (v === "" || v == null) {
												delete next[k];
											} else {
												next[k] = v as any;
											}
											return { ...s, [col.key]: next };
										});
									};
									const renameKey = (oldK: string, newK: string) => {
										if (!newK || newK === oldK) return;
										setValues((s) => {
											const next = { ...(s[col.key] as any) };
											const val = next[oldK];
											delete next[oldK];
											if (newK) next[newK] = val;
											return { ...s, [col.key]: next };
										});
									};
									return (
										<>
											{entries.map(([k, v], idx) => (
												<div key={`${k}-${idx}`} className="flex gap-2">
													<Input
														className="h-8"
														placeholder="key"
														value={k}
														onChange={(e) => renameKey(k, e.target.value)}
													/>
													<Input
														className="h-8"
														placeholder="value"
														value={v as any as string}
														onChange={(e) => setKV(k, e.target.value)}
													/>
												</div>
											))}
											<Button
												variant="outline"
												size="sm"
												className="h-8"
												onClick={() => {
													const base = "key";
													let i = 1;
													let candidate = base;
													while (Object.prototype.hasOwnProperty.call(obj, candidate)) {
														candidate = `${base}_${i++}`;
													}
													setKV(candidate, "");
												}}
											>
												Add field
											</Button>
										</>
									);
								})()}
							</div>
						) : (
							<Input
								className="h-8"
								type={col.type === "number" ? "number" : "text"}
								value={values[col.key] == null ? "" : String(values[col.key] ?? "")}
								onChange={(e) =>
									setValues((s) => ({ ...s, [col.key]: e.target.value }))
								}
							/>
						)}
					</label>
				))}
			</div>
			<div className="mt-4 flex justify-end gap-2 px-1">
				<Button variant="outline" size="sm" onClick={onClose} disabled={pending}>
					{cancelLabel}
				</Button>
				<Button
					variant="brand"
					size="sm"
					onClick={() => handleSubmit()}
					disabled={pending}
					className="rounded-sm"
				>
					{submitLabel}
				</Button>
			</div>
		</ResponsiveDialog>
	);
}



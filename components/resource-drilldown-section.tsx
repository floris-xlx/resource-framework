"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrilldownSection } from "@/packages/ui-patterns/src";
import { useApiClient } from "@/hooks/use-api-client";
import { CreateResourceDialog } from "./create-resource-dialog";

export function ResourceDrilldownSection({
	resourceName,
	title,
	cacheEnabled = false,
	onCreated,
	required,
	optional,
	columns,
	table,
	defaultValues,
	children,
}: {
	resourceName: string;
	title?: string;
	cacheEnabled?: boolean;
	onCreated?: (row: any) => void;
	required?: string[];
	optional?: string[];
	columns?: Array<any>;
	table?: string;
	defaultValues?: Record<string, string | number | boolean | null>;
	children?: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);

	const { data: routeRow } = useApiClient<any>({
		table: "resource_routes",
		conditions: [{ eq_column: "resource_name", eq_value: resourceName }],
		single: true,
		enabled: Boolean(resourceName),
		noCache: !cacheEnabled,
	});

	const resolvedTitle = useMemo(
		() => title || (routeRow?.page_label as string) || resourceName,
		[title, routeRow?.page_label, resourceName],
	);

	const canCreate = Boolean(routeRow?.enable_new_resource_creation === true);

	return (
		<DrilldownSection title={resolvedTitle}>
			<div className="flex items-start justify-between">
				<div className="flex-1">{children}</div>
				{canCreate && (
					<Button
						variant="icon_v2"
						size="icon_v2"
						onClick={() => setOpen(true)}
						className="ml-2 rounded-sm"
						aria-label="Create"
						title="Create"
					>
						<Plus className="h-5 w-5" />
					</Button>
				)}
			</div>
			<CreateResourceDialog
				open={open}
				onClose={() => setOpen(false)}
				title={`New ${String(routeRow?.page_label || resourceName)}`}
				resourceName={resourceName}
				required={required}
				optional={optional}
				columns={columns as any}
				table={table}
				cacheEnabled={cacheEnabled}
				defaultValues={defaultValues}
				onCreated={(row) => {
					setOpen(false);
					onCreated?.(row);
				}}
			/>
		</DrilldownSection>
	);
}



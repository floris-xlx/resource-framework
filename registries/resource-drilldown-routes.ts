export type ResourceDrilldownRoute = {
  title?: (row: any) => string;
  subtitle?: (row: any) => string;
  backLabel?: string | ((resourceName: string) => string);
  actions?: DrilldownAction[];
  sections?: DrilldownSectionConfig[];
  pathTemplate?: string; // eg. `/v2/${name}/{{uuid}}`
};

export type ResourceDrilldownRegistry = Record<string, ResourceDrilldownRoute>;

export function getDrilldownPath(
  name: string,
  payload: Record<string, unknown>,
) {
  const key = String(name || "").toLowerCase();
  const entry = RESOURCE_DRILLDOWN_ROUTES[key];
  if (!entry) return null;
  const tpl = entry.pathTemplate || "";
  return tpl.replace(/\{\{(.*?)\}\}/g, (_, p1) => {
    const k = String(p1 || "").trim();
    const v = k.includes(".")
      ? k.split(".").reduce((obj: any, part: string) => obj?.[part], payload)
      : (payload as any)[k];
    return encodeURIComponent(String(v ?? ""));
  });
}

export type DrilldownField =
  | string
  | {
      key: string;
      label?: string;
      hidden?: boolean;
    };

export type DrilldownSectionConfig = {
  title: string;
  columns?: 1 | 2 | 3 | 4;
  fields: DrilldownField[];
};

export type DrilldownAction =
  | {
      label: string;
      onClick: (row: any) => void;
      destructive?: boolean;
      disabled?: (row: any) => boolean | boolean;
    }
  | { type: "separator" };

export const RESOURCE_DRILLDOWN_ROUTES: Record<string, ResourceDrilldownRoute> =
  {
    invoices: {
      title: (row) => `Invoice ${row?.invoice_nr ?? ""}`,
      sections: [
        {
          title: "Main",
          columns: 2,
          fields: ["invoice_nr", "status", { key: "amount", label: "Total" }],
        },
      ],
    },
    customers: {
      title: (row) => row?.name || `Customer ${row?.customer_id}`,
      sections: [
        {
          title: "General information",
          columns: 2,
          fields: [
            { key: "status", label: "Status" },
            { key: "name", label: "Name" },
            { key: "language", label: "Language" },
            { key: "company_number", label: "Company number" },
            { key: "vat_id", label: "VAT ID" },
            { key: "customer_type_id", label: "Customer type" },
            { key: "account_manager", label: "Account manager" },
            { key: "owner", label: "Owner" },
            { key: "legal_form", label: "Legal form" },
            { key: "size", label: "Size" },
            { key: "label", label: "Label" },
            { key: "note", label: "Note" },
          ],
        },
        {
          title: "Contact",
          columns: 2,
          fields: [
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "website", label: "Website" },
          ],
        },
        {
          title: "Address",
          columns: 2,
          fields: [
            { key: "street_address", label: "Street address" },
            { key: "address_line_2", label: "Address line 2" },
            { key: "city", label: "City" },
            { key: "state_province_region", label: "State/Province/Region" },
            { key: "postal_code", label: "Postal code" },
            { key: "country", label: "Country" },
          ],
        },
        {
          title: "Administration",
          columns: 2,
          fields: [
            { key: "administration", label: "Administration" },
            { key: "timezone", label: "Timezone" },
            { key: "primary_ledger", label: "Primary ledger" },
            {
              key: "primary_ledger_tenant_id",
              label: "Primary ledger tenant id",
            },
            { key: "sla_agreed_response", label: "SLA agreed response" },
            {
              key: "sla_reporting_format_cadence",
              label: "SLA reporting cadence",
            },
            { key: "accounting_start_date", label: "Accounting start date" },
            { key: "contract_start_date", label: "Contract start date" },
            { key: "allow_self_accounting", label: "Allow self accounting" },
            { key: "self_booking", label: "Self booking" },
            { key: "closing_enabled", label: "Closing enabled" },
            { key: "subject_to_vat", label: "Subject to VAT" },
            {
              key: "subject_to_reverse_vat_charge",
              label: "Subject to reverse VAT charge",
            },
            { key: "bundle", label: "Bundle" },
          ],
        },
        {
          title: "Compliance",
          columns: 2,
          fields: [
            { key: "kyc_status", label: "KYC status" },
            { key: "risk_rating", label: "Risk rating" },
            { key: "signed_gdpr_document", label: "Signed GDPR document" },
            { key: "dpa_signed", label: "DPA signed" },
            { key: "dpa_signed_url", label: "DPA signed URL" },
            { key: "dpa_signed_at", label: "DPA signed at" },
            {
              key: "pep_sanction_checked_at",
              label: "PEP sanction checked at",
            },
            { key: "is_pep_sanction", label: "Is PEP/Sanction" },
            {
              key: "adverse_media_check_flags",
              label: "Adverse media check flags",
            },
            {
              key: "adverse_media_checked_at",
              label: "Adverse media checked at",
            },
            {
              key: "adverse_media_data_provider",
              label: "Adverse media data provider",
            },
          ],
        },
        {
          title: "Other",
          columns: 2,
          fields: [
            { key: "created_at", label: "Created at" },
            { key: "archived_at", label: "Archived at" },
            { key: "inactive_on", label: "Inactive on" },
            { key: "last_seen_at", label: "Last seen at" },
            { key: "data_provider", label: "Data provider" },
            { key: "data_residency", label: "Data residency" },
            { key: "group_structure", label: "Group structure" },
            { key: "metadata", label: "Metadata" },
            { key: "custom_tags", label: "Custom tags" },
            { key: "avatar", label: "Avatar" },
          ],
        },
      ],
    },

    v_banking_accounts: {
      title: (row) =>
        `${row?.financial_institution_name} - ${row?.display_name}` ||
        `Bank account ${row?.bank_account_id}`,
      backLabel: "Back to banking accounts",
    },
    files: {
      title: (row) => `${row?.filename}` || `File ${row?.file_id}`,
    },
    sf_formation_cases: {
      title: (row) =>
        row?.title || row?.entity_type || `Case ${row?.sf_formations_case_id}`,
      sections: [
        {
          title: "Case details",
          columns: 1,
          fields: [
            { key: "entity_type", label: "Entity" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created" },
          ],
        },
      ],
    },
  };

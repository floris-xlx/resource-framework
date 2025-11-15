export type ResourceRouteEntry = {
  name: string;
  title?: string;
  path?: string;
  drilldownPathTemplate?: string; // e.g. `/v2/${name}/{{uuid}}`
  columns?: Array<any>;
};

// Extended type used by ResourceDrilldown implementation

export type ResourceRouteRegistry = Record<string, ResourceRouteEntry>;
import type { ResourceFieldSpec, BuiltColumnSpec } from "../resource-types";
export const resourceRoutes: ResourceRouteRegistry = {};

export function getResourceRoute(name: string): ResourceRouteEntry | null {
  const key = String(name || "").toLowerCase();
  return resourceRoutes[key] ?? null;
}

// Compatibility constants expected by consumer components

import { defineColumns } from "../constructors/define-columns";
export type NewResourceContext = {
  user: any;
  router: any;
  clearState?: () => void;
  setInvoice?: (inv: any) => void;
  setQuote?: (quote: any) => void;
  setLineItems?: (li: any[]) => void;
  setLoading?: (b: boolean) => void;
  setError?: (err: string) => void;
};

export type ResourceCreateConfig = {
  scope: string | string[];
  showButtonScope?: string | string[];
  required: string[]; // keep minimal implementation (array); schema support can be added later
  optional?: string[];
  dialog?: React.ComponentType<{
    onSubmit(values: Record<string, unknown>): void;
    onCancel(): void;
    initial?: Partial<Record<string, unknown>>;
  }>;
};

export type ResourceRoute = {
  table: string;
  idColumn: string;
  // Optional path segment to use after /v2/, defaults to the resource route name
  path?: string;
  // Optional categories to group edit fields into tabs (order matters)
  categories?: string[];
  // Optional Postgres schema for this resource; defaults to 'public'
  schema?: string;
  // When true, drilldown is always in edit mode without an edit toggle
  permanent_edit_state?: boolean;
  // When true, the index page must clear the back button store
  force_remove_back_button_store_on_index_resource?: boolean;
  enableSearch?: boolean;
  searchBy?: string;
  // Optional: when set, the sidebar will scope/spoof to this route root (e.g. "/sf-formations")
  sidebar_route?: string;
  // Optional column name that contains an avatar/image URL to show on drilldown
  avatar_column?: string;
  // Optional lucide-react icon name to display on drilldown when no avatar
  icon?: string;
  // New: scoped creation config
  create?: ResourceCreateConfig;
  enableNewResourceCreation?: boolean;
  newResourceButtonText?: string;
  newResourceHref?: string;
  // Optional: function to be invoked when clicking 'new resource' button. Use instead of newResourceHref for function-based navigation.
  newResourceOnClick?: (ctx: NewResourceContext) => Promise<void> | void;
  page_label?: string;
  forceWrappingHeaderLabels?: boolean;
  disableCompanyFilter?: boolean;
  drilldownRoutePrefix?: string;
  // Optional custom drilldown href. Can be a template string with {{column}}
  // placeholders or a function receiving the row.
  drilldownHref?: string | ((row: any) => string);
  columns?: Array<
    | string
    | {
        column_name: string;
        header?: string;
        header_label?: string;
        use?: string;
        order?: number;
        href?: string;
        hidden?: boolean;
        label?: string;
        cell_value_mask_label?: string;
        formatter?: (value: any, row: any) => any;
        minWidth?: number;
        maxWidth?: number;
        widthFit?: boolean;
        editable?: {
          type: "text" | "select" | "boolean";
          update_table?: string;
          update_id_column?: string;
          update_column?: string;
          options?: Array<{ label: string; value: string | number | boolean }>;
          // Optional metadata for option resolution (e.g., "table.column" or { table, column })
          data_source?: string | { table: string; column: string };
        };
      }
  >;
  companyIdColumn?: string;
  edit?: {
    enabled?: boolean; // master switch
    // If provided, only these columns are editable (idColumn is always excluded)
    allowedColumns?: string[];
    // Columns never editable
    deniedColumns?: string[];
    // Optional scope string; if set, only users with this permission can edit
    scope?: string;
    // When true, skip the company_id check before allowing mutations
    IgnoreCompanyCheckBeforeMutation?: boolean;
  };
  rowActions?: Array<
    | {
        label: string;
        onClick: (row: any) => void;
        destructive?: boolean;
        disabled?: (row: any) => boolean | boolean;
      }
    | { type: "separator" }
  >;
  // Optional React component or element to render above the table on the list page
  customComponent?: any;
  // Optional React component or element to render inside the drilldown page
  drilldownCustomComponent?: any;
  // Optional chat configuration to render a generic chat in drilldown
  chat?: {
    table: string;
    foreignKeyColumn: string;
    messageColumn?: string;
    authorUserIdColumn?: string;
  };
};

export const RESOURCE_ROUTES: Record<string, ResourceRoute> = {
  gl_account_templates: {
    table: "gl_accounts",
    idColumn: "gl_account_id",
    disableCompanyFilter: true,
    enableSearch: true,
    searchBy: "code,name,category,coa_provider,coa_version",
    columns: [
      { column_name: "code" },
      { column_name: "name" },
      { column_name: "number" },
      { column_name: "credit_or_debit" },
      { column_name: "category" },
      { column_name: "is_postable" },
      { column_name: "country_code" },
      { column_name: "coa_provider" },
      { column_name: "coa_version" },
    ],
  },
  products: {
    table: "products",
    idColumn: "product_id",
  },
  journal_entries: {
    table: "journal_entries",
    idColumn: "journal_entry_id",
    companyIdColumn: "company_id",
    enableSearch: true,
    searchBy: "journal_entry_id,transaction_id,description",
    columns: [
      { column_name: "journal_entry_id" },
      { column_name: "entry_date" },
      { column_name: "transaction_id" },
      { column_name: "description" },
    ],
  },
  journal_lines: {
    table: "journal_lines",
    idColumn: "journal_line_id",
    disableCompanyFilter: true,
    enableSearch: true,
    searchBy: "journal_line_id,journal_entry_id,gl_account_id,debit,credit",
  },
  company_gl_accounts: {
    table: "company_gl_accounts",
    idColumn: "company_gl_account_id",
    enableSearch: true,
    searchBy: "company_gl_account_id,alias_name,template_id",
    disableCompanyFilter: true,
  },
  coa_providers: {
    table: "coa_providers",
    idColumn: "coa_provider_id",
    disableCompanyFilter: true,
    enableSearch: true,
    searchBy: "provider_code,provider_name,version,country_code",
  },
  v_gl_full_audit: {
    table: "v_gl_full_audit",
    idColumn: "journal_entry_id",
    companyIdColumn: "company_id",
    enableSearch: true,
    searchBy: "invoice_number,merchant_name,tx_description,posting_status",
    disableCompanyFilter: true,
  },
  customers: {
    table: "customers",
    idColumn: "customer_id",
    create: {
      scope: "create:customers",
      required: ["name", "email"],
    },
    edit: {
      enabled: true,
      scope: "edit:customers",
      deniedColumns: ["customer_id"],
    },
    drilldownRoutePrefix: "/customers",
    force_remove_back_button_store_on_index_resource: true,
    avatar_column: "avatar",
    enableNewResourceCreation: true,
    page_label: "Customers",
    categories: ["Basic", "Address", "Business", "Tax", "Dates"],
    columns: defineColumns([
      {
        column_name: "name",
        category: "Basic",
        minWidth: 200,
        maxWidth: 200,
        order: 1,
      },
      {
        column_name: "email",
        category: "Basic",
        data_type: "string",
        order: 2,
      },
      { column_name: "phone", data_type: "text", category: "Basic" },
      { column_name: "website", data_type: "text", category: "Basic" },
      {
        column_name: "status",
        data_type: "string",
        field_type: "select",
        order: 3,
        data_source: { table: "customers", column: "status" },
      },
      { column_name: "vat_id", data_type: "text", category: "Business" },
      { column_name: "note", data_type: "text", category: "Basic" },
      { column_name: "street_address", data_type: "text", category: "Address" },
      { column_name: "address_line_2", data_type: "text", category: "Address" },
      { column_name: "city", data_type: "text", category: "Address" },
      {
        column_name: "state_province_region",
        data_type: "text",
        category: "Address",
      },
      { column_name: "postal_code", data_type: "text", category: "Address" },
      { column_name: "country", data_type: "text", category: "Address" },
      { column_name: "email", data_type: "text" },
      { column_name: "size", data_type: "text", category: "Business" },
      {
        column_name: "customer_type_id",
        data_type: "text",
        category: "Business",
      },
      { column_name: "phone", data_type: "text" },
      { column_name: "website", data_type: "text" },
      { column_name: "legal_form", data_type: "text", category: "Business" },
      { column_name: "owner", data_type: "text", category: "Business" },
      {
        column_name: "vat_return_frequency",
        data_type: "text",
        category: "Tax",
      },
      {
        column_name: "icp_return_frequency",
        data_type: "text",
        category: "Tax",
      },
      { column_name: "cash_management", data_type: "text", category: "Tax" },
      { column_name: "subject_to_vat", data_type: "boolean" },
      { column_name: "created_at", data_type: "timestamp" },
      { column_name: "name", data_type: "text" },
      { column_name: "main_contact_id", data_type: "uuid" },
      { column_name: "company_id", data_type: "uuid" },
      { column_name: "domain", data_type: "text" },
      {
        column_name: "administration",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "contract_start_date",
        data_type: "number",
        category: "Dates",
      },
      {
        column_name: "accounting_start_date",
        data_type: "number",
        category: "Dates",
      },
      { column_name: "closing_enabled", data_type: "boolean", category: "Tax" },
      { column_name: "self_booking", data_type: "boolean", category: "Tax" },
      { column_name: "global_company_id", data_type: "uuid" },
      { column_name: "customer_jurisdiction", data_type: "text" },
      { column_name: "account_manager", data_type: "text" },
      { column_name: "archive_hash", data_type: "text" },
      { column_name: "customer_jurisdiction_id", data_type: "uuid" },
      { column_name: "status", data_type: "text" },
      { column_name: "allow_self_accounting", data_type: "boolean" },
      { column_name: "companies", data_type: "number" },
      { column_name: "users", data_type: "number" },
      { column_name: "workflow", data_type: "number" },
      { column_name: "tickets", data_type: "number" },
      { column_name: "questions", data_type: "number" },
      { column_name: "is_overdue", data_type: "boolean" },
      { column_name: "data_provider", data_type: "text" },
      { column_name: "portal", data_type: "text" },
      { column_name: "data_provider_reference_id", data_type: "text" },
      { column_name: "signed_gdpr_document", data_type: "boolean" },
      { column_name: "archived_at", data_type: "number" },
      { column_name: "inactive_on", data_type: "number" },
      { column_name: "last_seen_at", data_type: "number" },
      { column_name: "bundle", data_type: "text" },
      { column_name: "accountant_id", data_type: "text" },
      { column_name: "accountant_name", data_type: "text" },
      { column_name: "accountant_is_partner_backoffice", data_type: "boolean" },
      { column_name: "currencies", data_type: "json" },
      { column_name: "default_currency", data_type: "text" },
      { column_name: "domain_wildcard_email", data_type: "text" },
      { column_name: "internal_email_support", data_type: "text" },
      { column_name: "internal_phone_number", data_type: "text" },
      { column_name: "internal_email_administration", data_type: "text" },
      { column_name: "supported_languages", data_type: "json" },
      { column_name: "is_partner_domain", data_type: "text" },
      { column_name: "subject_to_reverse_vat_charge", data_type: "boolean" },
      { column_name: "avatar", data_type: "text" },
      { column_name: "metadata", data_type: "json" },
      { column_name: "company_country_number", data_type: "text" },
      { column_name: "payment_method_invoice", data_type: "text" },
      { column_name: "person_number_ref", data_type: "text" },
      { column_name: "person_number", data_type: "text" },
      { column_name: "birth_day", data_type: "text" },
      { column_name: "salutations", data_type: "text" },
      { column_name: "payment_term_invoice", data_type: "text" },
      { column_name: "label", data_type: "text" },
      { column_name: "language_invoice_and_quote", data_type: "text" },
      { column_name: "last_name", data_type: "text" },
      { column_name: "street", data_type: "text" },
      { column_name: "first_name", data_type: "text" },
      { column_name: "description", data_type: "text" },
      { column_name: "reverse_charged", data_type: "boolean" },
      { column_name: "awaiting_deletion", data_type: "boolean" },
      { column_name: "data_residency", data_type: "text" },
      { column_name: "custom_tags", data_type: "json" },
      { column_name: "dpa_signed", data_type: "boolean" },
      { column_name: "dpa_signed_url", data_type: "text" },
      { column_name: "dpa_signed_at", data_type: "number" },
      { column_name: "consent_marketing_communications", data_type: "boolean" },
      { column_name: "consent_marketing_data_provider", data_type: "text" },
      {
        column_name: "nsent_marketing_communications_given_at",
        data_type: "number",
      },
      {
        column_name: "consent_marketing_communications_preferences",
        data_type: "text",
      },
      { column_name: "lead_source", data_type: "text" },
      { column_name: "group_structure", data_type: "json" },
      { column_name: "onboarding_approved", data_type: "boolean" },
      { column_name: "onboarded_by_user", data_type: "text" },
      { column_name: "onboarding_aproval_conditions", data_type: "text" },
      { column_name: "onboarding_aproval_findings", data_type: "text" },
      { column_name: "is_oss", s: "boolean" },
      { column_name: "is_ioss", data_type: "boolean" },
      { column_name: "is_article23", data_type: "boolean" },
      {
        column_name: "kyc_status",
        data_type: "text",
        field_type: "select",
        data_source: "",
      },
      { column_name: "payroll_withholding_number", data_type: "text" },
      { column_name: "risk_rating", data_type: "text" },
      { column_name: "pep_sanction_checked_at", data_type: "number" },
      { column_name: "is_pep_sanction", data_type: "boolean" },
      { column_name: "credit_limit", data_type: "number" },
      { column_name: "credit_debit_notes", data_type: "text" },
      { column_name: "credit_debit_arrangements", data_type: "text" },
      { column_name: "credit_hold_flags", data_type: "text" },
      { column_name: "customer_success_manager", data_type: "text" },
      { column_name: "store_user_ids", data_type: "text" },
      { column_name: "adverse_media_check_flags", data_type: "text" },
      { column_name: "adverse_media_checked_at", data_type: "number" },
      { column_name: "adverse_media_data_provider", data_type: "text" },
      { column_name: "invoicing_entity_legal_name", data_type: "text" },
      {
        column_name: "has_ultimate_beneficial_owner_statement",
        data_type: "boolean",
      },
      { column_name: "has_identity_card", data_type: "boolean" },
      { column_name: "has_business_registry_extract", data_type: "boolean" },
      { column_name: "has_power_of_attorney", data_type: "boolean" },
      { column_name: "has_source_of_wealth", data_type: "boolean" },
      { column_name: "has_source_of_funds", data_type: "boolean" },
      { column_name: "has_store_status", data_type: "boolean" },
      { column_name: "timezone", data_type: "text", category: "Basic" },
      { column_name: "language", data_type: "text", category: "Basic" },
      {
        column_name: "sla_agreed_response",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "sla_reporting_format_cadence",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "primary_ledger",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "primary_ledger_tenant_id",
        data_type: "text",
        category: "Business",
      },
    ] as ResourceFieldSpec[]),
  },
  files: {
    table: "files",
    idColumn: "file_id",
    enableSearch: true,
    searchBy: "filename",
    columns: [
      {
        column_name: "filename",
        header_label: "File name",
      },
      {
        column_name: "uploaded_at",
      },
      {
        column_name: "file_id",
      },
      {
        column_name: "upload_source",
      },
      {
        column_name: "file_url",
      },
      {
        column_name: "aurora_processed",
      },
      {
        column_name: "aurora_should_process",
      },
      {
        column_name: "aurora_errored",
      },
      {
        column_name: "aurora_error",
      },
    ],
  },
  jortt_invoices: {
    table: "jortt_invoices",
    idColumn: "jortt_invoice_id",
    enableSearch: false,
    searchBy:
      "mail_data_to, invoice_description, invoice_number, invoice_total, invoice_date",
    columns: [
      {
        column_name: "amount_side",
      },
      {
        column_name: "view_status",
        cell_value_mask_label: "{{status}}",
      },
      {
        column_name: "invoice_total",
      },
      {
        column_name: "invoice_total_incl_vat",
      },
      {
        column_name: "invoice_number",
      },
      {
        column_name: "invoice_description",
        maxWidth: 250,
        widthFit: true,
      },
      {
        column_name: "mail_data_to",
        cell_value_mask_label: "{{email_customer}}",
      },
      {
        column_name: "invoice_date",
      },
      {
        column_name: "invoice_due_date",
      },
      {
        column_name: "bookable_id",
        href: "/v2/bookings/{{bookable_id}}",
      },
      {
        column_name: "payment_term",
      },
      {
        column_name: "credited_invoice_id",
        cell_value_mask_label: "{{invoice_number}}",
      },
      {
        column_name: "last_reminded_at",
        label: "Last reminded at",
      },
      {
        column_name: "number_of_reminders_sent",
        label: "Reminders sent",
      },
      {
        column_name: "creditor_address_city",
        label: "City",
      },
      {
        column_name: "creditor_address_country_code",
        label: "Country",
      },
      {
        column_name: "customer_record",
        label: "Customer",
      },
    ],
  },
  documents_v2: {
    table: "documents_v2",
    idColumn: "document_id",
    enableSearch: true,
  },
  resource_forms: {
    table: "resource_forms",
    idColumn: "resource_form_id",
    disableCompanyFilter: true,
    enableSearch: true,
    searchBy: "entity,slug,version,tags",
    columns: [
      { column_name: "entity" },
      { column_name: "slug" },
      { column_name: "version" },
      { column_name: "experimental" },
      { column_name: "is_active" },
      { column_name: "updated_at" },
    ],
  },
  reconciliations_config: {
    table: "reconciliations_config",
    idColumn: "reconciliation_config_id",
    disableCompanyFilter: true,
  },
  quotes: {
    table: "quotes",
    idColumn: "quote_id",
    companyIdColumn: "author_company_id",
    enableSearch: true,
    searchBy: "quote_nr,recipient_company,status",
    enableNewResourceCreation: true,
    newResourceButtonText: "New quote",
    newResourceOnClick: async (ctx) => {
      const {
        user,
        clearState,
        setQuote,
        setLineItems,
        setLoading,
        setError,
        router,
      } = ctx;
      const { handleCreateQuote } = await import(
        "@/packages/invoicing/handlers/create-quote"
      );
      const { initQuote } = await import("@/lib/actions/quote");
      return handleCreateQuote({
        user,
        clearState,
        setQuote,
        setLineItems,
        setLoading,
        setError,
        router,
        initQuoteFn: initQuote,
      });
    },
    drilldownRoutePrefix: "/quotes",
    columns: [
      {
        column_name: "quote_nr",
      },
      {
        column_name: "amount",
      },
      {
        column_name: "currency",
      },
      {
        column_name: "customer",
      },
      {
        column_name: "signer_name",
      },
      {
        column_name: "signed_date",
      },
      {
        column_name: "amount_paid",
      },
      {
        column_name: "amount_remaining",
      },
      {
        column_name: "paid_at",
      },
      {
        column_name: "status",
      },
      {
        column_name: "recipient_company",
      },
      {
        column_name: "recipient_name",
      },
      {
        column_name: "recipient_email",
      },
      {
        column_name: "recipient_first_name",
      },
      {
        column_name: "recipient_last_name",
      },
      {
        column_name: "recipient_country",
      },
      {
        column_name: "contact",
      },
      {
        column_name: "paid",
      },
      {
        column_name: "author_email",
      },
      {
        column_name: "subscription",
      },
      {
        column_name: "subscription_id",
      },
      {
        column_name: "reverse_charged",
      },
      {
        column_name: "issue_date",
      },
      {
        column_name: "subtotal",
      },
      {
        column_name: "tax_amount",
      },
      {
        column_name: "total",
      },
      {
        column_name: "tax_rate",
      },
      {
        column_name: "quote_nr",
      },
    ],
  },
  invoices: {
    table: "invoices",
    idColumn: "invoice_id",
    companyIdColumn: "author_company_id",
    enableSearch: true,
    searchBy: "invoice_nr,recipient_company,status, ",
    enableNewResourceCreation: true,
    newResourceButtonText: "New invoice",
    newResourceOnClick: async (ctx) => {
      const {
        user,
        clearState,
        setInvoice,
        setLineItems,
        setLoading,
        setError,
        router,
      } = ctx;
      const { handleCreateInvoice } = await import(
        "@/packages/invoicing/handlers/create-invoice"
      );
      const { initInvoice } = await import("@/lib/actions/invoice");
      return handleCreateInvoice({
        user,
        clearState,
        setInvoice,
        setLineItems,
        setLoading,
        setError,
        router,
        initInvoiceFn: initInvoice,
      });
    },
    drilldownRoutePrefix: "/invoices",
    columns: [
      {
        column_name: "total",
        maxWidth: 100,
      },
      {
        column_name: "status",
        maxWidth: 100,
      },
      {
        column_name: "invoice_nr",
        header_label: "Invoice number",
        widthFit: true,
        formatter: (value: any) =>
          typeof value === "string" ? value.toUpperCase() : value,
      },
      {
        column_name: "customer",
        href: "/customers/{{customer}}",
        cell_value_mask_label: "{{recipient_company}}",
        header_label: "Customer",
        maxWidth: 100,
      },
      {
        column_name: "currency",
        hidden: true,
      },
      {
        column_name: "due_date",
      },
      {
        column_name: "invoice_id",
        cell_value_mask_label: "{{invoice_nr}}",
        order: 3,
      },
      {
        column_name: "issue_date",
      },
      {
        column_name: "recipient_company",
        hidden: true,
      },
    ],
  },

  booking: {
    table: "v_booking_staged",
    idColumn: "bookable_hash",
    companyIdColumn: "company_id",
    enableSearch: true,
    searchBy: "description,transaction_status,booking_status",
    page_label: "Bookings staged",
    drilldownRoutePrefix: "/v2/booking",
    columns: [
      {
        column_name: "booking_status",
      },
      {
        column_name: "amount",
      },
      {
        column_name: "currency",
      },
      {
        column_name: "description",
      },
      {
        column_name: "transaction_status",
      },
      {
        column_name: "transaction_id",
        href: "/v2/transactions/{{transaction_id}}",
      },
      {
        column_name: "reconciliation_id",
        href: "/reconciliations/{{reconciliation_id}}",
      },
      {
        column_name: "document_id",
        href: "/documents/{{document_id}}",
      },
      {
        column_name: "bookable_hash",
        href: "/v2/booking/{{bookable_hash}}",
      },
    ],
  },
  stargate_mollie_webhook_events: {
    table: "stargate_mollie_webhook_events",
    idColumn: "stargate_mollie_webhook_event_id",
    disableCompanyFilter: true,
  },
  mollie_payments: {
    table: "mollie_payments",
    idColumn: "mollie_payment_id",
    disableCompanyFilter: true,
  },
  ibans: {
    table: "ibans",
    idColumn: "iban_id",
    disableCompanyFilter: true,
  },
  income_types: {
    table: "income_types",
    idColumn: "income_type_id",
    disableCompanyFilter: true,
  },
  incoming_emails: {
    table: "incoming_emails",
    idColumn: "incoming_email_id",
    disableCompanyFilter: true,
  },
  integration_registry: {
    table: "integration_registry",
    idColumn: "integration_type_id",
    disableCompanyFilter: true,
  },
  integrations: {
    table: "integrations",
    idColumn: "integration_type_id",
  },
  merchants: {
    table: "merchants",
    idColumn: "merchant_id",
    disableCompanyFilter: true,
  },
  vat_quarterly_declaration: {
    table: "vat_quarterly_declaration",
    idColumn: "aggregate_id",
  },
  aurora_line_items: {
    table: "aurora_line_items",
    idColumn: "line_item_hash",
    disableCompanyFilter: true,
  },
  sf_formations_payment_links: {
    table: "sf_formations_payment_links",
    disableCompanyFilter: true,
    idColumn: "sf_formations_payment_link_id",
  },
  sf_formation_tickets: {
    table: "sf_formation_tickets",
    disableCompanyFilter: true,
    idColumn: "sf_formation_ticket_id",
  },
  cases: {
    table: "v_cases",
    idColumn: "ticket_id",
    page_label: "Cases",
    sidebar_route: "/sf-formations",
    companyIdColumn: "company_id",
    enableSearch: true,
    searchBy: "title,status,ticket_id,description,ticket_number",
    drilldownRoutePrefix: "/cases",
    customComponent: (() => {
      try {
        const Comp = require("@/features/formations/CaseListCustom").default;
        return Comp;
      } catch {
        return null;
      }
    })(),
    drilldownCustomComponent: (() => {
      try {
        const Comp =
          require("@/features/drilldown/EntityDrilldownCustom").default;
        return Comp;
      } catch {
        return null;
      }
    })(),
    chat: {
      table: "customer_messages",
      foreignKeyColumn: "message_id",
      messageColumn: "message",
      authorUserIdColumn: "author_user_id",
    },
    columns: [
      { column_name: "status", order: 1, maxWidth: 80 },
      { column_name: "priority", order: 2, maxWidth: 80 },
      { column_name: "title", order: 3, maxWidth: 180 },
      { column_name: "assignees", maxWidth: 80, order: 4 },
      { column_name: "created_at" },
      { column_name: "close_reason" },
      { column_name: "scope" },
      { column_name: "bucket" },
      { column_name: "company_id", hidden: true },
    ],
  },
};

"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { AddressCountrySelect } from "@/components/layouts/ponto-integration/components/AddressCountrySelect";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserStore } from "@/lib/stores";
import { FileUploadZone } from "@/packages/ui-patterns/src/FileUpload";
import { RadioGroupButton } from "@/packages/ui-patterns/src/RadioGroupButton";
import { PhoneNumberInput } from "@/ui-patterns";
import type { FormField as FormFieldType } from "./types";

interface FormFieldProps {
  field: FormFieldType;
  value: any;
  onChange: (value: any) => void;
  formData?: Record<string, any>;
  shouldShowConditionalNote?: boolean;
  error?: string;
}

export function FormField({
  field,
  value,
  onChange,
  formData,
  shouldShowConditionalNote,
  error,
}: FormFieldProps) {
  const isMobile = useIsMobile();
  const { user } = useUserStore();
  const [tableRows, setTableRows] = useState<Record<string, string>[]>(
    value || [{}],
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    if (value) return new Date(value);
    return new Date(2000, 0);
  });

  const [countryDisplay, setCountryDisplay] = useState<string>(() => {
    if (typeof value === "string") {
      if (value === "USA") return "United States";
      if (value === "Other") return "";
      return value;
    }
    return "";
  });

  // quick helper to flag invalid styles
  const invalidCls = error ? "border-red-500 focus-visible:ring-red-500" : "";

  const handleTableChange = (
    rowIndex: number,
    column: string,
    cellValue: string,
  ) => {
    const newRows = [...tableRows];
    newRows[rowIndex] = { ...newRows[rowIndex], [column]: cellValue };
    setTableRows(newRows);
    onChange(newRows);
  };

  const addTableRow = () => {
    const newRows = [...tableRows, {}];
    setTableRows(newRows);
    onChange(newRows);
  };

  const removeTableRow = (index: number) => {
    const newRows = tableRows.filter((_, i) => i !== index);
    setTableRows(newRows);
    onChange(newRows);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    const endYear = currentYear - 18;
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  // ADD: use wider year range for FY and others, keep 100..18 for dob
  const generateYearOptionsFor = (k: string) => {
    const currentYear = new Date().getFullYear();
    if (k === "dob") {
      const startYear = currentYear - 100;
      const endYear = currentYear - 18;
      const years: number[] = [];
      for (let y = endYear; y >= startYear; y--) years.push(y);
      return years;
    }
    const startYear = 1900;
    const endYear = currentYear + 50;
    const years: number[] = [];
    for (let y = endYear; y >= startYear; y--) years.push(y);
    return years;
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(calendarMonth);
    newDate.setFullYear(year);
    setCalendarMonth(newDate);
  };

  const resolveFromDate = (): Date | undefined => {
    const raw = (field as any)?.fromDate as string | undefined;
    if (!raw) return undefined;
    if (raw === "today") return new Date();
    const rel = /^today-(\d+)([dwmy])$/i.exec(raw);
    if (rel) {
      const amount = Number.parseInt(rel[1], 10);
      const unit = rel[2].toLowerCase();
      const d = new Date();
      if (unit === "d") d.setDate(d.getDate() - amount);
      else if (unit === "w") d.setDate(d.getDate() - amount * 7);
      else if (unit === "m") d.setMonth(d.getMonth() - amount);
      else if (unit === "y") d.setFullYear(d.getFullYear() - amount);
      return d;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  // dynamic lower bound for dependent dates
  const getDynamicFromDate = (): Date | undefined => {
    if (field.key === "passport_expiry" && formData?.passport_issue_date) {
      const d = new Date(formData.passport_issue_date);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    if (field.key === "fy_end" && formData?.fy_start) {
      const d = new Date(formData.fy_start);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return resolveFromDate();
  };

  const renderField = () => {
    const isGenericCountryField =
      typeof field?.key === "string" &&
      (/country/i.test(field.key) || field.key === "nationality") &&
      (!Array.isArray(field?.options) || field.options.length === 0);

    if (isGenericCountryField) {
      return (
        <AddressCountrySelect
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          width_full={true}
        />
      );
    }

    const isUSAOtherMapping =
      Array.isArray(field?.options) &&
      field.options.length === 2 &&
      field.options.includes("USA") &&
      field.options.includes("Other") &&
      (/country/i.test(field.key) || field.key === "nationality");

    if (isUSAOtherMapping) {
      return (
        <AddressCountrySelect
          width_full={true}
          value={countryDisplay}
          onChange={(selected: string) => {
            setCountryDisplay(selected);
            const norm = selected.toLowerCase();
            const isUS =
              norm.includes("united states") || norm === "us" || norm === "usa";
            onChange(isUS ? "USA" : "Other");
          }}
        />
      );
    }

    switch (field.type) {
      case "country_code":
        return (
          <AddressCountrySelect
            width_full={true}
            value={countryDisplay}
            onChange={(selected: string) => {
              setCountryDisplay(selected);
              const norm = selected.toLowerCase();
              const isUS =
                norm.includes("united states") ||
                norm === "us" ||
                norm === "usa";
              onChange(isUS ? "USA" : "Other");
            }}
          />
        );
      case "tel":
        return (
          <PhoneNumberInput
            id={field.key}
            label={field.label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "text":
      case "email":
        return (
          <Input
            type={field.type}
            id={field.key}
            label={field.label}
            defaultValue={field?.defaultValue}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            variant="outline_shadow"
            className={`w-full ${invalidCls}`}
            aria-invalid={!!error}
          />
        );
      case "number":
        return (
          <NumberField
            id={field.key}
            label={field.label}
            value={value}
            defaultValue={0}
            min={(field as any)?.min as number | undefined}
            max={(field as any)?.max as number | undefined}
            step={((field as any)?.step_size as number | undefined) ?? 1}
            onValueChange={(_: any, v: any) => {
              onChange(v);
            }}
            className={invalidCls}
            aria-invalid={!!error}
          />
        );
      case "date":
        // ADD: enable year dropdown for dob and FY, but with different ranges
        const useYearDropdown =
          field.key === "dob" ||
          field.key === "fy_start" ||
          field.key === "fy_end" ||
          field.key === "passport_issue_date" ||
          field.key === "passport_expiry";

        if (isMobile && useYearDropdown) {
          return (
            <Input
              type="date"
              id={field.key}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              min={getDynamicFromDate()?.toISOString().slice(0, 10)}
              className={invalidCls}
              aria-invalid={!!error}
            />
          );
        }
        return (
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start rounded-sm bg-transparent text-left font-normal ${invalidCls}`}
                aria-invalid={!!error}
              >
                {value ? format(new Date(value), "PPP") : ""}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {useYearDropdown && (
                <div className="flex items-center justify-between border-b p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleYearSelect(calendarMonth.getFullYear() - 10)
                    }
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Select
                    value={calendarMonth.getFullYear().toString()}
                    onValueChange={(year: string) =>
                      handleYearSelect(Number.parseInt(year))
                    }
                  >
                    <SelectTrigger className="h-7 w-20 text-sm">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {generateYearOptionsFor(field.key).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleYearSelect(calendarMonth.getFullYear() + 10)
                    }
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <CalendarComponent
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  onChange(date ? format(date, "yyyy-MM-dd") : "");
                  setIsCalendarOpen(false);
                }}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                initialFocus
                fromDate={getDynamicFromDate()}
              />
            </PopoverContent>
          </Popover>
        );
      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`rounded-sm ${invalidCls}`}
            aria-invalid={!!error}
          />
        );
      case "select":
        return (
          <Select
            value={value || (field as any)?.defaultValue || ""}
            onValueChange={onChange}
          >
            <SelectTrigger
              className={`rounded-sm ${invalidCls}`}
              aria-invalid={!!error}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "radio":
        // floris; i do not like this
        if (field.key === "contract_package") {
          const items = (field.options || []).map((opt: string) => {
            const canonical = opt.toLowerCase().includes("management")
              ? "Management and holding"
              : opt.toLowerCase().includes("online")
                ? "Online entrepreneur"
                : opt.toLowerCase().includes("complete")
                  ? opt.toLowerCase().includes("business")
                    ? "Business complete"
                    : "Business complete"
                  : opt;
            return {
              value: canonical,
              label: opt,
            } as any;
          });

          return (
            <RadioGroupButton
              items={items}
              legend={field.label}
              value={value || ""}
              onValueChange={onChange}
            />
          );
        }
        return (
          <RadioGroup value={value || ""} onValueChange={onChange}>
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.key}-${option}`} />
                <Label
                  htmlFor={`${field.key}-${option}`}
                  className="text-primary"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.key}
              checked={value === true || value === "Yes"}
              onCheckedChange={(checked) => onChange(checked)}
              aria-invalid={!!error}
            />
            <Label htmlFor={field.key} className="text-primary">
              {value === true || value === "Yes" ? "Yes" : "No"}
            </Label>
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.key}-${option}`}
                  checked={value?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = value || [];
                    if (checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(
                        currentValues.filter((v: string) => v !== option),
                      );
                    }
                  }}
                  aria-invalid={!!error}
                />
                <Label
                  htmlFor={`${field.key}-${option}`}
                  className="text-primary"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      case "file":
        return (
          <Input
            type="file"
            id={field.key}
            label={field.label}
            onChange={(e) => onChange(e.target.files?.[0])}
            className={`rounded-sm ${invalidCls}`}
            aria-invalid={!!error}
          />
        );
      case "file_explorer": {
        const email = String(
          (formData as any)?.email ||
            (formData as any)?.contact_email ||
            (formData as any)?.author_email ||
            "",
        ).trim();
        const entity = String((formData as any)?.entity || "").trim();
        const safeEmail = email.toLowerCase();
        const safeEntity = entity.replace(/\s+/g, "_").toLowerCase();
        const dir =
          safeEmail && safeEntity
            ? `formations/${safeEmail}/${safeEntity}/file`
            : undefined;
        return (
          <FileUploadZone
            organizationId={String(user?.organization_id || "")}
            projectId={String(user?.company_id || "")}
            dir={dir}
            onUploadedAction={(uploaded) => {
              try {
                onChange(uploaded?.[0]?.url || "");
              } catch {}
            }}
          />
        );
      }

      case "table":
        return (
          <div
            className={`space-y-4 ${error ? "rounded-sm p-1 ring-1 ring-red-500" : ""}`}
          >
            {tableRows.map((row, rowIndex) => (
              <Card key={rowIndex} className="rounded-sm border-0 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {field.columns?.map((column) => (
                    <div key={column}>
                      <Input
                        id={`${field.key}-${rowIndex}-${column}`}
                        label={column}
                        value={row[column] || ""}
                        onChange={(e) =>
                          handleTableChange(rowIndex, column, e.target.value)
                        }
                        className="rounded-sm"
                      />
                    </div>
                  ))}
                </div>
                {tableRows.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTableRow(rowIndex)}
                    className="mt-2 rounded-sm border-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addTableRow}
              className="rounded-sm border-0 bg-transparent"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add row
            </Button>
          </div>
        );

      case "note":
        return (
          <Card className="rounded-sm border-0 bg-foreground p-4">
            <p className="text-secondary-foreground text-sm leading-relaxed">
              {field.content}
            </p>
          </Card>
        );

      case "calculated":
        return (
          <Input
            type="number"
            id={field.key}
            label={field.label}
            value={value || ""}
            readOnly
            className="text-secondary-foreground rounded-sm bg-foreground"
          />
        );

      case "conditional_note":
        if (!shouldShowConditionalNote) return null;
        return (
          <Card className="rounded-sm border-0 bg-foreground p-4">
            <p className="text-secondary-foreground text-sm leading-relaxed">
              {field.content}
            </p>
          </Card>
        );

      default:
        return null;
    }
  };

  const usesBuiltInLabel =
    ["text", "email", "tel", "number", "file", "calculated"].includes(
      field.type as string,
    ) ||
    (typeof field?.key === "string" &&
      (/country/i.test(field.key) || field.key === "nationality"));

  return (
    <div className="space-y-2">
      {!usesBuiltInLabel && (
        <Label className="font-medium text-primary">{field.label}</Label>
      )}
      {renderField()}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}



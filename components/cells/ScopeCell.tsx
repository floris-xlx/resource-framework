"use client";

import React, { FC, useMemo } from "react";
import { Flag } from "../../adapters/proxies";

type FormationInfo = {
  label: string;
  country: string;
};

const MAP: Record<string, FormationInfo> = {
  formation_nl_bv: { label: "Netherlands • BV", country: "NL" },
  formation_us_llc: { label: "United States • LLC", country: "US" },
  formation_us_corp: { label: "United States • Corp", country: "US" },
  formation_hk_pt_ltd: { label: "Hong Kong • Pvt Ltd", country: "HK" },
  formation_be_be: { label: "Belgium • BV", country: "BE" },
  formation_ue_ifzo: { label: "Dubai • IFZO", country: "AE" },
};

function infer(scope?: string | null): FormationInfo {
  if (!scope) return { label: "formation", country: "US" };
  const s = scope.toLowerCase();
  const direct = MAP[scope as keyof typeof MAP];
  if (direct) return direct;

  const m = s.match(/^formation_([a-z]{2})/);
  const cc = m?.[1];
  if (cc === "nl") return { label: "Netherlands BV • formation", country: "NL" };
  if (cc === "us") return { label: "united states • formation", country: "US" };
  if (cc === "hk") return { label: "hong kong • formation", country: "HK" };
  if (cc === "be") return { label: "belgium • formation", country: "BE" };
  if (cc === "ue") return { label: "uae • formation", country: "AE" };
  return { label: "formation", country: "US" };
}

export const ScopeCell: FC<{ scope?: string | null }> = ({ scope }) => {
  const info = useMemo(() => infer(scope), [scope]);
  return (
    <div className="inline-flex items-center gap-2">
      <Flag country={info.country} size={18} />
      <span className="text-sm font-medium text-primary">{info.label}</span>
    </div>
  );
};

export default ScopeCell;

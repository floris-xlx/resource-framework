"use client";

import React, { FC } from "react";

type Assignee = {
  email?: string;
  avatar?: string;
  user_id?: string;
  username?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
};

export const AssigneesCell: FC<{ assignees?: Assignee[] }> = ({
  assignees,
}) => {
  const list = Array.isArray(assignees)
    ? assignees.filter(Boolean).slice()
    : [];
  if (!list.length) return null;

  const visible = list.slice(0, 2);
  const overflow = list.slice(2);

  return (
    <div className="flex items-center gap-2">
      {visible.map((a, idx) => {
        const key = (a.user_id || a.email || a.username || String(idx)) + "_assignee";
        const label = a.display_name || a.username || a.email || "user";
        return (
          <div
            key={key}
            className="flex h-7 min-w-7 items-center justify-center rounded-full bg-foreground px-2 text-xs text-secondary"
            title={label}
          >
            {String(label).slice(0, 2).toUpperCase()}
          </div>
        );
      })}
      {overflow.length > 0 && (
        <div
          className="flex h-7 min-w-7 items-center justify-center rounded-sm bg-foreground px-1.5 text-xs text-secondary"
          title={overflow.map((a) => a.display_name || a.username || a.email).join(", ")}
        >
          +{overflow.length}
        </div>
      )}
    </div>
  );
};

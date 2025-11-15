import { describe, it, expect } from "vitest";
import { defineColumns } from "../constructors/define-columns";
import type { ResourceFieldSpec } from "../resource-types";

describe("constructors/define-columns", () => {
  it("maps field_type select/boolean/text into editable.type", () => {
    const specs: ResourceFieldSpec[] = [
      { column_name: "status", field_type: "select" },
      { column_name: "verified", field_type: "boolean" },
      { column_name: "notes", field_type: "text" }
    ];
    const built = defineColumns(specs);
    const byName = Object.fromEntries(built.map((b) => [b.column_name, b]));
    expect(byName.status.editable?.type).toBe("select");
    expect(byName.verified.editable?.type).toBe("boolean");
    expect(byName.notes.editable?.type).toBe("text");
  });

  it("deduplicates by column_name keeping first occurrence", () => {
    const specs: ResourceFieldSpec[] = [
      { column_name: "status", field_type: "select" },
      { column_name: "status", field_type: "boolean" }
    ];
    const built = defineColumns(specs);
    expect(built.length).toBe(1);
    expect(built[0].column_name).toBe("status");
    expect(built[0].editable?.type).toBe("select");
  });
});



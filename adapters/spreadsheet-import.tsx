import Papa from "papaparse";
import { dataApiInsertMany, withRetry } from "./execute-data-api";

type ColumnMeta = {
  name: string;
  data_type?: string;
  format?: string;
  is_nullable?: boolean;
};

const CHUNK_SIZE = 1024 * 1024;

export const insertRowsViaSpreadsheet = async (opts: {
  file: File;
  tableName: string;
  schema?: string;
  columns: ColumnMeta[];
  selectedHeaders: string[];
  headers: Record<string, string>;
  onProgressUpdate: (progressPct: number) => void;
}): Promise<{ error?: unknown }> => {
  const {
    file,
    tableName,
    schema = "public",
    columns,
    selectedHeaders,
    headers,
    onProgressUpdate,
  } = opts;

  let chunkNumber = 0;
  let insertError: any = undefined;
  const t1: any = new Date();

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      // dynamicTyping has to be disabled so that "00001" doesn't get parsed as 1.
      dynamicTyping: false,
      skipEmptyLines: true,
      chunkSize: CHUNK_SIZE,
      quoteChar: file.type === "text/tab-separated-values" ? "" : '"',
      chunk: async (results: any, parser: any) => {
        parser.pause();
        try {
          const formattedData = formatRowsForInsert({
            rows: results.data,
            headers: selectedHeaders,
            columns,
          });
          if (formattedData.length > 0) {
            await withRetry(() =>
              dataApiInsertMany({
                table: tableName,
                rows: formattedData,
                schema,
                headers,
              }),
            );
          }
        } catch (error) {
          console.warn(error);
          insertError = error;
          parser.abort();
        }
        chunkNumber += 1;
        const progress = (chunkNumber * CHUNK_SIZE) / file.size;
        const progressPercentage = progress > 1 ? 100 : progress * 100;
        onProgressUpdate(progressPercentage);
        parser.resume();
      },
      complete: () => {
        const t2: any = new Date();
        // eslint-disable-next-line no-console
        console.log(
          `Total time taken for importing spreadsheet: ${(t2 - t1) / 1000} seconds`,
        );
        resolve({ error: insertError });
      },
    });
  });
};

/**
 * Used in insertRowsViaSpreadsheet + insertTableRows
 */
export const formatRowsForInsert = ({
  rows,
  headers,
  columns = [],
}: {
  rows: any[];
  headers: string[];
  columns?: ColumnMeta[];
}) => {
  return rows.map((row: any) => {
    const formattedRow: any = {};
    headers.forEach((header) => {
      const column = columns?.find((c) => c.name === header);
      const originalValue = row[header];
      if ((column?.format ?? "").includes("json")) {
        formattedRow[header] = tryParseJson(originalValue);
      } else if ((column?.data_type ?? "") === "ARRAY") {
        if (
          typeof originalValue === "string" &&
          originalValue.startsWith("{") &&
          originalValue.endsWith("}")
        ) {
          const formattedPostgresArraytoJsonArray = `[${originalValue.slice(1, originalValue.length - 1)}]`;
          formattedRow[header] = tryParseJson(
            formattedPostgresArraytoJsonArray,
          );
        } else {
          formattedRow[header] = tryParseJson(originalValue);
        }
      } else if (originalValue === "") {
        formattedRow[header] = column?.is_nullable ? null : "";
      } else {
        formattedRow[header] = originalValue;
      }
    });
    return formattedRow;
  });
};

function tryParseJson(value: any) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}



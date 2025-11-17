import Papa from "papaparse";

export interface DatasetStats {
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  missingValues: Record<string, number>;
  summary: string;
}

export interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "datetime" | "unknown";
  uniqueCount: number;
  nullCount: number;
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
  };
  topValues?: Array<{ value: string; count: number }>;
}

export async function analyzeDataset(csvContent: string): Promise<DatasetStats> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as any[];
          const columnNames = results.meta.fields || [];

          const columnInfo: ColumnInfo[] = columnNames.map((colName) => {
            const values = data.map((row) => row[colName]).filter((v) => v != null);
            const nullCount = data.length - values.length;
            const uniqueValues = new Set(values);

            // Determine column type
            const numericValues = values.filter((v) => typeof v === "number");
            const isNumeric = numericValues.length > values.length * 0.8;

            const info: ColumnInfo = {
              name: colName,
              type: isNumeric ? "numeric" : "categorical",
              uniqueCount: uniqueValues.size,
              nullCount,
            };

            if (isNumeric && numericValues.length > 0) {
              const sorted = [...numericValues].sort((a, b) => a - b);
              const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
              const median = sorted[Math.floor(sorted.length / 2)];
              const variance =
                numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                numericValues.length;

              info.stats = {
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                mean,
                median,
                std: Math.sqrt(variance),
              };
            } else {
              // Get top values for categorical
              const valueCounts = new Map<string, number>();
              values.forEach((v) => {
                const key = String(v);
                valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
              });

              info.topValues = Array.from(valueCounts.entries())
                .map(([value, count]) => ({ value, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            }

            return info;
          });

          const missingValues = Object.fromEntries(
            columnInfo.map((col) => [col.name, col.nullCount])
          );

          const summary = generateSummary(data.length, columnInfo);

          resolve({
            rowCount: data.length,
            columnCount: columnNames.length,
            columns: columnInfo,
            missingValues,
            summary,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
}

function generateSummary(rowCount: number, columns: ColumnInfo[]): string {
  const numericCols = columns.filter((c) => c.type === "numeric").length;
  const categoricalCols = columns.filter((c) => c.type === "categorical").length;
  const totalMissing = columns.reduce((sum, col) => sum + col.nullCount, 0);

  return `Dataset contains ${rowCount} rows and ${columns.length} columns (${numericCols} numeric, ${categoricalCols} categorical). Total missing values: ${totalMissing}.`;
}

// Export with alternate name for backward compatibility
export { analyzeDataset as performEDA };

"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importTestScoresCsv, importTranscriptCsv, importRosterCsv } from "@/app/students/import/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ImportKind = "roster" | "test_scores" | "transcript";

const TEMPLATES: Record<ImportKind, { columns: string[]; description: string }> = {
  roster: {
    columns: ["first_name", "last_name", "grade_level", "enrollment_type", "date_of_birth", "gpa", "credits_earned"],
    description: "Bulk-add new students.",
  },
  test_scores: {
    columns: ["student_first_name", "student_last_name", "test_type", "subject", "score", "percentile", "test_date", "school_year"],
    description: "MAP, FAST, IXL, ACT, or SAT scores. test_type must be one of MAP, FAST, IXL, ACT, SAT.",
  },
  transcript: {
    columns: ["student_first_name", "student_last_name", "course_name", "subject_area", "credit_value", "grade", "school_year", "is_online", "is_dual_enrollment"],
    description: "Transcript / course history entries. subject_area should match a graduation requirement category (e.g. English, Math, Science).",
  },
};

export function ImportCSVTool() {
  const [kind, setKind] = useState<ImportKind>("roster");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows(result.data as Record<string, string>[]);
        setStatus(null);
      },
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setStatus(null);
    try {
      let result;
      if (kind === "roster") result = await importRosterCsv(rows);
      else if (kind === "test_scores") result = await importTestScoresCsv(rows);
      else result = await importTranscriptCsv(rows);

      setStatus(`Imported ${result.success} row(s). ${result.failed} failed.${result.errors.length ? " First error: " + result.errors[0] : ""}`);
      setRows([]);
      setFileName("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 bg-cream">
      <PageHeader title="Import CSV" subtitle="Bulk-add students, test scores, or transcript history from a spreadsheet." />
      <main className="p-8 max-w-4xl">
        <Card className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-semibold text-navy mb-1">What are you importing?</label>
            <select
              value={kind}
              onChange={(e) => { setKind(e.target.value as ImportKind); setRows([]); setStatus(null); }}
              className="border border-hairline rounded px-3 py-2 text-sm w-full max-w-sm"
            >
              <option value="roster">New Students (Roster)</option>
              <option value="test_scores">Test Scores (MAP / FAST / IXL / ACT / SAT)</option>
              <option value="transcript">Transcript / Course History</option>
            </select>
          </div>

          <div className="bg-cream border border-hairline rounded p-3 text-xs text-navy/70">
            <p className="font-semibold mb-1 text-navy">Expected columns:</p>
            <code className="block break-all">{TEMPLATES[kind].columns.join(", ")}</code>
            <p className="mt-2">{TEMPLATES[kind].description}</p>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-navy mb-1">CSV File</label>
            <input type="file" accept=".csv" onChange={handleFile} className="text-sm" />
            {fileName && <p className="text-xs text-navy/50 mt-1">{fileName} — {rows.length} row(s) parsed</p>}
          </div>

          {rows.length > 0 && (
            <div className="overflow-x-auto border border-hairline rounded">
              <table className="text-xs w-full">
                <thead className="bg-cream">
                  <tr>
                    {Object.keys(rows[0]).map((col) => (
                      <th key={col} className="px-2 py-1 text-left font-semibold text-navy border-b border-hairline">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-hairline/60">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && <p className="text-xs text-navy/40 px-2 py-1">...and {rows.length - 5} more row(s)</p>}
            </div>
          )}

          {status && <p className="text-sm text-navy">{status}</p>}

          <Button onClick={handleSubmit} disabled={rows.length === 0 || submitting}>
            {submitting ? "Importing..." : `Import ${rows.length} row(s)`}
          </Button>
        </Card>
      </main>
    </div>
  );
}

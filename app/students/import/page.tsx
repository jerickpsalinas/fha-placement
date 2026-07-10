"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importTestScoresCsv, importTranscriptCsv, importRosterCsv } from "@/app/students/import/actions";

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

export default function ImportPage() {
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
    <main className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-navy mb-6">Import CSV</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">What are you importing?</label>
          <select
            value={kind}
            onChange={(e) => { setKind(e.target.value as ImportKind); setRows([]); setStatus(null); }}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm"
          >
            <option value="roster">New Students (Roster)</option>
            <option value="test_scores">Test Scores (MAP / FAST / IXL / ACT / SAT)</option>
            <option value="transcript">Transcript / Course History</option>
          </select>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600">
          <p className="font-medium mb-1">Expected columns:</p>
          <code className="block break-all">{TEMPLATES[kind].columns.join(", ")}</code>
          <p className="mt-2">{TEMPLATES[kind].description}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CSV File</label>
          <input type="file" accept=".csv" onChange={handleFile} className="text-sm" />
          {fileName && <p className="text-xs text-gray-500 mt-1">{fileName} — {rows.length} row(s) parsed</p>}
        </div>

        {rows.length > 0 && (
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(rows[0]).map((col) => (
                    <th key={col} className="px-2 py-1 text-left font-medium border-b border-gray-200">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-2 py-1">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className="text-xs text-gray-400 px-2 py-1">...and {rows.length - 5} more row(s)</p>}
          </div>
        )}

        {status && <p className="text-sm">{status}</p>}

        <button
          onClick={handleSubmit}
          disabled={rows.length === 0 || submitting}
          className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-navy/90 disabled:opacity-50"
        >
          {submitting ? "Importing..." : `Import ${rows.length} row(s)`}
        </button>
      </div>
    </main>
  );
}

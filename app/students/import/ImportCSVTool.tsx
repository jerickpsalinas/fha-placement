"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importTestScoresCsv, importTranscriptCsv, importRosterCsv } from "@/app/students/import/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ImportKind = "roster" | "test_scores" | "transcript";

const TEMPLATES: Record<ImportKind, { columns: { name: string; hint: string }[]; description: string; example: Record<string, string> }> = {
  roster: {
    description: "Bulk-add new students. One row per student.",
    columns: [
      { name: "first_name", hint: "Student's first name" },
      { name: "last_name", hint: "Student's last name" },
      { name: "grade_level", hint: "K, 1, 2, ... 12" },
      { name: "enrollment_type", hint: "private_continuing or public_transfer" },
      { name: "date_of_birth", hint: "YYYY-MM-DD" },
      { name: "gpa", hint: "0.0 – 4.0 (leave blank if unknown)" },
      { name: "credits_earned", hint: "Number of credits earned so far" },
    ],
    example: {
      first_name: "Zelda", last_name: "Arriola", grade_level: "9",
      enrollment_type: "private_continuing", date_of_birth: "2011-05-06",
      gpa: "3.8", credits_earned: "6",
    },
  },
  test_scores: {
    description: "MAP, FAST, IXL, ACT, or SAT scores. One row per test result.",
    columns: [
      { name: "student_first_name", hint: "Must match an existing student" },
      { name: "student_last_name", hint: "Must match an existing student" },
      { name: "test_type", hint: "MAP, FAST, IXL, ACT, or SAT" },
      { name: "subject", hint: "e.g. Math, Reading" },
      { name: "score", hint: "Raw score (e.g. RIT score)" },
      { name: "percentile", hint: "0 – 99 (leave blank if unknown)" },
      { name: "test_date", hint: "YYYY-MM-DD" },
      { name: "school_year", hint: "e.g. 2026-2027" },
    ],
    example: {
      student_first_name: "Zelda", student_last_name: "Arriola", test_type: "MAP",
      subject: "Math", score: "197", percentile: "23", test_date: "2026-05-06",
      school_year: "2026-2027",
    },
  },
  transcript: {
    description: "Transcript / course history entries. One row per course.",
    columns: [
      { name: "student_first_name", hint: "Must match an existing student" },
      { name: "student_last_name", hint: "Must match an existing student" },
      { name: "course_name", hint: "e.g. Algebra 1" },
      { name: "subject_area", hint: "Must exactly match: English/Language Arts, Mathematics, Science, Social Studies, Physical Education, Fine Arts/Practical Arts/CTE, Financial Literacy, Electives, World Language, or God First/Bible" },
      { name: "credit_value", hint: "e.g. 1.0, 0.5" },
      { name: "grade", hint: "Letter grade earned, e.g. A, B+" },
      { name: "school_year", hint: "e.g. 2026-2027" },
      { name: "is_online", hint: "true or false" },
      { name: "is_dual_enrollment", hint: "true or false" },
    ],
    example: {
      student_first_name: "Zelda", student_last_name: "Arriola", course_name: "Algebra 1",
      subject_area: "Mathematics", credit_value: "1.0", grade: "B+",
      school_year: "2026-2027", is_online: "false", is_dual_enrollment: "false",
    },
  },
};

function downloadTemplate(kind: ImportKind) {
  const { columns, example } = TEMPLATES[kind];
  const headers = columns.map((c) => c.name);
  const csv = Papa.unparse({ fields: headers, data: [headers.map((h) => example[h] ?? "")] });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${kind}_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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
      transformHeader: (h) => h.replace(/^﻿/, "").trim(),
      complete: (result) => {
        const parsedRows = result.data as Record<string, string>[];
        const expected = TEMPLATES[kind].columns.map((c) => c.name);
        const found = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : [];
        const missing = expected.filter((col) => !found.includes(col));
        if (missing.length > 0) {
          setStatus(
            `CSV headers don't match the selected import type ("${kind}"). Missing column(s): ${missing.join(", ")}. Detected headers: ${found.join(", ") || "(none)"}. Did you mean to select a different import type above?`
          );
          setRows([]);
          setFileName("");
          return;
        }
        setRows(parsedRows);
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
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <label className="block text-[10px] font-semibold text-navy mb-1">What are you importing?</label>
              <select
                value={kind}
                onChange={(e) => { setKind(e.target.value as ImportKind); setRows([]); setStatus(null); }}
                className="border border-hairline rounded px-3 py-2 text-sm w-full"
              >
                <option value="roster">New Students (Roster)</option>
                <option value="test_scores">Test Scores (MAP / FAST / IXL / ACT / SAT)</option>
                <option value="transcript">Transcript / Course History</option>
              </select>
            </div>
            <Button type="button" onClick={() => downloadTemplate(kind)} className="shrink-0">
              Download template CSV
            </Button>
          </div>

          {kind !== "roster" && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
              <span className="font-semibold">Import order matters:</span> this import matches rows to <span className="font-semibold">existing</span> students by name — it does not create new students. If any of these students aren't in the system yet, import the <span className="font-semibold">New Students (Roster)</span> CSV first, then come back and import this one.
            </div>
          )}

          <div className="bg-cream border border-hairline rounded p-3">
            <p className="font-semibold mb-2 text-navy text-xs">Expected columns</p>
            <p className="text-xs text-navy/60 mb-3">{TEMPLATES[kind].description} Column names in your CSV's header row must match exactly (order doesn't matter).</p>
            <div className="space-y-1">
              {TEMPLATES[kind].columns.map((c) => (
                <div key={c.name} className="flex gap-2 text-xs">
                  <code className="bg-white border border-hairline rounded px-1.5 py-0.5 text-navy shrink-0">{c.name}</code>
                  <span className="text-navy/60">{c.hint}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-navy mb-1">CSV File</label>
            <div className="border-2 border-dashed border-hairline rounded-lg p-6 text-center">
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv-file-input" />
              <label htmlFor="csv-file-input" className="cursor-pointer">
                <div className="text-sm text-navy/60">
                  {fileName ? (
                    <span className="font-medium text-navy">{fileName} — {rows.length} row(s) parsed</span>
                  ) : (
                    <>Drop a CSV here or <span className="text-gold font-semibold underline">click to browse</span></>
                  )}
                </div>
              </label>
            </div>
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

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  extractTranscriptPdf,
  saveReviewedTranscriptRows,
} from "@/app/students/[id]/import-pdf/actions";
import { SUBJECT_AREAS, type ParsedTranscriptRow } from "@/lib/parsing/transcript";

export default function ImportPdfPage() {
  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedTranscriptRow[]>([]);
  const [rawPreview, setRawPreview] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus(null);
    setSaved(false);
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await extractTranscriptPdf(fd);
      if (result.error) {
        setStatus(result.error);
        setRows([]);
      } else {
        setRows(result.rows);
        setRawPreview(result.rawTextPreview);
        setStatus(
          result.rows.length === 0
            ? "No course rows detected. You can add rows manually below, or check the extracted text."
            : `Detected ${result.rows.length} candidate row(s). Review and correct before saving — highlighted rows need attention.`
        );
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  function updateRow(i: number, patch: Partial<ParsedTranscriptRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch, needsReview: false } : r)));
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      { course_name: "", subject_area: "", credit_value: 1.0, grade: "", school_year: "", is_online: false, is_dual_enrollment: false, needsReview: true },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const result = await saveReviewedTranscriptRows(studentId, rows);
      if (result.error) {
        setStatus(result.error);
      } else {
        setStatus(`Saved ${result.saved} transcript entr${result.saved === 1 ? "y" : "ies"}.`);
        setRows([]);
        setSaved(true);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Import Transcript from PDF</h1>
        <Link href={`/students/${studentId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to student
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900">
          The parser reads the PDF&apos;s text and makes its best guess at each course. It is not perfect —
          <span className="font-medium"> always review every row before saving.</span> Scanned/image-only PDFs
          can&apos;t be read (they need OCR, not yet supported).
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Transcript / Report Card PDF</label>
          <input type="file" accept="application/pdf,.pdf" onChange={handleFile} className="text-sm" disabled={extracting} />
          {fileName && <p className="text-xs text-gray-500 mt-1">{fileName}{extracting ? " — extracting…" : ""}</p>}
        </div>

        {status && <p className={`text-sm ${saved ? "text-green-700" : "text-gray-700"}`}>{status}</p>}

        {rows.length > 0 && (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="text-xs w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Course</th>
                    <th className="px-2 py-1.5 text-left font-medium">Subject Area</th>
                    <th className="px-2 py-1.5 text-left font-medium">Credits</th>
                    <th className="px-2 py-1.5 text-left font-medium">Grade</th>
                    <th className="px-2 py-1.5 text-left font-medium">School Year</th>
                    <th className="px-2 py-1.5 text-left font-medium">Online</th>
                    <th className="px-2 py-1.5 text-left font-medium">Dual</th>
                    <th className="px-2 py-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-t border-gray-100 ${r.needsReview ? "bg-amber-50" : ""}`}>
                      <td className="px-1 py-1">
                        <input value={r.course_name} onChange={(e) => updateRow(i, { course_name: e.target.value })}
                          className="w-44 border border-gray-200 rounded px-1.5 py-1" />
                      </td>
                      <td className="px-1 py-1">
                        <select value={r.subject_area} onChange={(e) => updateRow(i, { subject_area: e.target.value as ParsedTranscriptRow["subject_area"] })}
                          className={`w-52 border rounded px-1.5 py-1 ${r.subject_area ? "border-gray-200" : "border-amber-400"}`}>
                          <option value="">— select —</option>
                          {SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1">
                        <input type="number" step="0.25" value={r.credit_value} onChange={(e) => updateRow(i, { credit_value: Number(e.target.value) })}
                          className="w-16 border border-gray-200 rounded px-1.5 py-1" />
                      </td>
                      <td className="px-1 py-1">
                        <input value={r.grade} onChange={(e) => updateRow(i, { grade: e.target.value })}
                          className="w-14 border border-gray-200 rounded px-1.5 py-1" />
                      </td>
                      <td className="px-1 py-1">
                        <input value={r.school_year} placeholder="2024-2025" onChange={(e) => updateRow(i, { school_year: e.target.value })}
                          className={`w-24 border rounded px-1.5 py-1 ${r.school_year ? "border-gray-200" : "border-amber-400"}`} />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <input type="checkbox" checked={r.is_online} onChange={(e) => updateRow(i, { is_online: e.target.checked })} />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <input type="checkbox" checked={r.is_dual_enrollment} onChange={(e) => updateRow(i, { is_dual_enrollment: e.target.checked })} />
                      </td>
                      <td className="px-1 py-1">
                        <button onClick={() => removeRow(i)} className="text-red-500 hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={addRow} className="text-sm text-blue-600 hover:underline">+ Add row</button>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-navy/90 disabled:opacity-50">
              {saving ? "Saving…" : `Save ${rows.length} row(s) to transcript`}
            </button>
          </>
        )}

        {rawPreview && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">View extracted text (for troubleshooting)</summary>
            <pre className="mt-2 whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded p-3 max-h-64 overflow-y-auto">{rawPreview}</pre>
          </details>
        )}
      </div>
    </main>
  );
}

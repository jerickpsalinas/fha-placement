"use client";

import { useRef, useState, useTransition } from "react";
import { uploadSupportPlanDocument, getDocumentSignedUrl } from "./actions";

interface Props {
  planId: string;
  studentId: string;
  existingPath: string | null;
}

export function DocumentUpload({ planId, studentId, existingPath }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentPath, setCurrentPath] = useState(existingPath);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    const fd = new FormData();
    fd.append("planId", planId);
    fd.append("studentId", studentId);
    fd.append("file", file);

    startTransition(async () => {
      const result = await uploadSupportPlanDocument(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setCurrentPath(`${studentId}/${planId}.pdf`);
        setDownloadUrl(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  async function handleDownload() {
    if (!currentPath) return;
    setDownloadLoading(true);
    setError(null);
    const result = await getDocumentSignedUrl(currentPath);
    setDownloadLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setDownloadUrl(result.url);
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {currentPath ? (
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-500">Document on file</span>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadLoading}
            className="text-xs text-navy underline hover:text-navy/70 disabled:opacity-50"
          >
            {downloadLoading ? "Generating link…" : "Download PDF"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-2">No document uploaded yet.</p>
      )}

      <form onSubmit={handleUpload} className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-navy text-white px-3 py-1 rounded hover:bg-navy/90 disabled:opacity-50"
        >
          {pending ? "Uploading…" : currentPath ? "Replace PDF" : "Upload PDF"}
        </button>
      </form>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-1 text-xs text-green-700">Document uploaded successfully.</p>}
    </div>
  );
}

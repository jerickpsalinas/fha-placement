"use client";

/**
 * Triggers the browser's native print dialog, from which staff can choose
 * "Save as PDF". Using the browser's print pipeline keeps the export pixel-
 * accurate to the on-screen report and avoids shipping a heavyweight PDF
 * rendering dependency.
 */
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print bg-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-navy/90"
    >
      Print / Save as PDF
    </button>
  );
}

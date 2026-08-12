"use client";

export default function StaffAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-red-700 mb-2">Something went wrong managing staff</h1>
        <p className="text-sm text-red-600 mb-4 break-all">{error.message || "An unexpected error occurred."}</p>
        {error.digest && (
          <p className="text-xs text-red-400 mb-4">
            Give this digest to your developer to look up the server log: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

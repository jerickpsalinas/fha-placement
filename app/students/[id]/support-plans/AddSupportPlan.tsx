"use client";

import { useState, useTransition } from "react";
import { createSupportPlan } from "./actions";
import { DocumentUpload } from "./DocumentUpload";
import type { PlanType } from "@/types";

interface NewPlan {
  id: string;
  plan_type: PlanType;
  effective_date: string | null;
  review_date: string | null;
}

interface Props {
  studentId: string;
}

export function AddSupportPlan({ studentId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newPlans, setNewPlans] = useState<NewPlan[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createSupportPlan(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      const planType = fd.get("planType") as PlanType;
      const effectiveDate = (fd.get("effectiveDate") as string) || null;
      const reviewDate = (fd.get("reviewDate") as string) || null;
      setNewPlans((prev) => [
        ...prev,
        { id: result.id!, plan_type: planType, effective_date: effectiveDate, review_date: reviewDate },
      ]);
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <div className="mt-4">
      {/* Newly created plans rendered client-side (page revalidates on next full load) */}
      {newPlans.map((plan) => (
        <div key={plan.id} className="border border-gray-200 rounded p-4 mb-3">
          <p className="font-medium text-sm mb-2">
            {plan.plan_type} Plan
            {plan.effective_date ? ` — effective ${plan.effective_date}` : ""}
          </p>
          <p className="text-xs text-gray-400">No accommodations added yet.</p>
          <DocumentUpload planId={plan.id} studentId={studentId} existingPath={null} />
        </div>
      ))}

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="border border-gray-200 rounded p-4 space-y-3 bg-gray-50"
        >
          <input type="hidden" name="studentId" value={studentId} />

          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Plan Type <span className="text-red-500">*</span>
              </label>
              <select
                name="planType"
                required
                defaultValue=""
                className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
              >
                <option value="" disabled>Select…</option>
                <option value="IEP">IEP</option>
                <option value="504">504</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                name="effectiveDate"
                className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Review Date
              </label>
              <input
                type="date"
                name="reviewDate"
                className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="text-sm bg-navy text-white px-4 py-1.5 rounded hover:bg-navy/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save Plan"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="text-sm text-gray-500 px-4 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-navy border border-navy px-4 py-1.5 rounded hover:bg-navy/5 font-medium"
        >
          + Add IEP/504 Plan
        </button>
      )}
    </div>
  );
}

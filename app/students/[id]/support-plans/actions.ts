"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const BUCKET = "iep-504-documents";
const SIGNED_URL_EXPIRES = 60 * 60; // 1 hour

/** Upload a PDF and store its storage path on the support_plan row. */
export async function uploadSupportPlanDocument(
  formData: FormData
): Promise<{ error?: string }> {
  const staff = await getCurrentStaff();
  if (!["admin", "counselor"].includes(staff.role)) {
    return { error: "Only admins and counselors may upload documents." };
  }

  const planId = formData.get("planId") as string | null;
  const studentId = formData.get("studentId") as string | null;
  const file = formData.get("file") as File | null;

  if (!planId || !studentId || !file || file.size === 0) {
    return { error: "Missing required fields." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Only PDF files are accepted." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "File must be under 20 MB." };
  }

  const supabase = await createClient();

  // Deterministic path: one file per support plan, always overwritten on re-upload.
  const storagePath = `${studentId}/${planId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { error: dbError } = await supabase
    .from("support_plans")
    .update({ document_url: storagePath, updated_at: new Date().toISOString() })
    .eq("id", planId);

  if (dbError) {
    return { error: `DB update failed: ${dbError.message}` };
  }

  revalidatePath(`/students/${studentId}`);
  return {};
}

/** Generate a short-lived signed download URL for a stored document path. */
export async function getDocumentSignedUrl(
  storagePath: string
): Promise<{ url?: string; error?: string }> {
  const staff = await getCurrentStaff();
  if (!["admin", "counselor"].includes(staff.role)) {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "Could not generate download link." };
  }
  return { url: data.signedUrl };
}

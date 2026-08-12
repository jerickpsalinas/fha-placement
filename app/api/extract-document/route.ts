import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROMPTS: Record<string, string> = {
  transcript: 'You are reading a high school transcript. Extract all course data and return ONLY valid JSON — no markdown, no code fences. Schema: {"studentName":"","currentGrade":"","cumulativeGpa":null,"totalCreditsEarned":0,"hasOnlineCourse":false,"courses":[{"name":"","credits":0,"grade":"","category":"","year":""}]}. Categories must be one of: English/Language Arts, Mathematics, Science, Social Studies, Physical Education, Fine Arts/Practical Arts/CTE, Financial Literacy, Electives, World Language, God First/Bible, AP/Dual Enrollment, Other.',
  map: 'You are reading a MAP Growth score report. Extract all scores and return ONLY valid JSON — no markdown, no code fences. Schema: {"studentName":"","grade":"","testDate":"","testWindow":"","mathRit":null,"readingRit":null,"mathPercentile":null,"readingPercentile":null,"mathLevel":"On-Level","readingLevel":"On-Level","satProjection":"","actProjection":"","notes":""}. Math/Reading Level must be Intervention (below 25th percentile), On-Level (25th-75th), or Advanced (above 75th).',
  sat: 'You are reading an SAT score report. Extract all scores and return ONLY valid JSON — no markdown, no code fences. Schema: {"studentName":"","grade":"","testDate":"","mathScore":null,"ebrwScore":null,"totalScore":null,"mathPercentile":null,"ebrwPercentile":null,"notes":""}',
  act: 'You are reading an ACT score report. Extract all scores and return ONLY valid JSON — no markdown, no code fences. Schema: {"studentName":"","grade":"","testDate":"","composite":null,"english":null,"math":null,"reading":null,"science":null,"writing":null,"compositePercentile":null,"notes":""}',
  state: 'You are reading a Florida state assessment report (FAST, FSA, or similar). Extract all data and return ONLY valid JSON — no markdown, no code fences. Schema: {"studentName":"","grade":"","testDate":"","assessmentName":"","subject":"","achievementLevel":null,"scaleScore":null,"levelDescription":"","schoolYear":"","nextSteps":"","notes":""}',
  reportcard: 'You are reading a school report card. Extract all grades and information and return ONLY valid JSON — no markdown, no code fences. Schema: {"studentName":"","grade":"","school":"","year":"","subjects":[{"name":"","q1":"","q2":"","q3":"","q4":"","yearAvg":""}],"gpa":null,"attendance":"","teacherComments":"","promotionStatus":"Promoted","notes":""}',
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = formData.get("docType") as string;

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!PROMPTS[docType]) return NextResponse.json({ error: "Invalid document type" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const mediaType = file.type === "application/pdf" ? "application/pdf"
    : file.type === "image/png" ? "image/png"
    : "image/jpeg";

  const isImage = mediaType.startsWith("image/");

  const content = isImage
    ? [
        { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: base64 } },
        { type: "text" as const, text: PROMPTS[docType] },
      ]
    : [
        { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } },
        { type: "text" as const, text: PROMPTS[docType] },
      ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 502 });
  }

  const result = await response.json();
  const text = result.content?.[0]?.text ?? "";

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response as JSON", raw: text }, { status: 422 });
  }
}

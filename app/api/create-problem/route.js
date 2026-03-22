import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "@/lib/judge0";
import { currentUserRole, getCurrentUser } from "@/modules/auth/actions";

import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizeBatchSubmissionList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.submissions && Array.isArray(raw.submissions)) return raw.submissions;
  return [];
}

function extractTokensFromBatchResponse(submissionResults) {
  const list = normalizeBatchSubmissionList(submissionResults);
  return list.map((res) => res.token).filter(Boolean);
}

function isJudge0Configured() {
  return Boolean(
    process.env.JUDGE0_API_URL &&
      process.env.RAPIDAPI_KEY &&
      process.env.RAPIDAPI_HOST
  );
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await currentUserRole();
    if (role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testCases,
      codeSnippets,
      referenceSolutions,
    } = body;

    if (
      !title ||
      !description ||
      !difficulty ||
      examples === undefined ||
      examples === null ||
      !testCases ||
      !codeSnippets ||
      !referenceSolutions
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { error: "At least one test case is required" },
        { status: 400 }
      );
    }

    if (!referenceSolutions || typeof referenceSolutions !== "object") {
      return NextResponse.json(
        {
          error:
            "Reference solutions must be provided for all supported languages",
        },
        { status: 400 }
      );
    }

    const runJudge0 = isJudge0Configured();

    if (!runJudge0) {
      console.warn(
        "[create-problem] JUDGE0_API_URL, RAPIDAPI_KEY, RAPIDAPI_HOST not all set; skipping Judge0 validation."
      );
    } else {
      for (const [language, solutionCode] of Object.entries(
        referenceSolutions
      )) {
        const languageId = getJudge0LanguageId(language);

        if (!languageId) {
          return NextResponse.json(
            { error: `Unsupported language: ${language}` },
            { status: 400 }
          );
        }

        const submissions = testCases.map(({ input, output }) => ({
          source_code: solutionCode,
          language_id: languageId,
          stdin: input,
          expected_output: output,
        }));

        const submissionResults = await submitBatch(submissions);
        const tokens = extractTokensFromBatchResponse(submissionResults);

        if (tokens.length !== submissions.length) {
          return NextResponse.json(
            {
              error: `Judge0 batch response did not return expected tokens for ${language}`,
            },
            { status: 502 }
          );
        }

        const results = await pollBatchResults(tokens);

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          console.log(`Test case ${i + 1} details:`, {
            input: submissions[i].stdin,
            expectedOutput: submissions[i].expected_output,
            actualOutput: result.stdout,
            status: result.status,
            language: language,
            error: result.stderr || result.compile_output,
          });

          if (result.status.id !== 3) {
            return NextResponse.json(
              {
                error: `Validation failed for ${language}`,
                testCase: {
                  input: submissions[i].stdin,
                  expectedOutput: submissions[i].expected_output,
                  actualOutput: result.stdout,
                  error: result.stderr || result.compile_output,
                },
                details: result,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    const newProblem = await db.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testCases,
        codeSnippets,
        referenceSolution: referenceSolutions,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Problem created successfully",
        data: newProblem,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create problem error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create problem" },
      { status: 500 }
    );
  }
}

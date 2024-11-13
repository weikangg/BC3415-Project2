// app/api/sessions/[sessionId]/insights/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { OpenAI } from "openai";

// Initialize OpenAI API client
const openai = new OpenAI();

// Helper function to generate insights for the lecturer based on questions
async function getInsightsFromGpt(questions: string[]): Promise<string> {
  // Format the questions into a structured prompt
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful assistant generating insights for a lecturer based on student questions. Identify common themes, areas of confusion, and suggest future focus areas.",
    },
    {
      role: "user",
      content: `Provide insights based on these student questions:\n\n${questions.map(
        (q, i) => `${i + 1}. ${q}`
      ).join("\n")}`,
    },
  ];

  // Call the OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messages,
    max_tokens: 3000,
  });

  return response.choices[0]?.message?.content || "No insights generated.";
}

// GET /api/sessions/:sessionId/insights - Generate insights for lecturer
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    // Query Firestore to get all questions for the specific sessionId
    const questionsRef = collection(db, "questions");
    const q = query(questionsRef, where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(q);

    // Extract questions content from the documents
    const questions = querySnapshot.docs.map((doc) => doc.data().content as string);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this session." },
        { status: 404 }
      );
    }

    // Generate insights from ChatGPT based on the questions
    const insights = await getInsightsFromGpt(questions);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

// app/api/sessions/[sessionId]/questions/route.ts
import { NextResponse } from "next/server";
import { db, storage } from "../../../../../firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { QuestionSchema } from "../../../../../helpers/schemas";
import { OpenAI } from "openai";
import { Buffer } from "buffer";

// Initialize OpenAI API client
const openai = new OpenAI();
// Helper function to get GPT-4 response for text content
async function getGptTextResponse(questionText: string): Promise<string> {
  // Define the messages array to match the expected type
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a helpful teaching assistant who will provide guidance to the student but will not reveal the answer straight away.",
    },
    { role: "user", content: "Answer this question: " + questionText },
  ];

  // Call the OpenAI API with the correctly typed messages array
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    max_completion_tokens: 3000,
  });

  return response.choices[0]?.message?.content || "No response from GPT-4";
}

async function getGptImageResponse(
  base64Image: string,
  prompt: string = ""
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant who provides detailed explanations of both image content and any additional instructions given by the user.",
    },
    {
      role: "user",
      content: "Analyze the contents of this image in detail.",
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
      ],
    },
  ];

  // Add an additional message specifically for the text prompt
  if (prompt) {
    console.log("Prompt:", prompt);
    messages.push({
      role: "user",
      content: `Also, please address the following additional question: ${prompt}`,
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_completion_tokens: 3000,
  });

  return response.choices[0]?.message?.content || "No response from GPT-4";
}

// Helper function to upload image to Firebase Storage, convert to Base64, and get GPT-4 Vision response
async function handleImageQuestion(file: File, prompt:string): Promise<string> {
  // Upload the image to Firebase Storage
  const storageRef = ref(storage, `question_images/${file.name}-${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  // Convert the image file to Base64
  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");

  // Get GPT-4 Vision response for the Base64 image
  const gptResponse = await getGptImageResponse(base64Image, prompt);
  return gptResponse;
}

// POST /api/sessions/:sessionId/questions - Add question to session
export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const contentType = request.headers.get("content-type") || "";
    let content: string | File;
    let askedBy: string;
    let type: string;
    let prompt = "";
    let answer = "";
    let answerType: "text" | "image" = "text";

    if (contentType.includes("application/json")) {
      // Handle text-based question
      const data = await request.json();
      content = data.content;
      askedBy = data.askedBy;
      type = data.type;

      if (type === "text") {
        answer = await getGptTextResponse(content as string);
      } else {
        return NextResponse.json(
          { error: "Invalid question type" },
          { status: 400 }
        );
      }
    } else if (contentType.includes("multipart/form-data")) {
      // Handle image-based question
      const formData = await request.formData();
      content = formData.get("file") as File;
      askedBy = formData.get("askedBy") as string;
      type = formData.get("type") as string;
      prompt = (formData.get("prompt") as string) || "";
      console.log(`Prompt: ${prompt}`);

      if (type === "image" && content instanceof File) {
        answer = await handleImageQuestion(content, prompt);
        answerType = "image";
      } else {
        return NextResponse.json(
          { error: "Invalid question type or missing content" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type" },
        { status: 415 }
      );
    }

    const questionData = {
      content: typeof content === "string" ? content : "", // Optional for image
      sessionId,
      askedBy,
      type,
      answer,
      answerType,
      createdAt: new Date(),
      prompt,
    };

    await QuestionSchema.validate(questionData); // Validate with schema
    const docRef = await addDoc(collection(db, "questions"), questionData);
    return NextResponse.json({ id: docRef.id, ...questionData });
  } catch (error: any) {
    console.error("Error adding question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add question" },
      { status: 400 }
    );
  }
}

// GET /api/sessions/:sessionId/questions - Retrieve all questions in a session
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

    // Map through the documents to structure the response
    const questions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions for session:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

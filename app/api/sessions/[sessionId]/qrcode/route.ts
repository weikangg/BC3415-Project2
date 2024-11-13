// app/api/sessions/[sessionId]/qrcode/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "qrcode";
import { auth } from "../../../../../firebaseConfig";

// GET /api/sessions/:sessionId/qrcode - Generate QR code for a session
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Get session ID from the request parameters
    const { sessionId } = params;

    // Retrieve session data from Firestore
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    // if (!sessionSnap.exists()) {
    //   return NextResponse.json({ error: "Session not found" }, { status: 404 });
    // }

    // Generate a URL for the session that the QR code will point to
    const sessionData = sessionSnap.data();
    const sessionURL = `https://bc-3415-project2.vercel.app/students/${sessionId}`; // TODO: CHANGE THIS LATER

    // Generate the QR code as a data URL
    const qrCodeDataUrl = await QRCode.toDataURL(sessionURL);

    return NextResponse.json({ qrCodeDataUrl });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

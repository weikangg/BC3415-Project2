// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../firebaseConfig";
import { signOut } from "firebase/auth";

export async function POST() {
  try {
    await signOut(auth);
    return NextResponse.json({ message: "User logged out successfully" });
  } catch (error: any) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log out" },
      { status: 400 }
    );
  }
}

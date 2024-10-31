// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password } = data;

    // Authenticate the user
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const idToken = await userCredential.user.getIdToken();
    console.log("ID Token:", idToken);
    
    return NextResponse.json({
      message: "User logged in successfully",
      userId: user.uid,
      email: user.email,
    });
  } catch (error: any) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log in" },
      { status: 400 }
    );
  }
}

// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { db, auth } from "../../../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { UserSchema } from "../../../../helpers/schemas";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await UserSchema.validate(data); // Validate input using Yup schema

    const { email, password, name, role, username } = data;

    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    
    // Store additional user info in Firestore
    const userRef = await addDoc(collection(db, "users"), {
      uid: user.uid,
      name,
      role,
      username,
      email,
    });

    return NextResponse.json({
      message: "User registered successfully",
      userId: user.uid,
      name: name,
      email: email,
      firestoreId: userRef.id,
    });
  } catch (error: any) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 400 }
    );
  }
}

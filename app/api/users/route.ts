// app/api/users/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { UserSchema } from "../../../helpers/schemas";

// Helper function to check if a username already exists
async function isUsernameTaken(username: string): Promise<boolean> {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.some((doc) => doc.data().username === username);
}

// POST /api/users - Create User
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate the input data
    await UserSchema.validate(data);

    // Check if the username already exists
    const usernameExists = await isUsernameTaken(data.username);
    if (usernameExists) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Add new user to Firestore
    const docRef = await addDoc(collection(db, "users"), data);
    return NextResponse.json({ id: docRef.id, ...data });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 400 });
  }
}

// GET /api/users - Get all users
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

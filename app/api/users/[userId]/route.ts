// app/api/users/[userId]/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { UserSchema } from "../../../../helpers/schemas";

// GET /api/users/:userId - Get user details
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userRef = doc(db, "users", params.userId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/:userId - Update user details
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const data = await request.json();

    // Validate the input data
    await UserSchema.validate(data);

    const userRef = doc(db, "users", params.userId);
    const existingUser = await getDoc(userRef);

    // Check if the user exists
    if (!existingUser.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingData = existingUser.data();

    // If there are no changes, do not proceed
    if (JSON.stringify(existingData) === JSON.stringify(data)) {
      return NextResponse.json({ message: "No changes detected" });
    }

    // Update user information in Firestore
    await updateDoc(userRef, data);
    return NextResponse.json({ id: params.userId, ...data });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userRef = doc(db, "users", params.userId);
    const docSnap = await getDoc(userRef);

    // Check if the document exists
    if (!docSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the document
    await deleteDoc(userRef);
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

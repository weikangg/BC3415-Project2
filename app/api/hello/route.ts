import { NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";

// GET request to fetch all documents from the "users" collection
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST request to add a new document to the "users" collection
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const docRef = await addDoc(collection(db, "users"), data);
    return NextResponse.json({ id: docRef.id, ...data });
  } catch (error) {
    console.error("Error adding document:", error);
    return NextResponse.json({ error: "Failed to add document" }, { status: 500 });
  }
}
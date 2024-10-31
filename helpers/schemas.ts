import * as Yup from "yup";

// User schema for validating user documents
export const UserSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  password: Yup.string().required("Password is required"),
  role: Yup.string().required("Role is required"),
  username: Yup.string().required("Username is required"),
  email: Yup.string().email().required("Email is required"),
});

// Document schema for validating document details
export const DocumentSchema = Yup.object().shape({
  name: Yup.string().required("Document name is required"),
  uploadedBy: Yup.string().required("Uploader ID is required"),
  downloadURL: Yup.string().url().required("Download URL is required"),
  sessionId: Yup.string().required("Session ID is required"), // Added sessionId
});

// Updated Session schema for creating a session
export const SessionSchema = Yup.object().shape({
  title: Yup.string().required("Session title is required"),
  createdBy: Yup.string().required("Creator ID is required"),
  createdAt: Yup.date().required("Creation date is required"),
  joinedUsers: Yup.array().of(Yup.string()), // Array of user IDs who joined the session
});

// Question schema for validating questions related to a session
export const QuestionSchema = Yup.object().shape({
  content: Yup.string().when("type", {
    is: "text",
    then: (schema) => schema.required("Question content is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  sessionId: Yup.string().required("Session ID is required"),
  askedBy: Yup.string().required("Asker ID is required"),
  type: Yup.mixed()
    .oneOf(["text", "image"])
    .required("Question type is required"),
  answer: Yup.string().nullable(), // Nullable because the answer may not be available initially
  answerType: Yup.mixed().oneOf(["text", "image"]).nullable(), // Type of answer (text or image)
});

export const SessionIdSchema = Yup.object({
  sessionId: Yup.string().required("Session ID is required"),
});

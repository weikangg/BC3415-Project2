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
});

// Session schema for validating session data
export const SessionSchema = Yup.object().shape({
  title: Yup.string().required("Session title is required"),
  createdBy: Yup.string().required("Creator ID is required"),
  createdAt: Yup.date().required("Creation date is required"),
});

// Question schema for validating questions related to a session
export const QuestionSchema = Yup.object().shape({
  content: Yup.string().required("Question content is required"),
  sessionId: Yup.string().required("Session ID is required"),
  askedBy: Yup.string().required("Asker ID is required"),
  type: Yup.mixed()
    .oneOf(["text", "image"])
    .required("Question type is required"),
});

// Answer schema for validating answers associated with a question
export const AnswerSchema = Yup.object().shape({
  content: Yup.string().required("Answer content is required"),
  questionId: Yup.string().required("Question ID is required"),
  answeredBy: Yup.string().required("Responder ID is required"),
});

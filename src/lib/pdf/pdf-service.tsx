import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import ResumeTemplate from "./ResumeTemplate";
import JSONResumeTemplate from "./JSONResumeTemplate";
import { parseSections } from "./parser";
import { ResumeJSON } from "@/lib/ai/simple-json-generation";

/**
 * Generate a PDF resume from the provided content
 *
 * @param content The resume content (markdown or plain text)
 * @param name The name to display on the resume
 * @returns Buffer containing the PDF data
 */
export async function generateResumePDF(
  content: string,
  name: string
): Promise<Buffer> {
  try {
    // Parse the content into sections
    const sections = parseSections(content);

    // Create the PDF document
    const resumeDocument = <ResumeTemplate name={name} sections={sections} />;

    // Render to buffer
    return await renderToBuffer(resumeDocument);
  } catch (error) {
    console.error("Error generating resume PDF:", error);
    throw new Error("Failed to generate resume PDF. Please try again.");
  }
}

// Cover letter PDF generation has been removed as per user request

/**
 * Generate a PDF resume from JSON data using the JSONResumeTemplate
 *
 * @param resumeJSON The resume data in JSON format
 * @returns Buffer containing the PDF data
 */
export async function generateJSONResumePDF(
  resumeJSON: ResumeJSON
): Promise<Buffer> {
  try {
    // Create the PDF document using the JSON resume template
    const resumeDocument = <JSONResumeTemplate resume={resumeJSON} />;

    // Render to buffer
    return await renderToBuffer(resumeDocument);
  } catch (error) {
    console.error("Error generating JSON resume PDF:", error);
    throw new Error("Failed to generate JSON resume PDF. Please try again.");
  }
}

/**
 * Determine if the content is a resume or cover letter based on its structure
 * and generate the appropriate PDF
 *
 * @param content The document content
 * @param fileName The file name (used to extract the name)
 * @param jsonData Optional JSON resume data to use instead of parsing text
 * @returns Buffer containing the PDF data
 */
export async function generateDocumentPDF(
  content: string,
  fileName: string,
  jsonData?: ResumeJSON
): Promise<Buffer> {
  // If JSON data is provided, use it to generate the PDF
  if (jsonData && fileName.includes("resume")) {
    return await generateJSONResumePDF(jsonData);
  }

  // Extract name from fileName or use a default
  const name = extractNameFromFileName(fileName);

  // We now only generate PDFs for resumes, not cover letters
  return await generateResumePDF(content, name);
}

/**
 * Helper to extract a name from the filename
 */
function extractNameFromFileName(fileName: string): string {
  // Remove file extension
  let name = fileName.replace(/\.(pdf|txt)$/i, "");

  // Remove common prefixes like "resume-" or "cover-letter-"
  name = name.replace(/^(resume-|cover-letter-)/i, "");

  // Replace hyphens and underscores with spaces
  name = name.replace(/[-_]/g, " ");

  // Capitalize words
  name = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return name;
}

// The detectIfResume function has been removed as we now only generate PDFs for resumes

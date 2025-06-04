import { PDFDocument } from "pdf-lib";
import { generateResumePDF, generateCoverLetterPDF } from "@/lib/pdf/generator";

// Mock pdf-lib
jest.mock("pdf-lib", () => {
  const mockPage = {
    getSize: jest.fn().mockReturnValue({ width: 612, height: 792 }),
    drawText: jest.fn(),
    drawLine: jest.fn(),
    setFont: jest.fn(),
    setFontSize: jest.fn(),
  };
  const mockPdfDoc = {
    getPages: jest.fn().mockReturnValue([mockPage]),
    getPage: jest.fn().mockReturnValue(mockPage),
    addPage: jest.fn().mockReturnValue(mockPage),
    embedFont: jest.fn().mockResolvedValue({
      getName: jest.fn().mockReturnValue("Test Font"),
      getWidthOfTextAtSize: jest.fn().mockReturnValue(100),
    }),
    save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  };

  return {
    PDFDocument: {
      create: jest.fn().mockResolvedValue(mockPdfDoc),
    },
  };
});

describe("PDF Generator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateResumePDF", () => {
    const resumeData = {
      personalInfo: {
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        location: "New York, NY",
        linkedin: "linkedin.com/in/johndoe",
        website: "johndoe.com",
      },
      summary: "Experienced software engineer with 5+ years of experience...",
      skills: ["JavaScript", "React", "Node.js", "TypeScript", "Next.js"],
      experience: [
        {
          title: "Senior Software Engineer",
          company: "Tech Company",
          location: "New York, NY",
          startDate: "2020-01",
          endDate: "Present",
          description: "Led development of web applications...",
          highlights: [
            "Developed and maintained React applications",
            "Implemented CI/CD pipelines",
            "Reduced load times by 40%",
          ],
        },
        {
          title: "Software Engineer",
          company: "Startup Inc",
          location: "San Francisco, CA",
          startDate: "2018-03",
          endDate: "2019-12",
          description: "Full-stack development...",
          highlights: [
            "Built RESTful APIs using Node.js",
            "Developed front-end using React",
          ],
        },
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science",
          institution: "University of Technology",
          location: "Boston, MA",
          startDate: "2014-09",
          endDate: "2018-05",
          gpa: "3.8/4.0",
        },
      ],
      certifications: [
        {
          name: "AWS Certified Solutions Architect",
          issuer: "Amazon Web Services",
          date: "2021-06",
        },
      ],
    };

    it("creates a PDF document with resume content", async () => {
      const pdfBytes = await generateResumePDF(resumeData);

      // Verify PDF document was created
      expect(PDFDocument.create).toHaveBeenCalled();

      // Verify content was added to the PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.getPage(0);

      // Check that text was drawn for personal info
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("John Doe"),
        expect.any(Object)
      );

      // Check that text was drawn for summary
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Experienced software engineer"),
        expect.any(Object)
      );

      // Check that text was drawn for skills
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Skills"),
        expect.any(Object)
      );

      // Check that text was drawn for experience
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Experience"),
        expect.any(Object)
      );

      // Check that text was drawn for education
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Education"),
        expect.any(Object)
      );

      // Verify PDF was saved
      expect(pdfDoc.save).toHaveBeenCalled();
      expect(pdfBytes).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("handles empty resume data gracefully", async () => {
      const emptyResumeData = {
        personalInfo: {
          name: "John Doe",
          email: "john@example.com",
          phone: "",
          location: "",
          linkedin: "",
          website: "",
        },
        summary: "",
        skills: [],
        experience: [],
        education: [],
        certifications: [],
      };

      const pdfBytes = await generateResumePDF(emptyResumeData);

      // Verify PDF document was created
      expect(PDFDocument.create).toHaveBeenCalled();

      // Verify content was added to the PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.getPage(0);

      // Check that text was drawn for personal info
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("John Doe"),
        expect.any(Object)
      );

      // Verify PDF was saved
      expect(pdfDoc.save).toHaveBeenCalled();
      expect(pdfBytes).toEqual(new Uint8Array([1, 2, 3]));
    });
  });

  describe("generateCoverLetterPDF", () => {
    const coverLetterData = {
      personalInfo: {
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        location: "New York, NY",
      },
      recipientInfo: {
        name: "Hiring Manager",
        company: "Tech Company",
        address: "123 Tech St, San Francisco, CA",
      },
      letterContent: {
        greeting: "Dear Hiring Manager,",
        introduction: "I am writing to express my interest...",
        body: "With over 5 years of experience in software development...",
        conclusion: "Thank you for considering my application...",
        closing: "Sincerely,",
      },
      date: "2025-06-01",
    };

    it("creates a PDF document with cover letter content", async () => {
      const pdfBytes = await generateCoverLetterPDF(coverLetterData);

      // Verify PDF document was created
      expect(PDFDocument.create).toHaveBeenCalled();

      // Verify content was added to the PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.getPage(0);

      // Check that text was drawn for sender info
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("John Doe"),
        expect.any(Object)
      );

      // Check that text was drawn for recipient info
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Hiring Manager"),
        expect.any(Object)
      );

      // Check that text was drawn for date
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("2025-06-01"),
        expect.any(Object)
      );

      // Check that text was drawn for greeting
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Dear Hiring Manager"),
        expect.any(Object)
      );

      // Check that text was drawn for body content
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("I am writing to express"),
        expect.any(Object)
      );

      // Check that text was drawn for closing
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Sincerely"),
        expect.any(Object)
      );

      // Verify PDF was saved
      expect(pdfDoc.save).toHaveBeenCalled();
      expect(pdfBytes).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("handles minimal cover letter data gracefully", async () => {
      const minimalCoverLetterData = {
        personalInfo: {
          name: "John Doe",
          email: "john@example.com",
          phone: "",
          location: "",
        },
        recipientInfo: {
          name: "Hiring Manager",
          company: "Tech Company",
          address: "",
        },
        letterContent: {
          greeting: "Dear Hiring Manager,",
          introduction: "I am writing to express my interest...",
          body: "",
          conclusion: "",
          closing: "Sincerely,",
        },
        date: "",
      };

      const pdfBytes = await generateCoverLetterPDF(minimalCoverLetterData);

      // Verify PDF document was created
      expect(PDFDocument.create).toHaveBeenCalled();

      // Verify content was added to the PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.getPage(0);

      // Check that text was drawn for sender info
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("John Doe"),
        expect.any(Object)
      );

      // Check that text was drawn for greeting
      expect(page.drawText).toHaveBeenCalledWith(
        expect.stringContaining("Dear Hiring Manager"),
        expect.any(Object)
      );

      // Verify PDF was saved
      expect(pdfDoc.save).toHaveBeenCalled();
      expect(pdfBytes).toEqual(new Uint8Array([1, 2, 3]));
    });
  });
});

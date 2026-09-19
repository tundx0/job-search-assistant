"use client";

import { useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { JobApplication, JobApplicationStatus } from "@/types";
import { ResumeStrengthScore } from "./resume-strength-score";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import {
  ContactInfoForm,
  ContactInfo,
} from "@/components/jobs/contact-info-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { FileViewerModal } from "@/components/ui/file-viewer-modal";

// Document actions component for file operations
function DocumentActions({
  url,
  filename,
  fileType,
  isGenerating,
  onGenerate,
}: {
  url?: string;
  filename: string;
  fileType: "pdf" | "txt" | "json";
  isGenerating?: boolean;
  onGenerate?: () => void;
}) {
  if (!url && isGenerating) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          className="opacity-70 pointer-events-none"
        >
          <span className="flex items-center gap-2">
            <Loading size="sm" />
            Generating...
          </span>
        </Button>
      </div>
    );
  }

  if (!url && onGenerate) {
    return (
      <Button variant="outline" size="sm" onClick={onGenerate}>
        Generate Document
      </Button>
    );
  }

  return url ? (
    <FileViewerModal url={url} filename={filename} fileType={fileType} />
  ) : null;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface JobDetailProps {
  jobApplication: JobApplication & {
    resumeInsight?: {
      overallFeedback: string;
      improvementAreas: string[];
      strengths: string[];
      missingKeywords: string[];
      skillGaps: string[];
      formatSuggestions: string | null;
      contentSuggestions: string | null;
      summaryFeedback: string | null;
      experienceFeedback: string | null;
      educationFeedback: string | null;
      skillsFeedback: string | null;
    } | null;
  };
}

export function JobDetail({ jobApplication }: JobDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [status, setStatus] = useState(jobApplication.status);
  const [showContactForm, setShowContactForm] = useState(false);
  // Track if this is the first load
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Check if documents are already generated
  const hasDocuments =
    jobApplication.tailoredResume && jobApplication.coverLetter;

  // Function to handle contact info submission
  function handleContactInfoSubmit(data: ContactInfo) {
    generateDocuments(data);
  }

  // Reusable function to check if user has contact info
  async function checkUserContactInfo(): Promise<boolean> {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        return (
          !!userData.email &&
          (!!userData.phone || !!userData.location || !!userData.linkedin)
        );
      }
      return false;
    } catch (error) {
      console.error("Error checking user profile:", error);
      return false;
    }
  }

  // Function to trigger document generation
  async function triggerDocumentGeneration() {
    // Check if user already has contact info before showing the form
    const hasContactInfo = await checkUserContactInfo();

    if (hasContactInfo) {
      // User already has contact info, generate documents directly
      generateDocuments();
    } else {
      // User needs to provide contact info
      setShowContactForm(true);
    }
  }

  // Function to generate documents with contact info
  const generateDocuments = useCallback(
    async (contactInfo?: ContactInfo) => {
      if (hasDocuments) {
        return;
      }

      // Reset error state
      setGenerationError(null);
      setIsGenerating(true);

      try {
        const response = await fetch(`/api/jobs/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: jobApplication.id,
            contactInfo,
            format: "json",
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || "Failed to generate documents");
        }

        const result = await response.json();

        // Hide contact form if it was shown
        setShowContactForm(false);

        toast({
          title: "Success",
          description: "Resume and cover letter generated successfully!",
        });

        // Refresh the page to show the updated job application
        router.refresh();

        // If we have PDF URLs, open them in new tabs
        if (result.resumePdfUrl) {
          window.open(result.resumePdfUrl, "_blank");
        }

        if (result.coverLetterPdfUrl) {
          window.open(result.coverLetterPdfUrl, "_blank");
        }
      } catch (error: unknown) {
        console.error("Error generating documents:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setGenerationError(errorMessage);
        toast({
          title: "Error",
          description: `Failed to generate documents: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [
      hasDocuments,
      jobApplication.id,
      router,
      setIsGenerating,
      setShowContactForm,
      setGenerationError,
      toast,
    ]
  );

  // Function to update job application status
  async function updateStatus(newStatus: typeof jobApplication.status) {
    try {
      const response = await fetch(`/api/jobs/${jobApplication.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setStatus(newStatus);

      toast({
        title: "Status Updated",
        description: `Job application status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Status update error:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Function to calculate resume strength score
  async function calculateStrengthScore() {
    setIsCalculatingScore(true);

    try {
      const response = await fetch(`/api/jobs/${jobApplication.id}/score`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to calculate strength score");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Resume strength score: ${result.strengthScore}%`,
      });

      // Refresh the page to show the updated job application
      router.refresh();
    } catch (error: unknown) {
      console.error("Error calculating strength score:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to calculate strength score: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsCalculatingScore(false);
    }
  }

  // Function to delete job application
  async function deleteJobApplication() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/jobs/${jobApplication.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job application");
      }

      toast({
        title: "Success",
        description: "Job application deleted successfully",
      });

      // Redirect to dashboard after successful deletion
      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error deleting job application:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to delete job application: ${errorMessage}`,
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  }

  // Function to print document
  function printDocument(documentType: "resume" | "coverLetter") {
    const content =
      documentType === "resume"
        ? jobApplication.tailoredResume
        : jobApplication.coverLetter;

    const title =
      documentType === "resume"
        ? `Resume - ${jobApplication.jobTitle} at ${jobApplication.companyName}`
        : `Cover letter - ${jobApplication.jobTitle} at ${jobApplication.companyName}`;

    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 2rem;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div>${content}</div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  // Check if we need to generate documents
  // Only run this logic on first load when documents don't exist
  if (isFirstLoad && !hasDocuments && !isGenerating && !showContactForm) {
    // Create a promise to handle the contact info check
    const contactInfoPromise = (async () => {
      setIsFirstLoad(false);
      const hasContactInfo = await checkUserContactInfo();
      
      if (hasContactInfo) {
        // If user already has contact info, automatically generate documents
        generateDocuments();
      } else {
        // Only show contact form if user doesn't have contact info
        setShowContactForm(true);
      }
      return null; // Return value doesn't matter, we're using side effects
    })();
    
    // Use the promise with the use() hook
    use(contactInfoPromise);
  }

  if (!hasDocuments) {
    // Show contact form if needed
    if (showContactForm) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-2xl">
            <ContactInfoForm
              onSubmit={handleContactInfoSubmit}
              onCancel={() => setShowContactForm(false)}
              isSubmitting={isGenerating}
              defaultValues={{
                email: "",
              }}
            />
            <p className="text-center text-sm text-muted-foreground mt-4">
              This information will be used in your resume. You can update it in
              your profile later.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {generationError ? "Generation Failed" : "Generating Documents"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {isGenerating ? (
              <>
                <Loading
                  size="lg"
                  text="Creating your tailored resume and cover letter..."
                />
                <p className="text-center text-sm text-muted-foreground">
                  This may take a minute. We&apos;re analyzing the job
                  description and crafting personalized documents.
                </p>
              </>
            ) : generationError ? (
              <>
                <div className="text-destructive text-center mb-4">
                  <p className="font-semibold">Error: {generationError}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    There was a problem generating your documents.
                  </p>
                </div>
                <Button onClick={() => generateDocuments()}>Try Again</Button>
              </>
            ) : (
              <>
                <Loading size="lg" text="Preparing to generate documents..." />
                <Button onClick={() => generateDocuments()} className="mt-4">
                  Start Generation
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resume Strength Score */}
      {jobApplication.strengthScore ? (
        <ResumeStrengthScore
          score={jobApplication.strengthScore}
          jobTitle={jobApplication.jobTitle}
          insights={jobApplication.resumeInsight}
        />
      ) : (
        hasDocuments && (
          <Card>
            <CardHeader>
              <CardTitle>Resume Strength Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Calculate how well your resume matches this job position.
              </p>
              <Button
                onClick={calculateStrengthScore}
                disabled={isCalculatingScore}
              >
                {isCalculatingScore ? (
                  <>
                    <Loading size="sm" /> Calculating Score...
                  </>
                ) : (
                  "Calculate Match Score"
                )}
              </Button>
            </CardContent>
          </Card>
        )
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/2">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
            <CardTitle>Tailored resume</CardTitle>
            <div className="flex flex-col xs:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
              <DocumentActions
                url={jobApplication.tailoredResume}
                filename={`resume-${jobApplication.id}.pdf`}
                fileType="pdf"
                isGenerating={!jobApplication.tailoredResume && isGenerating}
                onGenerate={triggerDocumentGeneration}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full xs:w-auto"
                onClick={() => printDocument("resume")}
              >
                Print resume
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Resume content is now viewed through the modal */}
            <div className="text-sm text-muted-foreground mb-4">
              Click the View button above to see the resume PDF
            </div>

            {jobApplication.tailoredResumeJSON && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">
                    Structured Resume Data (JSON)
                  </h4>
                  <DocumentActions
                    url={jobApplication.tailoredResumeJSON}
                    filename={`resume-data-${jobApplication.id}.json`}
                    fileType="json"
                    isGenerating={false}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This is the structured data version of your resume that can be
                  used by ATS systems
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full md:w-1/2">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
            <CardTitle>Cover letter</CardTitle>
            <div className="flex flex-col xs:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
              <DocumentActions
                url={jobApplication.coverLetter}
                filename={`cover-letter-${jobApplication.id}.txt`}
                fileType="txt"
                isGenerating={!jobApplication.coverLetter && isGenerating}
                onGenerate={triggerDocumentGeneration}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full xs:w-auto"
                onClick={() => printDocument("coverLetter")}
              >
                Print Cover letter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cover letter content is now viewed through the modal */}
            <div className="text-sm text-muted-foreground">
              Click the View button above to see the cover letter content
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap rounded-md border p-4 bg-muted/50">
            {jobApplication.jobDescription}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Application status</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loading size="sm" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete job
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your job application for {jobApplication.jobTitle} at{" "}
                  {jobApplication.companyName} and all associated documents.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteJobApplication}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "pending",
              "submitted",
              "interviewing",
              "rejected",
              "accepted",
            ].map((statusOption) => (
              <Button
                key={statusOption}
                variant={status === statusOption ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  updateStatus(statusOption as JobApplicationStatus)
                }
              >
                {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { TemplateEditor } from "@/components/pdf/template-editor";

// Type for JSON resume data
interface ResumeJSON {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description?: string[];
  }>;
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resume");
  const [jsonInput, setJsonInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [name, setName] = useState("Your Name");
  const [savedTemplateStyles, setSavedTemplateStyles] = useState<
    Record<string, unknown>
  >({});
  const [jsonValid, setJsonValid] = useState(true);
  const [jsonError, setJsonError] = useState("");
  const [loadedFiles, setLoadedFiles] = useState<string[]>([]);

  // Load saved template styles from localStorage on component mount
  useEffect(() => {
    const savedStyles = localStorage.getItem("templateStyles");
    if (savedStyles) {
      try {
        setSavedTemplateStyles(JSON.parse(savedStyles));
      } catch (error) {
        console.error("Error loading saved template styles:", error);
      }
    }

    // Load list of available files
    fetchAvailableFiles();
  }, []);

  // Fetch available JSON and text files from storage
  const fetchAvailableFiles = async () => {
    try {
      const response = await fetch("/api/storage/list?type=document");
      if (response.ok) {
        const data = await response.json();
        setLoadedFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  // Handle JSON input changes
  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    try {
      if (value.trim()) {
        JSON.parse(value);
        setJsonValid(true);
        setJsonError("");
      }
    } catch (error) {
      setJsonValid(false);
      setJsonError((error as Error).message);
    }
  };

  // Convert JSON to text for preview
  const convertJsonToText = (json: string): string => {
    try {
      const data = JSON.parse(json) as ResumeJSON;
      let text = `${data.name}\n\n`;

      // Contact information
      if (data.contact) {
        const contactInfo = [];
        if (data.contact.email) contactInfo.push(data.contact.email);
        if (data.contact.phone) contactInfo.push(data.contact.phone);
        if (data.contact.location) contactInfo.push(data.contact.location);
        if (contactInfo.length > 0) {
          text += `${contactInfo.join(" | ")}\n`;
        }
        if (data.contact.linkedin)
          text += `LinkedIn: ${data.contact.linkedin}\n`;
        if (data.contact.github) text += `GitHub: ${data.contact.github}\n`;
        if (data.contact.website) text += `Website: ${data.contact.website}\n`;
      }

      // Summary
      if (data.summary) {
        text += `\nSUMMARY\n${data.summary}\n`;
      }

      // Skills
      if (data.skills && data.skills.length > 0) {
        text += `\nSKILLS\n${data.skills.join(", ")}\n`;
      }

      // Experience
      if (data.experience && data.experience.length > 0) {
        text += `\nEXPERIENCE\n`;
        data.experience.forEach((exp) => {
          text += `${exp.title} | ${exp.company}`;
          if (exp.location) text += ` | ${exp.location}`;
          text += `\n${exp.startDate} - ${exp.endDate || "Present"}\n`;
          if (exp.description && exp.description.length > 0) {
            exp.description.forEach((desc) => {
              text += `• ${desc}\n`;
            });
          }
          text += "\n";
        });
      }

      // Education
      if (data.education && data.education.length > 0) {
        text += `\nEDUCATION\n`;
        data.education.forEach((edu) => {
          text += `${edu.degree}`;
          if (edu.field) text += ` in ${edu.field}`;
          text += ` | ${edu.institution}`;
          if (edu.location) text += ` | ${edu.location}`;
          text += `\n${edu.startDate} - ${edu.endDate || "Present"}\n`;
          if (edu.description && edu.description.length > 0) {
            edu.description.forEach((desc) => {
              text += `• ${desc}\n`;
            });
          }
          text += "\n";
        });
      }

      return text;
    } catch (error) {
      console.error("Error converting JSON to text:", error);
      return "Error converting JSON to text. Please check your JSON format.";
    }
  };

  // Load file content
  const loadFile = async (fileName: string) => {
    try {
      const response = await fetch(
        `/api/storage/file?name=${encodeURIComponent(fileName)}`
      );
      if (response.ok) {
        const data = await response.json();

        if (fileName.endsWith(".json")) {
          setJsonInput(data.content);
          handleJsonChange(data.content);
          setActiveTab("json");

          // Extract name from JSON if possible
          try {
            const jsonData = JSON.parse(data.content);
            if (jsonData.name) {
              setName(jsonData.name);
            }
          } catch (e) {
            throw new Error("Failed to parse JSON", e as Error);
          }
        } else {
          setTextInput(data.content);
          setActiveTab("text");
        }

        toast({
          title: "File Loaded",
          description: `Successfully loaded ${fileName}`,
        });
      } else {
        throw new Error("Failed to load file");
      }
    } catch (error) {
      console.error("Error loading file:", error);
      toast({
        title: "Error",
        description: "Failed to load file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Save template styles
  const handleSaveTemplateStyles = (styles: unknown) => {
    const updatedStyles = {
      ...savedTemplateStyles,
      [activeTab === "resume" ? "resume" : "coverLetter"]: styles,
    };

    setSavedTemplateStyles(updatedStyles);
    localStorage.setItem("templateStyles", JSON.stringify(updatedStyles));

    toast({
      title: "Template Saved",
      description: `${
        activeTab === "resume" ? "Resume" : "Cover Letter"
      } template styling saved successfully.`,
    });
  };

  return (
    <div className="space-y-8">
      <header className="page-head">
        <div>
          <p className="label-mono">Documents</p>
          <h1 className="page-title mt-2">Template editor</h1>
          <p className="page-subtitle">
            Preview how your resume and cover letter typeset before you export
            them as PDFs.
          </p>
        </div>
      </header>

      <Tabs defaultValue="resume" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resume">Resume template</TabsTrigger>
          <TabsTrigger value="coverLetter">Cover letter template</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Content Source</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text" className="mb-6">
              <TabsList>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textContent">Content</Label>
                  <Textarea
                    id="textContent"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter your content here..."
                    className="min-h-[300px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="json" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="jsonContent">JSON Content</Label>
                  <Textarea
                    id="jsonContent"
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder="Enter your JSON content here..."
                    className={`min-h-[300px] ${
                      !jsonValid ? "border-destructive" : ""
                    }`}
                  />
                  {!jsonValid && (
                    <p className="text-destructive text-sm">{jsonError}</p>
                  )}
                </div>
                {jsonValid && jsonInput && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-md p-4 bg-muted/50 whitespace-pre-wrap text-sm">
                      {convertJsonToText(jsonInput)}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {loadedFiles.length > 0 && (
              <div className="mt-6">
                <Label>Load Existing File</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {loadedFiles.map((file) => (
                    <Button
                      key={file}
                      variant="outline"
                      onClick={() => loadFile(file)}
                      className="justify-start"
                    >
                      {file}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateEditor
              type={activeTab as "resume" | "coverLetter"}
              initialContent={
                activeTab === "json" && jsonValid && jsonInput
                  ? convertJsonToText(jsonInput)
                  : textInput
              }
              initialName={name}
              onSave={handleSaveTemplateStyles}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

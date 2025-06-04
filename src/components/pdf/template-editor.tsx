"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";

type TemplateType = "resume" | "coverLetter";

interface TemplateEditorProps {
  initialContent?: string;
  initialName?: string;
  type: TemplateType;
  onSave?: (styling: unknown) => void;
}

export function TemplateEditor({
  initialContent = "",
  initialName = "Your Name",
  type,
  onSave,
}: TemplateEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  // Styling options
  const [styling, setStyling] = useState({
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    primaryColor: "#1a365d",
    secondaryColor: "#4a5568",
    margins: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    },
    spacing: 10,
  });

  // Available font options
  const fontOptions = [
    "Helvetica",
    "Times-Roman",
    "Courier",
    "Roboto",
    "Georgia",
    "Arial",
  ];

  // Update styling
  const updateStyling = (key: string, value: unknown) => {
    setStyling((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Update margin
  const updateMargin = (
    key: "top" | "right" | "bottom" | "left",
    value: number
  ) => {
    setStyling((prev) => ({
      ...prev,
      margins: {
        ...prev.margins,
        [key]: value,
      },
    }));
  };

  // Generate PDF preview
  const generatePreview = async () => {
    setIsLoading(true);
    setPdfPreview(null);

    try {
      const response = await fetch("/api/preview/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          content,
          name,
          styling,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF preview");
      }

      const data = await response.json();
      setPdfPreview(`data:application/pdf;base64,${data.pdf}`);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save template styling
  const handleSave = () => {
    if (onSave) {
      onSave(styling);
      toast({
        title: "Success",
        description: "Template styling saved successfully.",
      });
    }
  };

  // Generate preview when styling changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generatePreview();
    }, 1000);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styling, content, name]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="content">
                {type === "resume" ? "Resume Content" : "Cover Letter Content"}
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === "resume"
                    ? "Enter your resume content..."
                    : "Enter your cover letter content..."
                }
                className="min-h-[300px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Styling Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="typography">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="typography" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={styling.fontFamily}
                    onValueChange={(value) =>
                      updateStyling("fontFamily", value)
                    }
                  >
                    <SelectTrigger id="fontFamily">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">
                    Font Size: {styling.fontSize}pt
                  </Label>
                  <Slider
                    id="fontSize"
                    min={8}
                    max={16}
                    step={0.5}
                    value={[styling.fontSize]}
                    onValueChange={(value) =>
                      updateStyling("fontSize", value[0])
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineHeight">
                    Line Height: {styling.lineHeight}
                  </Label>
                  <Slider
                    id="lineHeight"
                    min={1}
                    max={2}
                    step={0.1}
                    value={[styling.lineHeight]}
                    onValueChange={(value) =>
                      updateStyling("lineHeight", value[0])
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={styling.primaryColor}
                      onChange={(e) =>
                        updateStyling("primaryColor", e.target.value)
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={styling.primaryColor}
                      onChange={(e) =>
                        updateStyling("primaryColor", e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={styling.secondaryColor}
                      onChange={(e) =>
                        updateStyling("secondaryColor", e.target.value)
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={styling.secondaryColor}
                      onChange={(e) =>
                        updateStyling("secondaryColor", e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Margins (in points)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marginTop">
                        Top: {styling.margins.top}pt
                      </Label>
                      <Slider
                        id="marginTop"
                        min={20}
                        max={80}
                        step={5}
                        value={[styling.margins.top]}
                        onValueChange={(value) => updateMargin("top", value[0])}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marginRight">
                        Right: {styling.margins.right}pt
                      </Label>
                      <Slider
                        id="marginRight"
                        min={20}
                        max={80}
                        step={5}
                        value={[styling.margins.right]}
                        onValueChange={(value) =>
                          updateMargin("right", value[0])
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marginBottom">
                        Bottom: {styling.margins.bottom}pt
                      </Label>
                      <Slider
                        id="marginBottom"
                        min={20}
                        max={80}
                        step={5}
                        value={[styling.margins.bottom]}
                        onValueChange={(value) =>
                          updateMargin("bottom", value[0])
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marginLeft">
                        Left: {styling.margins.left}pt
                      </Label>
                      <Slider
                        id="marginLeft"
                        min={20}
                        max={80}
                        step={5}
                        value={[styling.margins.left]}
                        onValueChange={(value) =>
                          updateMargin("left", value[0])
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spacing">
                    Element Spacing: {styling.spacing}pt
                  </Label>
                  <Slider
                    id="spacing"
                    min={5}
                    max={20}
                    step={1}
                    value={[styling.spacing]}
                    onValueChange={(value) =>
                      updateStyling("spacing", value[0])
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave}>Save Template</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky top-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>PDF Preview</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[800px] flex items-center justify-center">
            {isLoading ? (
              <Loading size="lg" />
            ) : pdfPreview ? (
              <iframe
                src={pdfPreview}
                className="w-full h-[800px] border-0"
                title="PDF Preview"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No preview available</p>
                <Button
                  onClick={generatePreview}
                  className="mt-4"
                  variant="outline"
                >
                  Generate Preview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

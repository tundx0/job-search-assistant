import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, Copy, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface FileViewerModalProps {
  url: string;
  filename: string;
  fileType: "pdf" | "txt" | "json";
}

export function FileViewerModal({ url, filename, fileType }: FileViewerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = () => {
    // For PDF and other binary files, we need to fetch and create a blob URL
    if (fileType === "pdf" || fileType === "json") {
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl); // Clean up
        })
        .catch(err => {
          console.error("Download failed:", err);
          toast({
            title: "Download Failed",
            description: "Could not download the file. Please try again.",
            variant: "destructive"
          });
        });
    } else {
      // For text files
      fetch(url)
        .then(response => response.text())
        .then(text => {
          const blob = new Blob([text], { type: "text/plain" });
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl); // Clean up
        })
        .catch(err => {
          console.error("Download failed:", err);
          toast({
            title: "Download Failed",
            description: "Could not download the file. Please try again.",
            variant: "destructive"
          });
        });
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied",
      description: "File URL has been copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </DialogTrigger>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyUrl}>
          <Copy className="h-4 w-4 mr-2" />
          Copy URL
        </Button>
      </div>

      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{filename}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-auto">
          {fileType === "pdf" && (
            <object 
              data={url}
              type="application/pdf"
              className="w-full h-[70vh]"
            >
              <div className="flex items-center justify-center h-full flex-col gap-4">
                <p>Unable to display PDF. Please download the file instead.</p>
                <Button onClick={handleDownload} variant="outline">
                  Download PDF
                </Button>
              </div>
            </object>
          )}
          
          {fileType === "txt" && (
            <div className="whitespace-pre-wrap rounded-md border p-4 bg-muted/50 overflow-x-auto h-full">
              <TextViewer url={url} />
            </div>
          )}
          
          {fileType === "json" && (
            <div className="whitespace-pre-wrap rounded-md border p-4 bg-muted/50 overflow-x-auto h-full font-mono">
              <JsonViewer url={url} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Component to fetch and display text content
function TextViewer({ url }: { url: string }) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [url]);

  if (isLoading) return <div>Loading content...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  
  return <>{content}</>;
}

// Component to fetch and display JSON content
function JsonViewer({ url }: { url: string }) {
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }
        const json = await response.json();
        setContent(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [url]);

  if (isLoading) return <div>Loading content...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  
  return <>{JSON.stringify(content, null, 2)}</>;
}

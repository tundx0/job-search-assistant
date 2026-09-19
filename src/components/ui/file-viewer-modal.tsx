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

function toAuthenticatedFileUrl(url: string): string {
  if (!url) {
    return url;
  }

  if (url.startsWith("/api/storage/file")) {
    return url;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname === "/api/storage/file") {
      return `${parsed.pathname}${parsed.search}`;
    }
    const sameOrigin = parsed.origin === window.location.origin;
    if (
      sameOrigin &&
      parsed.pathname.startsWith("/storage/") &&
      !parsed.pathname.startsWith("/storage/v1/")
    ) {
      const name = parsed.pathname.slice("/storage/".length);
      return `/api/storage/file?name=${encodeURIComponent(name)}`;
    }
  } catch {
    // Keep the original URL if it cannot be parsed
  }

  return url;
}

export function FileViewerModal({ url, filename, fileType }: FileViewerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileUrl = toAuthenticatedFileUrl(url);

  const handleDownload = () => {
    const downloadUrl = `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}download=1`;
    fetch(downloadUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Download failed");
        }
        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Download failed:", err);
        toast({
          title: "Download Failed",
          description: "Could not download the file. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleCopyUrl = () => {
    const absolute = new URL(fileUrl, window.location.origin).toString();
    navigator.clipboard.writeText(absolute);
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
              data={fileUrl}
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
              <TextViewer url={fileUrl} />
            </div>
          )}
          
          {fileType === "json" && (
            <div className="whitespace-pre-wrap rounded-md border p-4 bg-muted/50 overflow-x-auto h-full font-mono">
              <JsonViewer url={fileUrl} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
        setContent(await response.text());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [url]);

  if (isLoading) return <div>Loading content...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  
  return <>{content}</>;
}

function JsonViewer({ url }: { url: string }) {
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
        try {
          setContent(JSON.stringify(JSON.parse(text), null, 2));
        } catch {
          setContent(text);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [url]);

  if (isLoading) return <div>Loading content...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  
  return <>{content}</>;
}

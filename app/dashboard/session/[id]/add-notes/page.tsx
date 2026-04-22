"use client";

import { useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Upload, Loader2, X, CheckCircle } from "lucide-react";

const textLikeExtensions = [".txt", ".md", ".csv", ".json"];
const documentExtensions = [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".rtf"];

function hasExtension(fileName: string, extensions: string[]) {
  const lower = fileName.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

function getUploadType(file: File): "text" | "pdf" | "image" | "document" {
  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("text/") || hasExtension(file.name, textLikeExtensions)) {
    return "text";
  }

  if (
    file.type.includes("word") ||
    file.type.includes("officedocument") ||
    file.type.includes("presentation") ||
    file.type.includes("spreadsheet") ||
    hasExtension(file.name, documentExtensions)
  ) {
    return "document";
  }

  return "document";
}

export default function AddNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const [activeTab, setActiveTab] = useState("text");
  const [title, setTitle] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      setIsLoading(false);
      return;
    }

    try {
      if (activeTab === "text") {
        if (!title.trim() || !content.trim()) {
          throw new Error("Please provide a title and content");
        }

        const { error: insertError } = await supabase.from("notes").insert({
          session_id: sessionId,
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          file_type: "text",
        });

        if (insertError) throw insertError;
      } else {
        if (files.length === 0) {
          throw new Error("Please select at least one file");
        }

        // Save uploads as notes; extract text when possible and save metadata for binary files.
        const customUploadTitle = uploadTitle.trim();

        for (const [index, file] of files.entries()) {
          const fileType = getUploadType(file);
          const fileSizeKb = (file.size / 1024).toFixed(1);
          let fileContent = "";
          const noteTitle = customUploadTitle
            ? files.length === 1
              ? customUploadTitle
              : `${customUploadTitle} (${index + 1})`
            : file.name;

          if (fileType === "text") {
            fileContent = await file.text();
          } else if (fileType === "pdf") {
            fileContent = [
              `Uploaded PDF: ${file.name}`,
              `Size: ${fileSizeKb} KB`,
              "AI text extraction for PDFs is not enabled in this demo yet.",
            ].join("\n");
          } else if (fileType === "image") {
            fileContent = [
              `Uploaded image: ${file.name}`,
              `Size: ${fileSizeKb} KB`,
              "Image OCR/analysis is not enabled in this demo yet.",
            ].join("\n");
          } else {
            fileContent = [
              `Uploaded document: ${file.name}`,
              `Size: ${fileSizeKb} KB`,
              "Document parsing is not enabled in this demo yet.",
            ].join("\n");
          }

          const { error: insertError } = await supabase.from("notes").insert({
            session_id: sessionId,
            user_id: user.id,
            title: noteTitle,
            content: fileContent,
            file_type: fileType,
          });

          if (insertError) throw insertError;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/session/${sessionId}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Notes Added Successfully!</h3>
            <p className="text-muted-foreground">Redirecting back to your session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/session/${sessionId}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Session
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add Notes</CardTitle>
          <CardDescription>
            Add your study materials by pasting text or uploading files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

             <Tabs value={activeTab} onValueChange={setActiveTab}>
               <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="text" className="gap-2">
                   <FileText className="w-4 h-4" />
                   Paste Text
                 </TabsTrigger>
                 <TabsTrigger value="upload" className="gap-2">
                   <Upload className="w-4 h-4" />
                   Upload Files
                 </TabsTrigger>
               </TabsList>

               <TabsContent value="text" className="space-y-4 mt-4">
                 <div className="space-y-2">
                   <Label htmlFor="title">Note Title *</Label>
                   <Input
                     id="title"
                     placeholder="e.g., Chapter 5 Notes, Lecture Summary"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     required={activeTab === "text"}
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="content">Content *</Label>
                   <Textarea
                     id="content"
                     placeholder="Paste your notes here..."
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     rows={12}
                     className="font-mono text-sm"
                     required={activeTab === "text"}
                   />
                 </div>
               </TabsContent>

              <TabsContent value="upload" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uploadTitle">Title for Uploaded Notes (optional)</Label>
                  <Input
                    id="uploadTitle"
                    placeholder="e.g., Midterm Review Notes"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If multiple files are selected, numbered titles will be created automatically.
                  </p>
                </div>

                <div
                   onDrop={handleDrop}
                   onDragOver={(e) => e.preventDefault()}
                   className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                 >
                   <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                   <p className="text-muted-foreground mb-2">
                     Drag and drop files here, or
                   </p>
                   <label>
                     <input
                       type="file"
                       multiple
                       className="hidden"
                       accept=".txt,.md,.csv,.json,.pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.rtf"
                       onChange={handleFileSelect}
                     />
                     <Button type="button" variant="outline" asChild>
                       <span className="cursor-pointer">Browse Files</span>
                     </Button>
                   </label>
                   <p className="text-xs text-muted-foreground mt-2">
                     Supports PDF, images, and documents (DOC, DOCX, PPT, XLS, RTF)
                   </p>
                 </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                     <Label>Selected Files ({files.length})</Label>
                     {files.map((file, index) => (
                       <div
                         key={index}
                         className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                       >
                         <FileText className="w-5 h-5 text-primary" />
                         <span className="flex-1 truncate text-sm">{file.name}</span>
                         <span className="text-xs text-muted-foreground">
                           {(file.size / 1024).toFixed(1)} KB
                         </span>
                         <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           onClick={() => removeFile(index)}
                         >
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                     ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Notes...
                  </>
                ) : (
                  "Add Notes"
                )}
              </Button>
              <Link href={`/dashboard/session/${sessionId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

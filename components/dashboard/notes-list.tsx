"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Image, File, Trash2, Loader2, Pencil, Check, X } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
}

interface NotesListProps {
  notes: Note[];
  sessionId: string;
}

const fileIcons: Record<string, typeof FileText> = {
  text: FileText,
  image: Image,
  pdf: File,
  document: File,
};

export function NotesList({ notes, sessionId }: NotesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const router = useRouter();

  void sessionId;

  async function handleDelete(noteId: string) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    setDeletingId(noteId);
    const supabase = createClient();
    
    await supabase.from("notes").delete().eq("id", noteId);
    
    setDeletingId(null);
    router.refresh();
  }

  function startEditing(noteId: string, currentTitle: string) {
    setEditingId(noteId);
    setEditingTitle(currentTitle);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveTitle(noteId: string) {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) return;

    setSavingId(noteId);
    const supabase = createClient();

    const { error } = await supabase
      .from("notes")
      .update({ title: nextTitle })
      .eq("id", noteId);

    setSavingId(null);

    if (!error) {
      setEditingId(null);
      setEditingTitle("");
      router.refresh();
    }
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No notes added yet</p>
        <p className="text-sm">Add your first note to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const IconComponent = note.file_type 
          ? fileIcons[note.file_type] || File 
          : FileText;

        return (
          <div
            key={note.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-muted/30 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {editingId === note.id ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Note title"
                    className="h-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => saveTitle(note.id)}
                    disabled={savingId === note.id || editingTitle.trim().length === 0}
                  >
                    {savingId === note.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEditing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{note.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => startEditing(note.id, note.title)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              {note.content && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {note.content.substring(0, 150)}...
                </p>
              )}
              {note.file_url && (
                <span className="text-xs text-primary">Uploaded file</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(note.id)}
              disabled={deletingId === note.id}
            >
              {deletingId === note.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

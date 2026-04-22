import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Layers, Headphones, BookOpen, Brain, HelpCircle, FileText, Sparkles } from "lucide-react";
import { NotesList } from "@/components/dashboard/notes-list";
import { GeneratedMaterialsList } from "@/components/dashboard/generated-materials-list";
import { GenerateMaterialsButton } from "@/components/dashboard/generate-materials-button";

const learningModes = [
  { id: "slideshow", name: "Slideshow", icon: Layers, description: "Visual slides" },
  { id: "audio", name: "Audio", icon: Headphones, description: "Listen & learn" },
  { id: "flashcards", name: "Flashcards", icon: BookOpen, description: "Active recall" },
  { id: "mindmap", name: "Mind Map", icon: Brain, description: "Visual connections" },
  { id: "quiz", name: "Quiz", icon: HelpCircle, description: "Test yourself" },
  { id: "summary", name: "Summary", icon: FileText, description: "Quick review" },
];

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session) {
    notFound();
  }

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: false });

  const { data: materials } = await supabase
    .from("generated_materials")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: false });

  const hasNotes = notes && notes.length > 0;

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{session.title}</h1>
            {session.subject && (
              <span className="inline-block mt-2 px-3 py-1 text-sm rounded-full bg-primary/10 text-primary">
                {session.subject}
              </span>
            )}
            {session.description && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{session.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Notes Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Add your study materials to this session</CardDescription>
              </div>
              <Link href={`/dashboard/session/${id}/add-notes`}>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Notes
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <NotesList notes={notes || []} sessionId={id} />
            </CardContent>
          </Card>

          {/* Generated Materials */}
          {materials && materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Materials</CardTitle>
                <CardDescription>Your AI-generated study materials</CardDescription>
              </CardHeader>
              <CardContent>
                <GeneratedMaterialsList materials={materials} sessionId={id} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generate Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Generate Materials
                </CardTitle>
                <Link href={`/dashboard/session/${id}/choose-format`}>
                  <Button variant="secondary" size="sm">Choose Format</Button>
                </Link>
              </div>
              <CardDescription>
                Transform your notes into different learning formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasNotes ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-4">
                    Add notes first to generate study materials
                  </p>
                  <Link href={`/dashboard/session/${id}/add-notes`}>
                    <Button variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Notes
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {learningModes.map((mode) => (
                    <GenerateMaterialsButton
                      key={mode.id}
                      sessionId={id}
                      modeId={mode.id}
                      modeName={mode.name}
                      modeDescription={mode.description}
                      ModeIcon={mode.icon}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SlideshowViewer } from "@/components/viewers/slideshow-viewer";
import { AudioViewer } from "@/components/viewers/audio-viewer";
import { FlashcardsViewer } from "@/components/viewers/flashcards-viewer";
import { MindmapViewer } from "@/components/viewers/mindmap-viewer";
import { QuizViewer } from "@/components/viewers/quiz-viewer";
import { SummaryViewer } from "@/components/viewers/summary-viewer";

const viewerComponents: Record<string, React.ComponentType<{ content: Record<string, unknown> }>> = {
  slideshow: SlideshowViewer,
  audio: AudioViewer,
  flashcards: FlashcardsViewer,
  mindmap: MindmapViewer,
  quiz: QuizViewer,
  summary: SummaryViewer,
};

export default async function ViewMaterialPage({
  params,
}: {
  params: Promise<{ id: string; type: string; materialId: string }>;
}) {
  const { id: sessionId, type, materialId } = await params;
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("generated_materials")
    .select("*")
    .eq("id", materialId)
    .single();

  if (!material || material.type !== type) {
    notFound();
  }

  const ViewerComponent = viewerComponents[type];

  if (!ViewerComponent) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Link
          href={`/dashboard/session/${sessionId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Session
        </Link>
      </div>

      <ViewerComponent content={material.content as Record<string, unknown>} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, Headphones, BookOpen, Brain, HelpCircle, FileText, Play } from "lucide-react";

interface Material {
  id: string;
  type: string;
  content: Record<string, unknown>;
  created_at: string;
}

interface GeneratedMaterialsListProps {
  materials: Material[];
  sessionId: string;
}

const modeConfig: Record<string, { icon: typeof Layers; label: string; color: string }> = {
  slideshow: { icon: Layers, label: "Slideshow", color: "bg-primary/10 text-primary" },
  audio: { icon: Headphones, label: "Audio Summary", color: "bg-secondary/20 text-secondary-foreground" },
  flashcards: { icon: BookOpen, label: "Flashcards", color: "bg-accent/20 text-accent-foreground" },
  mindmap: { icon: Brain, label: "Mind Map", color: "bg-chart-4/20 text-foreground" },
  quiz: { icon: HelpCircle, label: "Quiz", color: "bg-chart-5/20 text-foreground" },
  summary: { icon: FileText, label: "Summary", color: "bg-primary/10 text-primary" },
};

export function GeneratedMaterialsList({ materials, sessionId }: GeneratedMaterialsListProps) {
  if (materials.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => {
        const config = modeConfig[material.type] || modeConfig.summary;
        const IconComponent = config.icon;

        return (
          <div
            key={material.id}
            className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/30"
          >
            <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium">{config.label}</h4>
              <p className="text-xs text-muted-foreground">
                Generated {new Date(material.created_at).toLocaleDateString()}
              </p>
            </div>
            <Link href={`/dashboard/session/${sessionId}/view/${material.type}/${material.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Play className="w-4 h-4" />
                View
              </Button>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

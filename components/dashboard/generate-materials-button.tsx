"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface GenerateMaterialsButtonProps {
  sessionId: string;
  modeId: string;
  modeName: string;
  modeDescription: string;
  ModeIcon: LucideIcon;
}

export function GenerateMaterialsButton({
  sessionId,
  modeId,
  modeName,
  modeDescription,
  ModeIcon,
}: GenerateMaterialsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type: modeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate materials");
      }

      const data = await response.json();
      router.refresh();
      router.push(`/dashboard/session/${sessionId}/view/${modeId}/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-auto py-3"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ModeIcon className="w-5 h-5" />
        )}
        <div className="text-left">
          <div className="font-medium">{modeName}</div>
          <div className="text-xs text-muted-foreground">{modeDescription}</div>
        </div>
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Play, Pause, Square, Volume2, VolumeX } from "lucide-react";

interface AudioSection {
  heading: string;
  content: string;
}

interface AudioContent {
  title: string;
  script: string;
  sections: AudioSection[];
}

export function AudioViewer({ content }: { content: Record<string, unknown> }) {
  const { title, script, sections } = content as AudioContent;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert("Your browser does not support text-to-speech.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (utteranceRef.current) {
      utteranceRef.current.volume = isMuted ? 1 : 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
          <Headphones className="w-6 h-6 text-secondary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audio Summary</h1>
          <p className="text-muted-foreground">{title}</p>
        </div>
      </div>

      {/* Audio Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="w-12 h-12"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            <Button
              onClick={playAudio}
              size="lg"
              className="w-16 h-16 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={stopAudio}
              className="w-12 h-12"
            >
              <Square className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isPlaying ? "Playing audio summary..." : "Click play to listen"}
          </p>
        </CardContent>
      </Card>

      {/* Transcript Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Transcript</h2>
        {sections.map((section, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-colors ${
              currentSection === index ? "border-primary" : ""
            }`}
            onClick={() => setCurrentSection(index)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{section.heading}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{section.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

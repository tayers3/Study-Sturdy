"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface Slide {
  title: string;
  content: string;
  bulletPoints: string[];
}

interface SlideshowContent {
  slides: Slide[];
}

export function SlideshowViewer({ content }: { content: Record<string, unknown> }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { slides } = content as SlideshowContent;

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Layers className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Slideshow</h1>
          <p className="text-muted-foreground">
            Slide {currentSlide + 1} of {slides.length}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-8 min-h-[400px] flex flex-col">
          <h2 className="text-3xl font-bold mb-4 text-primary">{slide.title}</h2>
          <p className="text-lg text-muted-foreground mb-6">{slide.content}</p>
          <ul className="space-y-3 flex-1">
            {slide.bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-lg">{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsContent {
  cards: Flashcard[];
}

export function FlashcardsViewer({ content }: { content: Record<string, unknown> }) {
  const { cards: originalCards } = content as FlashcardsContent;
  const [cards, setCards] = useState(originalCards);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const resetCards = () => {
    setCards(originalCards);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const card = cards[currentCard];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <p className="text-muted-foreground">
              Card {currentCard + 1} of {cards.length}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={shuffleCards} title="Shuffle cards">
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={resetCards} title="Reset cards">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Flashcard */}
      <div className="perspective-1000 mb-6">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full"
          aria-label={isFlipped ? "Show question" : "Show answer"}
        >
          <Card
            className={`min-h-[300px] cursor-pointer transition-all duration-500 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <CardContent
              className="p-8 flex flex-col items-center justify-center min-h-[300px] absolute inset-0"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-xs font-medium text-primary mb-4 uppercase tracking-wider">
                Question
              </span>
              <p className="text-xl text-center font-medium">{card.front}</p>
              <span className="text-sm text-muted-foreground mt-4">Click to flip</span>
            </CardContent>
            <CardContent
              className="p-8 flex flex-col items-center justify-center min-h-[300px] absolute inset-0 bg-primary text-primary-foreground rounded-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <span className="text-xs font-medium mb-4 uppercase tracking-wider opacity-80">
                Answer
              </span>
              <p className="text-xl text-center">{card.back}</p>
              <span className="text-sm mt-4 opacity-80">Click to flip</span>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevCard}
          disabled={currentCard === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Progress dots */}
        <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentCard(index);
                setIsFlipped(false);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCard ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={nextCard}
          disabled={currentCard === cards.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

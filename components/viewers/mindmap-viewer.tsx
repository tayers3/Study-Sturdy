"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";

interface Branch {
  topic: string;
  subtopics: string[];
}

interface MindmapContent {
  centralTopic: string;
  branches: Branch[];
}

const branchColors = [
  "bg-primary/10 border-primary text-primary",
  "bg-secondary/20 border-secondary text-secondary-foreground",
  "bg-accent/20 border-accent text-accent-foreground",
  "bg-chart-4/20 border-chart-4 text-foreground",
  "bg-chart-5/20 border-chart-5 text-foreground",
  "bg-chart-1/20 border-chart-1 text-foreground",
  "bg-chart-2/20 border-chart-2 text-foreground",
];

export function MindmapViewer({ content }: { content: Record<string, unknown> }) {
  const { centralTopic, branches } = content as MindmapContent;
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(
    new Set(branches.map((_, i) => i))
  );

  const toggleBranch = (index: number) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBranches(newExpanded);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-chart-4/20 flex items-center justify-center">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mind Map</h1>
          <p className="text-muted-foreground">Visual concept connections</p>
        </div>
      </div>

      {/* Central Topic */}
      <div className="flex justify-center mb-8">
        <div className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-xl font-bold shadow-lg">
          {centralTopic}
        </div>
      </div>

      {/* Branches */}
      <div className="grid md:grid-cols-2 gap-4">
        {branches.map((branch, index) => {
          const colorClass = branchColors[index % branchColors.length];
          const isExpanded = expandedBranches.has(index);

          return (
            <Card key={index} className={`border-2 ${colorClass}`}>
              <button
                onClick={() => toggleBranch(index)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <h3 className="font-semibold text-lg">{branch.topic}</h3>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
              {isExpanded && (
                <CardContent className="pt-0 pb-4">
                  <ul className="space-y-2">
                    {branch.subtopics.map((subtopic, subIndex) => (
                      <li
                        key={subIndex}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" />
                        <span>{subtopic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Connection Lines Visual */}
      <div className="mt-8 p-6 bg-muted/30 rounded-xl">
        <h3 className="font-semibold mb-4 text-center">Concept Overview</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {branches.map((branch, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-sm ${branchColors[index % branchColors.length]}`}
            >
              {branch.topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";

interface SummaryDetail {
  heading: string;
  content: string;
}

interface SummaryContent {
  title: string;
  overview: string;
  keyPoints: string[];
  details: SummaryDetail[];
}

export function SummaryViewer({ content }: { content: Record<string, unknown> }) {
  const { title, overview, keyPoints, details } = content as SummaryContent;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Condensed Summary</h1>
          <p className="text-muted-foreground">Quick review notes</p>
        </div>
      </div>

      {/* Title and Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground">{overview}</p>
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Detailed Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detailed Notes</h2>
        {details.map((detail, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{detail.heading}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{detail.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

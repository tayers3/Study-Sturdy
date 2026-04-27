import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="pointer-events-none absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex">
          <BrandLockup />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/start">
            <Button>Start</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-16 flex w-full max-w-4xl flex-col items-center text-center md:mt-24">
        <div className="mb-8 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Sparkles className="mr-2 size-4" />
          Ask once, learn your way
        </div>

        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Study Search
        </h1>
        <p className="mb-10 max-w-2xl text-muted-foreground sm:text-lg">
          Type any question and pick a learning method. Study Sturdy turns it into material you can actually use.
        </p>

        <form className="group relative w-full max-w-3xl" action="/dashboard">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Ask a question... ex: Explain mitosis for a 10th grader"
            className="h-14 rounded-full border-border/70 bg-card/90 pl-12 pr-36 text-base shadow-md transition group-focus-within:shadow-lg"
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full px-5"
          >
            Generate
          </Button>
        </form>

        <Tabs defaultValue="flashcards" className="mt-8 w-full max-w-3xl">
          <TabsList className="h-auto w-full flex-wrap justify-center gap-2 rounded-2xl bg-muted/60 p-2">
            <TabsTrigger value="flashcards" className="h-10 rounded-xl px-4">Flashcards</TabsTrigger>
            <TabsTrigger value="quiz" className="h-10 rounded-xl px-4">Quiz</TabsTrigger>
            <TabsTrigger value="mindmap" className="h-10 rounded-xl px-4">Mind Map</TabsTrigger>
            <TabsTrigger value="summary" className="h-10 rounded-xl px-4">Summary</TabsTrigger>
            <TabsTrigger value="audio" className="h-10 rounded-xl px-4">Audio</TabsTrigger>
            <TabsTrigger value="slides" className="h-10 rounded-xl px-4">Slides</TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards" className="mt-5 rounded-2xl border border-border/60 bg-card/90 p-6 text-left shadow-sm">
            Best for fast recall and spaced repetition.
          </TabsContent>
          <TabsContent value="quiz" className="mt-5 rounded-2xl border border-border/60 bg-card/90 p-6 text-left shadow-sm">
            Best for self-testing before exams.
          </TabsContent>
          <TabsContent value="mindmap" className="mt-5 rounded-2xl border border-border/60 bg-card/90 p-6 text-left shadow-sm">
            Best for connecting concepts and seeing the big picture.
          </TabsContent>
          <TabsContent value="summary" className="mt-5 rounded-2xl border border-border/60 bg-card/90 p-6 text-left shadow-sm">
            Best for quick review when your notes are long.
          </TabsContent>
          <TabsContent value="audio" className="mt-5 rounded-2xl border border-border/60 bg-card/90 p-6 text-left shadow-sm">
            Best for studying while commuting or walking.
          </TabsContent>
          <TabsContent value="slides" className="mt-5 rounded-2xl border border-border/60 bg-card/90 p-6 text-left shadow-sm">
            Best for visual learners who like structured flow.
          </TabsContent>
        </Tabs>
      </section>

      <footer className="mx-auto mt-16 flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border/50 pt-6 text-sm text-muted-foreground md:justify-between">
        <p>Study Sturdy</p>
        <div className="flex items-center gap-6">
          <Link href="/start" className="hover:text-foreground">Continue as guest</Link>
          <Link href="/auth/login" className="hover:text-foreground">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}

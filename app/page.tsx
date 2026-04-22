import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import {
  BookOpen,
  Headphones,
  Layers,
  Brain,
  HelpCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Upload,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Slideshows",
    description: "Visual presentations that break down concepts into digestible slides",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Headphones,
    title: "Audio Summaries",
    description: "Listen to your notes on the go with text-to-speech conversion",
    color: "bg-secondary/20 text-secondary-foreground",
  },
  {
    icon: BookOpen,
    title: "Flashcards",
    description: "Active recall cards to test and reinforce your knowledge",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: Brain,
    title: "Mind Maps",
    description: "Visual diagrams showing connections between concepts",
    color: "bg-chart-4/20 text-foreground",
  },
  {
    icon: HelpCircle,
    title: "Study Quizzes",
    description: "Practice questions to test your understanding",
    color: "bg-chart-5/20 text-foreground",
  },
  {
    icon: FileText,
    title: "Condensed Notes",
    description: "Streamlined summaries for quick review sessions",
    color: "bg-primary/10 text-primary",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLockup />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/start">
              <Button>Continue as Guest</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              AI-Powered Study Materials
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
              Transform Your Notes Into{" "}
              <span className="text-primary">Any Learning Style</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
              Upload your study notes and let AI convert them into slideshows, audio summaries, 
              flashcards, mind maps, quizzes, and condensed notes. Learn the way that works best for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/start">
                <Button size="lg" className="gap-2">
                  Start Instantly
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  I Already Have an Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            Three simple steps to transform your study experience
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Upload Notes</h3>
              <p className="text-muted-foreground text-sm">
                Paste text or upload PDFs, images, and documents
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Choose Format</h3>
              <p className="text-muted-foreground text-sm">
                Select your preferred learning style from 6 options
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Start Learning</h3>
              <p className="text-muted-foreground text-sm">
                Study with AI-generated materials tailored to you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">6 Learning Modes</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            Every student learns differently. Choose the format that fits your style.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Study Smarter?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join thousands of students who are acing their exams with AI-powered study materials.
          </p>
          <Link href="/start">
            <Button size="lg" variant="secondary" className="gap-2">
              Continue as Guest
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Study Sturdy. Built with AI to help you learn.</p>
        </div>
      </footer>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StudentAiSearch } from "@/components/dashboard/student-ai-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, Clock, Layers, Headphones, Brain, HelpCircle, FileText } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

const modeIcons: Record<string, typeof Layers> = {
  slideshow: Layers,
  audio: Headphones,
  flashcards: BookOpen,
  mindmap: Brain,
  quiz: HelpCircle,
  summary: FileText,
};

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <StudentAiSearch />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Study Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your notes and generated study materials
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No study sessions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first study session to start transforming your notes into learning materials.
            </p>
            <Link href="/dashboard/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <Link key={session.id} href={`/dashboard/session/${session.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                        {session.title}
                      </CardTitle>
                      {session.subject && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {session.subject}
                        </span>
                      )}
                    </div>
                  </div>
                  {session.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {session.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Updated {formatDistanceToNow(new Date(session.updated_at))}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

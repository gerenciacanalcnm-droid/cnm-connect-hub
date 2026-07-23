import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { novaService, type NovaMessage } from "@/services/nova.service";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/keys";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/common/loader";

export function NovaChat() {
  const { data: suggestions } = useQuery({
    queryKey: queryKeys.nova, queryFn: () => novaService.suggestions(),
  });
  const { data: initial } = useQuery({
    queryKey: queryKeys.novaHistory, queryFn: () => novaService.history(),
  });

  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (initial && messages.length === 0) setMessages(initial); }, [initial, messages.length]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || pending) return;
    setMessages((m) => [...m, { from: "user", text: value }]);
    setInput(""); setPending(true);
    const reply = await novaService.chat(value);
    setMessages((m) => [...m, reply]);
    setPending(false);
  };

  return (
    <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden border-nova/20">
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-nova/10 via-transparent to-transparent px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-nova text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">CNM Nova</div>
            <div className="text-xs text-muted-foreground">Tu copiloto de mensajería con IA</div>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
        </Badge>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
              m.from === "user"
                ? "gradient-brand text-primary-foreground"
                : "bg-muted"
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-3"><Loader /></div>
          </div>
        )}
      </div>

      {suggestions && messages.length < 4 && (
        <div className="border-t px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((s) => (
              <button key={s} onClick={() => send(s)}
                className="rounded-full border bg-card px-3 py-1 text-xs transition hover:border-nova/40 hover:bg-nova/5">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <CardContent className="border-t p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta lo que quieras a CNM Nova..." className="flex-1" />
          <Button type="submit" disabled={!input.trim() || pending} className="gap-1.5 gradient-nova text-white hover:opacity-90">
            <Send className="h-4 w-4" /> Enviar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

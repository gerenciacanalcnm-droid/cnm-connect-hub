import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/store/ui-store";
import { useNova } from "@/hooks/use-nova";
import { novaService, type NovaMessage } from "@/services/nova.service";
import { cn } from "@/lib/utils";

const WELCOME: NovaMessage[] = [
  { from: "nova", text: "¡Hola! Soy CNM Nova, tu copiloto IA. ¿En qué te ayudo hoy?" },
];

export function NovaDrawer() {
  const open = useUIStore((s) => s.novaOpen);
  const setOpen = useUIStore((s) => s.setNovaOpen);
  const { data: suggestions = [] } = useNova();
  const [messages, setMessages] = useState<NovaMessage[]>(WELCOME);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    const reply = await novaService.chat(trimmed);
    setMessages((prev) => [...prev, reply]);
    setTyping(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg gradient-nova text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-base">CNM Nova</SheetTitle>
              <SheetDescription className="text-left text-xs text-muted-foreground">
                Copiloto IA · siempre en línea
              </SheetDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Online
            </span>
          </div>
        </SheetHeader>

        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="space-y-4 p-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex items-start gap-2.5", m.from === "user" && "flex-row-reverse")}
              >
                <div
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                    m.from === "nova"
                      ? "gradient-nova text-white"
                      : "bg-accent text-accent-foreground",
                  )}
                >
                  {m.from === "nova" ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                    m.from === "nova"
                      ? "rounded-tl-sm bg-surface text-foreground ring-1 ring-border"
                      : "rounded-tr-sm bg-primary text-primary-foreground",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex items-start gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-full gradient-nova text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-surface px-3.5 py-3 ring-1 ring-border">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4 space-y-3">
          {suggestions.length > 0 && messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta a CNM Nova..."
              className="h-10"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 gradient-nova text-white"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-center text-[10px] text-muted-foreground">
            Nova puede cometer errores. Verifica información crítica.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Brain, Cpu, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useServerFn } from "@tanstack/react-start";
import { testNovaResponse } from "@/lib/platform.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model?: string;
  tokens?: number;
}

export function NovaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const doTestNova = useServerFn(testNovaResponse);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Usamos IDs ficticios para la prueba del playground pero que cumplan con UUID si es necesario
      // En un escenario real, esto vendría del contexto de una conversación de WhatsApp
      const result = await doTestNova({
        data: {
          contact_id: "00000000-0000-0000-0000-000000000000",
          conversation_id: "00000000-0000-0000-0000-000000000000",
          message: text
        }
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.response,
        model: result.model,
        tokens: result.usage?.total_tokens
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      toast.error(error.message || "Error al generar respuesta");
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Lo siento, hubo un error al procesar tu solicitud. Verifica que Nova esté ACTIVO y que la API Key de OpenAI esté configurada." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="flex flex-col h-[600px] border-nova/20 overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-nova/10 text-nova">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Playground de Pruebas</CardTitle>
              <CardDescription className="text-xs">Interactúa con CNM Nova en tiempo real</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted">
                  <MessageSquare className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-sm max-w-[250px]">
                  Envía un mensaje para probar la configuración actual de tu asistente Nova.
                </p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === "user" ? "ml-auto items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted border border-border rounded-tl-none"
                  )}
                >
                  {msg.content}
                </div>
                
                {msg.role === "assistant" && msg.model && (
                  <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground font-mono">
                    <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 border-nova/30 text-nova bg-nova/5">
                      {msg.model}
                    </Badge>
                    <span>{msg.tokens} tokens</span>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start items-start gap-2 max-w-[80%]">
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none animate-pulse flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-nova animate-spin-slow" />
                  <span className="text-sm text-muted-foreground italic">Nova está pensando...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <CardContent className="p-4 border-t bg-muted/10">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje de prueba..."
              disabled={isLoading}
              className="bg-background border-nova/20 focus-visible:ring-nova"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-nova hover:bg-nova/90 text-white shadow-md shadow-nova/20 px-6"
            >
              {isLoading ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-nova/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-nova" /> Métricas de la Sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mensajes</span>
                <span className="text-foreground font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tokens Totales</span>
                <span className="text-foreground font-medium">
                  {messages.reduce((acc, m) => acc + (m.tokens || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
            
            <Separator className="bg-nova/10" />
            
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Resumen de Costos
              </h4>
              <Alert className="bg-amber-500/10 border-amber-500/20 py-2 px-3">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <AlertDescription className="text-[10px] text-amber-700 ml-1">
                  Los tokens consumidos se registran para facturación futura.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Alert({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("flex items-center rounded-md border p-4", className)}>{children}</div>;
}
function AlertCircle({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function AlertDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("text-sm", className)}>{children}</div>;
}

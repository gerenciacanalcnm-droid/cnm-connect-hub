import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SocialProviders() {
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      // Google OAuth directo contra el proyecto Supabase propio (identidades ya recuperadas).
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        toast.error("No pudimos iniciar sesión con Google", {
          description: error.message,
        });
        setLoading(false);
        return;
      }
    } catch (e) {
      toast.error("Error inesperado con Google");
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.5l2.63-2.53C16.86 3.4 14.66 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.93 0 9.2-4.86 9.2-7.4 0-.5-.06-.9-.13-1.2H12z"
            />
          </svg>
        )}
        Continuar con Google
      </Button>
    </div>
  );
}

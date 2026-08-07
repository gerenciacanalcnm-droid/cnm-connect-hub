import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint temporal de diagnóstico para identificar la IP pública de salida
 * de las Server Functions de TanStack Start (runtime Cloudflare Worker).
 *
 * Se eliminará una vez validada la IP con el proveedor SMS.
 */
export const Route = createFileRoute("/api/public/sms-ip-test")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          if (!response.ok) {
            return Response.json(
              { error: "Failed to retrieve public IP" },
              { status: 502 },
            );
          }

          const data = (await response.json()) as { ip: string };
          console.log(`[sms-ip-test] Public IP: ${data.ip}`);

          return Response.json(
            { ip: data.ip, source: "tanstack-server-function" },
            {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
              },
            },
          );
        } catch (error) {
          console.error("[sms-ip-test] Error retrieving public IP:", error);
          return Response.json(
            { error: "Unable to determine public IP" },
            { status: 500 },
          );
        }
      },

      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      },
    },
  },
});

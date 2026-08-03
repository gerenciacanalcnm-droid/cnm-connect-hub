/**
 * Extracción y troceado de documentos para la Knowledge Base.
 * SERVIDOR ÚNICAMENTE.
 */
import { engineChat, type NovaEngineConfig } from "./nova-engine.server";

export const TEXT_EXTENSIONS = ["txt", "md", "markdown", "csv", "json", "html", "htm", "xml", "log"];
export const AI_EXTRACT_EXTENSIONS = ["pdf"];
export const KNOWN_EXTENSIONS = [...TEXT_EXTENSIONS, ...AI_EXTRACT_EXTENSIONS, "doc", "docx", "xls", "xlsx"];

export function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trocea el texto en fragmentos con solapamiento, respetando párrafos. */
export function chunkText(text: string, size = 1200, overlap = 150): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > size) {
      push();
      for (let i = 0; i < paragraph.length; i += size - overlap) {
        chunks.push(paragraph.slice(i, i + size).trim());
      }
      continue;
    }
    if ((current + "\n\n" + paragraph).length > size) {
      const tail = current.slice(-overlap);
      push();
      current = `${tail}\n\n${paragraph}`;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  push();
  return chunks.filter((c) => c.length > 20);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Extrae texto de un PDF apoyándose en el modelo multimodal del motor. */
export async function extractWithAi(
  cfg: NovaEngineConfig,
  base64: string,
  mimeType: string,
  filename: string,
): Promise<string> {
  const result = await engineChat({ ...cfg, temperature: 0, maxTokens: 8000 }, [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Extrae TODO el texto legible de este documento en Markdown plano. No resumas, no comentes, no añadas encabezados propios. Devuelve únicamente el contenido.",
        },
        { type: "file", file: { filename, file_data: `data:${mimeType};base64,${base64}` } },
      ],
    },
  ]);
  return typeof result.message.content === "string" ? result.message.content : "";
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

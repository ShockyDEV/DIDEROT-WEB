import { Facebook, Globe, Instagram, Linkedin, Youtube } from "lucide-react";
import type { ListItem } from "@/lib/content/blocks/types";
import { safeHref } from "@/lib/validations";

/**
 * Redes sociales del grupo: lista «Redes sociales» de Contacto en el panel
 * (Contenido → Páginas → Contacto). La usan la página de Contacto y el pie.
 */
export type SocialNetwork = "x" | "instagram" | "facebook" | "youtube" | "linkedin" | "web";

export interface SocialLink {
  red: SocialNetwork;
  /** Nombre de la red («X», «Instagram»…). */
  name: string;
  /** Nombre visible de la cuenta («@DiderotGir»). */
  handle: string;
  url: string;
}

const NAMES: Record<SocialNetwork, string> = {
  x: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  web: "Web",
};

const HOSTS: Array<[RegExp, SocialNetwork]> = [
  [/(^|\.)(x|twitter)\.com$/, "x"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(facebook|fb)\.com$/, "facebook"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
];

/** Red de un elemento: lo escrito en «Red» o, si no se reconoce, la del enlace. */
function networkOf(red: string, url: string): SocialNetwork {
  const key = red.trim().toLowerCase().replace(/\s*\(.*\)$/, "");
  if (key === "twitter") return "x";
  if (key in NAMES) return key as SocialNetwork;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return HOSTS.find(([re]) => re.test(host))?.[1] ?? "web";
  } catch {
    return "web";
  }
}

/** Elementos válidos de la lista (solo enlaces http/https). */
export function socialLinks(items: ListItem[]): SocialLink[] {
  const out: SocialLink[] = [];
  for (const item of items) {
    const url = safeHref(item.url);
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const red = networkOf(String(item.red ?? ""), url);
    const handle = String(item.usuario ?? "").trim();
    out.push({ red, name: NAMES[red], handle: handle || NAMES[red], url });
  }
  return out;
}

export function XIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SocialIcon({
  red,
  className,
}: Readonly<{ red: SocialNetwork; className?: string }>) {
  switch (red) {
    case "x":
      return <XIcon className={className} />;
    case "instagram":
      return <Instagram className={className} aria-hidden="true" />;
    case "facebook":
      return <Facebook className={className} aria-hidden="true" />;
    case "youtube":
      return <Youtube className={className} aria-hidden="true" />;
    case "linkedin":
      return <Linkedin className={className} aria-hidden="true" />;
    default:
      return <Globe className={className} aria-hidden="true" />;
  }
}

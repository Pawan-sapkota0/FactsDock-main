import React from "react";
import { Card } from "@/components/ui/card";
import logger from "@/lib/logger";

type FactLike =
  | string
  | {
      id?: string;
      title?: string | null;
      fact?: string | null;
      fact_text?: string | null;
      description?: string | null;
      text?: string | null;
      [k: string]: unknown;
    };

type Props = {
  fact: FactLike;
  className?: string;
};

function normalizeText(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\s+/g, " ").trim();
}

function getFactTitle(f: FactLike): string | null {
  if (typeof f === "string") return null;
  const val = (f.title ??
    f.fact_text ??
    f.fact ??
    f.description ??
    f.text) as unknown;
  const t = normalizeText(val);
  return t.length > 0 ? t : null;
}

function getFactContent(f: FactLike): string {
  if (typeof f === "string") return normalizeText(f);
  const val = (f.fact_text ??
    f.fact ??
    f.description ??
    f.title ??
    f.text) as unknown;
  return normalizeText(val);
}

export default function FactCard({ fact, className = "" }: Props) {
  const title = getFactTitle(fact);
  const content = getFactContent(fact);

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    try {
      logger.debug("[FactCard] received fact prop", { fact, content });
    } catch (e) {
      /* ignored - dev logging */
    }
  }

  // Avoid duplicate rendering when title and content are identical or one contains the other
  const titleToShow =
    title &&
    title.length > 0 &&
    content.toLowerCase() !== title.toLowerCase() &&
    !content.toLowerCase().includes(title.toLowerCase())
      ? title
      : null;

  return (
    <Card className={`p-4 ${className}`.trim()}>
      {titleToShow ? (
        <h3 className="font-semibold mb-1 text-foreground">{titleToShow}</h3>
      ) : null}
      <p className="text-muted-foreground leading-relaxed">
        {content || "No fact available"}
      </p>
    </Card>
  );
}

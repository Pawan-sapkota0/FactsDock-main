import React from "react";
import { Card } from "@/components/ui/card";

type FactLike =
  | string
  | {
      id?: string;
      title?: string | null;
      fact?: string | null;
      fact_text?: string | null;
      description?: string | null;
      [k: string]: any;
    };

type Props = {
  fact: FactLike;
  className?: string;
};

function normalizeText(v: any) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\s+/g, " ").trim();
}

export default function FactCard({ fact, className = "" }: Props) {
  const isString = typeof fact === "string";
  const title = isString ? null : normalizeText((fact as any).title || "");
  const content = normalizeText(
    isString
      ? fact
      : (fact as any).fact_text ||
          (fact as any).fact ||
          (fact as any).description ||
          (fact as any).title ||
          (fact as any).text ||
          ""
  );

  // Dev-time: log incoming prop shape so we can verify mappings
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    try {
      console.debug("[FactCard] received fact prop", { fact, content });
    } catch (e) {}
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

import React from "react";

type Props = {
  name: string;
  continent?: string;
};

export default function CountryHeader({ name, continent }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold mb-2">{name}</h1>
      {continent && (
        <p className="text-lg text-muted-foreground">Country in {continent}</p>
      )}
    </div>
  );
}

import React from "react";

type Props = {
  name: string;
};

export default function CountryHeader({ name }: Props) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-4xl font-bold">{name}</h1>
      </div>
    </div>
  );
}

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Props = {
  name: string;
  onBack: () => void;
};

export default function CountryHeader({ name, onBack }: Props) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-4xl font-bold">{name}</h1>
    </div>
  );
}

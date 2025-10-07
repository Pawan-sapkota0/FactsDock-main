import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Props = {
  name: string;
  onBack: () => void;
  onRefresh?: () => void;
};

export default function CountryHeader({ name, onBack, onRefresh }: Props) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex items-baseline gap-3">
        <h1 className="text-4xl font-bold">{name}</h1>
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} className="ml-4">Refresh</Button>
        ) : null}
      </div>
    </div>
  );
}

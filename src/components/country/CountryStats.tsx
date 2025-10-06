import React from 'react';

type Props = {
  flag?: string;
  capital?: string;
  population?: string;
  currency?: string;
  languages?: string;
};

export default function CountryStats({ flag, capital, population, currency, languages }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6 items-center mb-8">
      <div className="col-span-1">
        {flag ? (
          <img src={flag} alt="flag" className="w-48 h-32 object-cover rounded-lg shadow" />
        ) : (
          <div className="w-48 h-32 bg-muted rounded-lg flex items-center justify-center">No flag</div>
        )}
      </div>
      <div className="col-span-2 grid gap-2">
        <div><span className="font-semibold">Capital:</span> {capital || 'Data not available'}</div>
        <div><span className="font-semibold">Population:</span> {population || 'Data not available'}</div>
        <div><span className="font-semibold">Currency:</span> {currency || 'Data not available'}</div>
        <div><span className="font-semibold">Languages:</span> {languages || 'Data not available'}</div>
      </div>
    </div>
  );
}

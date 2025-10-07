import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, DollarSign, Globe } from 'lucide-react';

type Props = {
  flag?: string;
  capital?: string;
  population?: string;
  currency?: string;
  languages?: string;
  area?: string;
  region?: string;
  lastUpdated?: number | null;
};

export default function CountryStats({ flag, capital, population, currency, languages, area, region, lastUpdated }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6 items-start mb-8">
      <div className="col-span-1 flex items-center justify-center">
        {flag ? (
          <img src={flag} alt="flag" className="w-56 h-36 object-cover rounded-lg shadow" />
        ) : (
          <div className="w-56 h-36 bg-muted rounded-lg flex items-center justify-center">No flag</div>
        )}
      </div>

      <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Capital
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2 text-foreground">{capital || 'N/A'}</CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Population
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2 text-foreground">{population || 'N/A'}</CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2 text-foreground">{currency || 'N/A'}</CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2 text-foreground">{languages || 'N/A'}</CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Area
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2 text-foreground">{area || 'N/A'}</CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Region
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2 text-foreground">{region || 'N/A'}</CardContent>
        </Card>
      </div>

      {lastUpdated ? (
        <div className="col-span-3 text-right text-sm text-muted-foreground mt-2">Last updated: {new Date(lastUpdated).toLocaleString()}</div>
      ) : null}
    </div>
  );
}

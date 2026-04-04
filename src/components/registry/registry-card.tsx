import Link from "next/link";
import { Calendar, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Registry } from "@/lib/types";
import { OCCASION_TYPES } from "@/lib/constants";

export function RegistryCard({ registry }: { registry: Registry }) {
  const occasionLabel = OCCASION_TYPES.find(
    (o) => o.value === registry.occasion
  )?.label;

  return (
    <Link href={`/registries/${registry.slug}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            {registry.title}
          </CardTitle>
          {registry.is_public && (
            <Badge variant="secondary" className="text-xs">
              Public
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {registry.description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {registry.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {occasionLabel && (
              <span className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                {occasionLabel}
              </span>
            )}
            {registry.occasion_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(registry.occasion_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

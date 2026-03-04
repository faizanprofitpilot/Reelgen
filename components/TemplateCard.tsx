import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function TemplateCard({
  id,
  name,
  description,
  previewUrl,
  selected = false,
  onClick,
}: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1",
        selected && "ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/5"
      )}
      onClick={onClick}
    >
      <CardHeader>
        {previewUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-md bg-black/40 mb-4 border border-white/5">
            <img
              src={previewUrl}
              alt={name}
              className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        )}
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

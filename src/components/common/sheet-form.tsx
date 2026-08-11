import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "default" | "sm" | "lg" | "xl" | "full";
}

export function SheetForm({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "default"
}: SheetFormProps) {
  const sizeClasses = {
    sm: "sm:max-w-sm",
    default: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full: "sm:max-w-full w-screen",
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className={sizeClasses[size]}>
        <SheetHeader className="pb-6">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          {children}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

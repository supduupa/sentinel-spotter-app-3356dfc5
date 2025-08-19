import { cn } from "@/lib/utils";

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileContainer = ({ children, className }: MobileContainerProps) => {
  return (
    <div className={cn(
      "max-w-sm mx-auto min-h-screen bg-background",
      className
    )}>
      {children}
    </div>
  );
};
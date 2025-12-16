import { cn } from "@/lib/utils";

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileContainer = ({ children, className }: MobileContainerProps) => {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      // Mobile: full width
      "w-full",
      // Tablet: centered with padding
      "md:max-w-2xl md:mx-auto",
      // Desktop: max width container
      "lg:max-w-4xl xl:max-w-5xl",
      className
    )}>
      {children}
    </div>
  );
};
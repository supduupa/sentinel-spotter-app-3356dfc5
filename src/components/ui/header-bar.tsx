import { cn } from "@/lib/utils";

interface HeaderBarProps {
  title: string;
  className?: string;
}

export const HeaderBar = ({ title, className }: HeaderBarProps) => {
  return (
    <div className={cn(
      "bg-primary text-primary-foreground p-4 text-center font-semibold text-lg",
      className
    )}>
      {title}
    </div>
  );
};
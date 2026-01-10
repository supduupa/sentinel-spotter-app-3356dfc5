import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

interface HeaderBarProps {
  title: string;
  className?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
}

export const HeaderBar = ({ title, className, showBack, onBack, rightElement }: HeaderBarProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={cn(
      "gradient-primary text-primary-foreground py-4 px-4 md:py-5 md:px-6",
      "sticky top-0 z-50 shadow-soft",
      className
    )}>
      <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-primary-foreground/10 transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-display font-bold text-lg md:text-xl tracking-tight truncate">
            {title}
          </h1>
        </div>
        {rightElement && (
          <div className="flex-shrink-0">
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
};

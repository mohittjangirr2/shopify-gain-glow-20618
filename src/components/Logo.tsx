export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60">
        <span className="text-2xl font-bold text-primary-foreground">O</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold leading-tight tracking-tight">OVIX</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Analytics</span>
      </div>
    </div>
  );
};

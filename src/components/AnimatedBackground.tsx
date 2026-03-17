export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Subtle floating particles */}
      <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full bg-primary/20 animate-float-particle" />
      <div
        className="absolute top-[60%] left-[70%] w-1 h-1 rounded-full bg-primary/15 animate-float-particle"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-[30%] left-[85%] w-0.5 h-0.5 rounded-full bg-primary/20 animate-float-particle"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="absolute top-[80%] left-[25%] w-0.5 h-0.5 rounded-full bg-critical/10 animate-float-particle"
        style={{ animationDelay: "3s" }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
    </div>
  );
};

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`mb-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

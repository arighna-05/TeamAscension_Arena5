/**
 * WindowsLoader – A premium Windows 10/11 inspired loading animation.
 *
 * Props:
 *   size   – "sm" | "md" | "lg"  (default "md")
 *   white  – boolean (use white dots, for dark backgrounds)
 *   label  – string  (optional text below the loader)
 */
export default function WindowsLoader({ size = 'md', white = false, label }) {
  const sizeClass = size === 'sm' ? 'loader-sm' : size === 'lg' ? 'loader-lg' : '';
  const colorClass = white ? 'loader-white' : 'loader-primary';

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className={`windows-loader ${sizeClass} ${colorClass}`}>
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      {label && (
        <p className={`font-label-bold text-sm tracking-wide ${white ? 'text-white/70' : 'text-on-surface-variant'}`}>
          {label}
        </p>
      )}
    </div>
  );
}

interface AuthHeaderProps {
  kicker: string;
  title: string;
  children?: React.ReactNode;
}

/** Shared heading block for the four auth screens. */
export function AuthHeader({ kicker, title, children }: AuthHeaderProps) {
  return (
    <div className="mb-8">
      <p className="label-mono">{kicker}</p>
      <h1 className="mt-2.5 text-[1.85rem] font-semibold tracking-[-0.03em]">
        {title}
      </h1>
      {children && (
        <p className="mt-2.5 text-sm text-muted-foreground">{children}</p>
      )}
    </div>
  );
}

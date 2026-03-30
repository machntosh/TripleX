interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <header className="bg-teal-600 text-white px-4 pt-12 pb-4 flex items-end justify-between">
      <div>
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-teal-100 text-sm mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </header>
  );
}

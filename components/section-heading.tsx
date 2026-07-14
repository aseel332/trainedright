export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="font-display text-[26px] font-black uppercase leading-none text-white md:text-[34px]">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-r from-brand to-transparent" />
    </div>
  );
}

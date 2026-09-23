// A string as the site prints it: the dot in gold ahead of the label.
export default function Tld({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="text-gold">.</span>
      {children}
    </>
  );
}

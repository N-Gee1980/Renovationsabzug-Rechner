import { useSponsors } from '../hooks/useSponsors';

export const Sponsors = () => {
  const { sponsors } = useSponsors();

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-slate-50 border-t border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-center text-sm font-semibold text-slate-600 mb-8 uppercase tracking-wide">
          Unsere Partner
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-center justify-center">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center group hover:opacity-75 transition-opacity duration-200"
              title={sponsor.name}
            >
              <img
                src={sponsor.image_url}
                alt={sponsor.alt_text || sponsor.name}
                className="max-h-24 max-w-full object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

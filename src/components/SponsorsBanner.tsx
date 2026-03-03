import { useSponsors } from '../hooks/useSponsors';

export const SponsorsBanner = () => {
  const { sponsors } = useSponsors();

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <div className="py-6 bg-white border-t border-slate-200 print:hidden">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide">
          Partner
        </p>
        <div className="flex flex-wrap gap-6 items-center">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 hover:opacity-70 transition-opacity duration-200"
              title={sponsor.name}
            >
              <img
                src={sponsor.image_url}
                alt={sponsor.alt_text || sponsor.name}
                className="max-h-12 max-w-[120px] object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

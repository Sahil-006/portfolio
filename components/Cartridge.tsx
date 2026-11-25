import type { Favourite } from "@/data/favourites";

// A clear, tinted game cartridge drawn in CSS: grip ridges, a paper label,
// and the circuit board with gold contacts visible through the plastic.
export default function Cartridge({
  item,
  inserted,
  onInsert,
}: {
  item: Favourite;
  inserted: boolean;
  onInsert: () => void;
}) {
  const t = item.tint;
  return (
    <button
      type="button"
      onClick={onInsert}
      aria-pressed={inserted}
      aria-label={`${item.title}, ${item.year}. Insert cartridge`}
      className="group relative block w-full text-left transition-transform duration-200 ease-out hover:-translate-y-2 focus-visible:-translate-y-2 aria-pressed:translate-y-1.5"
    >
      <div
        className="relative aspect-[5/6] overflow-hidden rounded-b-[10px] rounded-t-[16px] transition-shadow duration-300"
        style={{
          // Notch cut into the top-right corner, like a real cartridge.
          clipPath: "polygon(0 0, 84% 0, 100% 9%, 100% 100%, 0 100%)",
          background: `linear-gradient(160deg, ${t}55, ${t}22 45%, ${t}33)`,
          boxShadow: inserted
            ? `inset 0 0 0 1.5px ${t}cc, 0 0 40px -6px ${t}88`
            : `inset 0 0 0 1px ${t}66, inset 0 1px 0 rgb(255 255 255 / 0.25)`,
        }}
      >
        {/* Circuit board seen through the plastic */}
        <div
          aria-hidden
          className="absolute inset-x-[14%] bottom-0 top-[46%] rounded-t-sm"
          style={{
            background:
              "linear-gradient(90deg, transparent 0 18%, rgb(201 154 74 / 0.35) 18% 19%, transparent 19% 62%, rgb(201 154 74 / 0.35) 62% 63%, transparent 63%), #0c2a2acc",
          }}
        >
          <div className="absolute left-[30%] top-[18%] h-[22%] w-[34%] rounded-[2px] bg-[#15171c]" />
          {/* Gold contacts */}
          <div
            className="absolute inset-x-[6%] bottom-[5%] h-[16%]"
            style={{
              background: "repeating-linear-gradient(90deg, #d4a94e 0 5%, transparent 5% 9%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Grip ridges */}
        <div
          aria-hidden
          className="absolute inset-x-[10%] top-[5%] h-[9%]"
          style={{ background: `repeating-linear-gradient(180deg, ${t}66 0 2px, transparent 2px 6px)` }}
        />

        {/* Label sticker */}
        <div className="absolute inset-x-[9%] top-[17%] h-[38%] overflow-hidden rounded-[5px] bg-[#eef1f5] p-[8%] shadow-[0_1px_0_rgb(0_0_0/0.25)]">
          <div className="absolute inset-x-0 top-0 h-[14%]" style={{ background: t }} aria-hidden />
          <p
            className="mt-[10%] font-display text-[clamp(0.95rem,2.4vw,1.25rem)] font-bold leading-[1.02] tracking-tight text-[#14161b]"
            style={{ fontVariationSettings: '"wdth" 82' }}
          >
            {item.title}
          </p>
          <p className="mt-1 text-[11px] leading-tight text-[#14161b]/60">{item.year}</p>
        </div>

        {/* Glare */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgb(255 255 255 / 0.16) 38%, transparent 46%, rgb(255 255 255 / 0.07) 54%, transparent 60%)",
          }}
        />
      </div>
    </button>
  );
}

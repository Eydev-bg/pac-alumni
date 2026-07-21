import { TbPlugConnected } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * StatStrip — the four hero stat cards. Props-driven so wiring real numbers
 * later is just passing a fetched `stats` prop; the default below is placeholder
 * data shaped like the future API response.
 *
 * Each card carries a small "live" indicator signalling the value is API-bound.
 */
// TODO: API — replace defaults with fetched aggregate stats.
const DEFAULT_STATS = [
  { id: "verified_alumni", value: "4,820", label: "Verified alumni" },
  { id: "employment_rate", value: "87", suffix: "%", label: "Employment rate" },
  { id: "board_passing_rate", value: "91", suffix: "%", label: "Board passing rate" },
  { id: "degree_programs", value: "24", label: "Degree programs" },
];

export default function StatStrip({ stats = DEFAULT_STATS }) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="rounded-[11px] border border-gold-500/[0.28] bg-navy-800/55 p-3.5"
        >
          <div className="text-[23px] font-extrabold leading-none text-gold-300" style={SERIF}>
            {stat.value}
            {stat.suffix && <span className="text-[15px]">{stat.suffix}</span>}
          </div>
          <div className="mt-1.5 text-[10.5px] leading-snug text-[#aebbd6]">
            {stat.label}
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[8px] text-[#8ea0c4]">
            <TbPlugConnected aria-hidden="true" className="h-2.5 w-2.5" /> live
          </div>
        </div>
      ))}
    </div>
  );
}

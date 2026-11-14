import { cx } from "@/lib/ui/cx";

const SIZES = {
  lg: { logo: 96, text: "text-[34px] leading-[41px]" },
  md: { logo: 64, text: "text-[28px] leading-[34px]" },
} as const;

// Spec §3.4: logo + "Kim Bun" in the rounded font, weight 800, -0.02em.
export function BrandMark({
  size = "lg",
  tagline,
  heading = true,
}: {
  size?: "lg" | "md";
  tagline?: string;
  heading?: boolean;
}) {
  const s = SIZES[size];
  const wordmark = cx(
    "font-rounded font-extrabold tracking-[-0.02em] text-ink",
    s.text,
  );
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <img
        src="/icons/icon.svg"
        alt=""
        width={s.logo}
        height={s.logo}
        className="rounded-[22%] shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=night]:opacity-80 in-data-[theme=night]:shadow-none"
      />
      {heading ? (
        <h1 className={wordmark}>Kim Bun</h1>
      ) : (
        <p className={wordmark}>Kim Bun</p>
      )}
      {tagline && <p className="text-base text-muted">{tagline}</p>}
    </div>
  );
}

import Image from "next/image";

type TeamHeaderProps = {
  team: "seahawks" | "patriots";
  label: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

const TEAM_IMAGES = {
  seahawks: "/teams/seahawks.svg",
  patriots: "/teams/patriots.svg",
} as const;

const TeamHeader = ({
  team,
  label,
  orientation = "horizontal",
  className = "",
}: TeamHeaderProps) => {
  const isVertical = orientation === "vertical";

  return (
    <div
      className={`flex items-center justify-center gap-2 bg-nfl-charcoal text-white ${className}`}
      aria-label={`${label} team`}
    >
      <Image
        src={TEAM_IMAGES[team]}
        alt=""
        width={40}
        height={40}
        className="shrink-0"
        aria-hidden
      />
      <span
        className={`font-bold uppercase tracking-wider text-sm whitespace-nowrap ${
          isVertical ? "rotate-[-90deg] origin-center" : ""
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export default TeamHeader;

import { Apple, Beef, Carrot, Droplet, Egg, Fish, Leaf, Milk, Wheat, type LucideIcon } from "lucide-react";
import type { CategoryId } from "@/lib/ingredients";
import { TONE, type Tone } from "./ui";

// Une couleur du logo par famille d'ingrédients.
export const CATEGORY_STYLE: Record<CategoryId, { icon: LucideIcon; tone: Tone }> = {
  viande: { icon: Beef, tone: "cherry" },
  poisson: { icon: Fish, tone: "lagoon" },
  legume: { icon: Carrot, tone: "herb" },
  fruit: { icon: Apple, tone: "cherry" },
  laitier: { icon: Milk, tone: "lagoon" },
  feculent: { icon: Wheat, tone: "sun" },
  condiment: { icon: Droplet, tone: "sun" },
  epice: { icon: Leaf, tone: "herb" },
  autre: { icon: Egg, tone: "neutral" },
};

type Props = {
  category: CategoryId;
  size?: "sm" | "md";
  /** Sur un fond déjà coloré : pastille blanche pour rester lisible. */
  onColor?: boolean;
};

export function CategoryIcon({ category, size = "md", onColor }: Props) {
  const { icon: Icon, tone } = CATEGORY_STYLE[category];
  const colors = onColor ? `bg-surface ${TONE[tone].split(" ")[1]}` : TONE[tone];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${colors} ${size === "sm" ? "size-8" : "size-10"}`}
    >
      <Icon className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}

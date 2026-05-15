import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Sub-sahifa header'i: orqaga tugmasi + sarlavha.
 * Settings sub-route'larida ishlatiladi.
 */
export function SubHeader({
  back,
  kicker,
  title,
}: {
  back: string;
  kicker?: string;
  title: string;
}) {
  return (
    <header className="px-5 pt-10 pb-5">
      <div className="flex items-center gap-2 -ml-2">
        <Link
          to={back}
          aria-label="Orqaga"
          className="press grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {kicker && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {kicker}
          </p>
        )}
      </div>
      <h1 className="mt-1 font-display text-[26px] leading-tight font-semibold tracking-tight">
        {title}
      </h1>
    </header>
  );
}

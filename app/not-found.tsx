import { ButtonLink } from "@/components/ui";

/**
 * Mostly reached by a guest whose link has been taken back or mistyped, so it
 * says the same thing either way: which of the two it was is not their
 * business, and there is nothing here for them to do about it.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <p className="font-display text-2xl text-pink">This link is not working</p>
      <p className="hand mt-3 text-browned">
        it may have been taken back, or copied down wrong
      </p>
      <p className="mt-6 max-w-xs text-[0.95rem] text-muted">
        If somebody shared a recipe book with you, ask them to send the link
        again.
      </p>
      <ButtonLink href="/box/all" variant="secondary" className="mt-7">
        Go to the recipe box
      </ButtonLink>
    </div>
  );
}

import { ButtonLink } from "@/components/ui";

/** Inside the app, so the tabs stay put and there is always a way back. */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-2xl text-pink">We cannot find that</p>
      <p className="hand mt-3 text-browned">
        it may have been thrown out, or never existed
      </p>
      <ButtonLink href="/box" variant="secondary" className="mt-7">
        Back to the box
      </ButtonLink>
    </div>
  );
}

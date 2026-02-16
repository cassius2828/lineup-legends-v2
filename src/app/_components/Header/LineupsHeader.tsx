import { ButtonLink } from "../ui/Button";

const LineupsHeader = ({
  title,
  description,
  exploreLink,
  createLink,
  exploreLinkText,
  createLinkText,
}: {
  title: string;
  description: string;
  exploreLink: string;
  createLink: string;
  exploreLinkText: string;
  createLinkText: string;
}) => {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-foreground/60">{description}</p>
      </div>
      <div className="flex gap-3">
        <ButtonLink href={exploreLink} color="white">
          {exploreLinkText}
        </ButtonLink>
        <ButtonLink href={createLink} color="gold">
          {createLinkText}
        </ButtonLink>
      </div>
    </div>
  );
};
export default LineupsHeader;

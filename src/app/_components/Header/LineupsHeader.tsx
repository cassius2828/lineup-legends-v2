import { ButtonLink } from "../common/ui/Button";

const LineupsHeader = ({
  title,
  description,
  exploreLink,
  createLink,
  exploreLinkText,
  createLinkText,
  extraLinks,
}: {
  title: string;
  description: string;
  exploreLink: string;
  createLink: string;
  exploreLinkText: string;
  createLinkText: string;
  extraLinks?: { href: string; label: string }[];
}) => {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-foreground text-3xl font-bold">{title}</h1>
        <p className="text-foreground/60 mt-1">{description}</p>
      </div>
      <div className="flex gap-3">
        {exploreLinkText && (
          <ButtonLink href={exploreLink} color="white">
            {exploreLinkText}
          </ButtonLink>
        )}
        {extraLinks?.map((link) => (
          <ButtonLink key={link.href} href={link.href} color="white">
            {link.label}
          </ButtonLink>
        ))}
        {createLinkText && (
          <ButtonLink href={createLink} color="gold">
            {createLinkText}
          </ButtonLink>
        )}
      </div>
    </div>
  );
};
export default LineupsHeader;

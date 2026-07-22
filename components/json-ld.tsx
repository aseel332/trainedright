/**
 * Renders a JSON-LD structured-data block. The `<` escape stops any
 * user-authored text (bios, review quotes) from closing the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

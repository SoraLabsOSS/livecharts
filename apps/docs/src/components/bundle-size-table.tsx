import sizes from "@/data/bundle-sizes.json";

function formatKb(bytes: number) {
  return `${(bytes / 1024).toFixed(bytes >= 10_240 ? 0 : 1)} KB`;
}

/**
 * Auto-filled from `livecharts` build (`measure-bundle` → bundle-sizes.json).
 */
export function BundleSizeTable() {
  return (
    <div className="not-prose my-4 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-fd-border border-b">
            <th className="py-2 pr-4 font-medium">Import</th>
            <th className="py-2 pr-4 font-medium">Minified</th>
            <th className="py-2 pr-4 font-medium">Gzip</th>
            <th className="py-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sizes.entries.map((row) => (
            <tr className="border-fd-border border-b" key={row.import}>
              <td className="py-2 pr-4">
                <code className="text-[0.8125rem]">{row.import}</code>
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {row.min ?? formatKb(row.bytes)}
              </td>
              <td className="py-2 pr-4 font-medium tabular-nums">
                {row.gzip ?? formatKb(row.gzipBytes)}
              </td>
              <td className="py-2 text-fd-muted-foreground">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-fd-muted-foreground text-xs">
        Measured from published ESM build ({sizes.method}). v{sizes.version} ·{" "}
        React / Vue are peer dependencies and are not included.
      </p>
    </div>
  );
}

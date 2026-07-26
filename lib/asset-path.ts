// GitHub Pages serves the site from /<repo-name>/. next/image in unoptimized
// mode (see next.config.ts) does not auto-prepend basePath to local /public
// sources, so any <Image src="/foo.png"> must be wrapped with this helper.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

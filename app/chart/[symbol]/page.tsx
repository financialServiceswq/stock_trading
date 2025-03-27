import { generateStaticParams } from "./staticParams";
export { generateStaticParams };

import ChartPage from "./ChartPage"; // ✅ This should match the actual file name exactly.

export default function Page({ params }: { params: { symbol: string } }) {
  return <ChartPage params={params} />;
}

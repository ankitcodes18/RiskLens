import { Suspense } from "react";
import FullRiskMap from "@/components/forecast/FullRiskMap";
import type { LocationSource, NormalizedLocation } from "@/types/forecast";

const DEFAULT_LOCATION: NormalizedLocation = {
  lat: 51.5074,
  lon: -0.1278,
  name: "London",
  region: "Greater London",
  country: "United Kingdom",
  countryCode: "GB",
  timezone: "Europe/London",
  source: "search",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function getInitialLocation(
  params: Record<string, string | string[] | undefined>
): NormalizedLocation {
  const lat = Number(getParam(params, "lat"));
  const lon = Number(getParam(params, "lon"));
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return DEFAULT_LOCATION;
  }

  const source = getParam(params, "source");
  const validSource: LocationSource =
    source === "gps" ||
    source === "search" ||
    source === "map" ||
    source === "manual"
      ? source
      : "map";

  return {
    lat,
    lon,
    name: getParam(params, "name")?.slice(0, 120) || "Selected location",
    region: getParam(params, "region"),
    country: getParam(params, "country"),
    timezone: getParam(params, "timezone") || "UTC",
    source: validSource,
  };
}

async function InnerMapContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const layer = getParam(params, "layer");
  const initialLayer =
    layer === "flood" || layer === "water" ? layer : "heat";

  return (
    <FullRiskMap
      initialLocation={getInitialLocation(params)}
      initialLayer={initialLayer}
    />
  );
}

export default function InnerMapPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9] text-sm text-slate-500">
          Loading map…
        </main>
      }
    >
      <InnerMapContent searchParams={searchParams} />
    </Suspense>
  );
}
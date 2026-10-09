import ForecastDashboard from "@/components/ForecastDashboard";

export const metadata = {
  title: "Forecast & Trends — RiskLens",
  description:
    "View predicted climate risks, weather conditions, and multi-day hazard trajectory modeling worldwide.",
};

export default function PredictionsPage() {
  return <ForecastDashboard />;
}

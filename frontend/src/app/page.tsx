import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RiskMapSection from "@/components/RiskMapSection";
import ForecastSection from "@/components/ForecastSection";
import AssistantSection from "@/components/AssistantSection";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <RiskMapSection />
        <ForecastSection />
        <AssistantSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

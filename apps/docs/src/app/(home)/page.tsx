import { HomeCatalog } from "@/components/home/catalog";
import { HomeCta } from "@/components/home/cta";
import { HomeFooter } from "@/components/home/footer";
import { HomeHero } from "@/components/home/hero";
import { HomeNavbar } from "@/components/home/navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-fd-background text-fd-foreground">
      <HomeNavbar />
      <HomeHero />
      <HomeCatalog />
      <HomeCta />
      <HomeFooter />
    </div>
  );
}

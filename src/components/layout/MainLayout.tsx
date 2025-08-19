
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieBanner from "@/components/common/CookieBanner";
import FishingReminderPopup from "../common/FishingReminderPopup";

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
      <FishingReminderPopup />
      <CookieBanner />
    </div>
  );
}

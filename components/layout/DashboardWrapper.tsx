"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { SearchProvider } from "@/context/SearchContext";
import { SidebarProvider } from "@/context/SidebarContext";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider>
      <SearchProvider>
        <div className="min-h-screen bg-slate-50/50">
          <Sidebar />
          <Header />
          <main className="md:ml-72 min-h-screen transition-all duration-300 ease-in-out">
            <PageTransition>
              <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                {children}
              </div>
            </PageTransition>
          </main>
        </div>
      </SearchProvider>
    </SidebarProvider>
  );
}

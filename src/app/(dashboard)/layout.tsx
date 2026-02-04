import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // "h-screen overflow-hidden" es lo que impide que la página entera haga scroll.
    // Solo el <main> hará scroll.
    <div className="flex h-screen overflow-hidden bg-[#F9F8F6]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
import Link from "next/link";

const menuItems = [
  { name: "Dashboard", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Corrections", href: "/admin/corrections" },
  { name: "Audit", href: "/admin/audit" },
  { name: "Security", href: "/admin/security" },
  { name: "Appointments", href: "/admin/appointments" },
  { name: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white shadow-xl flex flex-col">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-cyan-400">
            VoiceVault Med
          </h1>

          <p className="text-slate-300 text-sm mt-2">
            Administrator Portal
          </p>
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-slate-200 transition hover:bg-cyan-600 hover:text-white"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-700 p-5">
          <div className="rounded-lg bg-slate-800 p-4">
            <p className="font-semibold">System Status</p>

            <p className="text-green-400 mt-2">
              ● Secure Connection
            </p>

            <p className="text-slate-400 text-sm mt-1">
              Zero Trust Enabled
            </p>
          </div>

          <button className="mt-5 w-full rounded-lg bg-red-600 py-2 font-medium hover:bg-red-700">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="flex items-center justify-between border-b bg-white px-8 py-5 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              VoiceVault Med Admin
            </h2>

            <p className="text-slate-500 text-sm">
              Zero Trust Healthcare Management System
            </p>
          </div>

          <div className="rounded-full bg-cyan-600 px-5 py-2 font-medium text-white">
            Administrator
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
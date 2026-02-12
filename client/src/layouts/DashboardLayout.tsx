import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { handleLogout } from "@/lib/auth"; // Ensure this clears localStorage and redirects to /login
import {
  LayoutDashboard,
  BarChart2,
  Package,
  Truck,
  Users,
  Settings,
  Bell,
  PanelLeft,
  Menu,
  X,
  FileUp,
  Brain,
  LogOut, // Added LogOut icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsModal } from "@/components/settings/SettingsModal";

// Interface for navigation item props
interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isExpanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
                                           to,
                                           icon: Icon,
                                           label,
                                           isExpanded,
                                         }) => (
    <NavLink
        to={to}
        className={({ isActive }: { isActive: boolean }) =>
            cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-white hover:bg-zinc-700/50",
                isActive && "bg-zinc-700 text-white",
                !isExpanded && "justify-center"
            )
        }
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span
          className={cn(
              "overflow-hidden transition-all whitespace-nowrap",
              isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
          )}
      >
      {label}
    </span>
    </NavLink>
);

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/forecast", label: "AI Forecast", icon: Brain },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Package },
  {to:"/prediction",label:"Prediction",icon:Package},
  { to: "/logistics", label: "Logistics", icon: Truck },
  { to: "/import", label: "Import / Export", icon: FileUp },
  { to: "/users", label: "Users", icon: Users },
];

/**
 * MOBILE SIDEBAR
 */
const MobileSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  return (
      <div
          className={cn(
              "fixed inset-0 z-50 bg-black/60 transition-opacity md:hidden",
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
      >
        <div
            className={cn(
                "absolute left-0 top-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Truck className="h-6 w-6 text-cyan-400" />
              <span>SupplyChain AI</span>
            </NavLink>
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start p-2 text-sm font-medium">
              {navItems.map((item) => (
                  <NavItem key={item.to} {...item} isExpanded={true} />
              ))}
            </nav>
          </div>

          {/* Mobile Sign Out Button */}
          <div className="border-t border-zinc-800 p-4">
            <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
  );
};

/**
 * MAIN DASHBOARD LAYOUT
 */
const DashboardLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSettingsSave = () => {
    setIsSettingsModalOpen(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
      <>
        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onSettingsSave={handleSettingsSave}
        />

        <div
            className={cn(
                "grid min-h-screen w-full bg-zinc-950 text-white transition-[grid-template-columns] duration-300 ease-in-out",
                isSidebarExpanded
                    ? "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
                    : "md:grid-cols-[68px_1fr]"
            )}
        >
          {/* --- DESKTOP SIDEBAR --- */}
          <div className="hidden border-r border-zinc-800 bg-zinc-900/50 md:block">
            <div className="flex h-full max-h-screen flex-col">
              {/* Header */}
              <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4 lg:h-[60px]">
                <NavLink
                    to="/"
                    className="flex items-center gap-2 font-semibold overflow-hidden"
                >
                  <Truck className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                  <span
                      className={cn(
                          "whitespace-nowrap transition-all duration-300",
                          isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                      )}
                  >
                  SupplyChain AI
                </span>
                </NavLink>
                <button
                    onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    className="p-2 rounded-md hover:bg-zinc-700/50"
                >
                  <PanelLeft
                      className={cn(
                          "h-5 w-5 transition-transform",
                          !isSidebarExpanded && "rotate-180"
                      )}
                  />
                </button>
              </div>

              {/* Navigation Scroll Area */}
              <div className="flex-1 overflow-y-auto pt-2">
                <nav className="grid items-start px-2 text-sm font-medium">
                  {navItems.map((item) => (
                      <NavItem
                          key={item.to}
                          {...item}
                          isExpanded={isSidebarExpanded}
                      />
                  ))}
                </nav>
              </div>

              {/* --- DESKTOP SIGN OUT BUTTON --- */}
              <div className="mt-auto border-t border-zinc-800 p-4">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500",
                        !isSidebarExpanded && "justify-center"
                    )}
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  {isSidebarExpanded && (
                      <span className="whitespace-nowrap">Sign Out</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* --- MAIN CONTENT AREA --- */}
          <div className="flex flex-col h-screen overflow-hidden">
            <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 lg:h-[60px] lg:px-6">
              <button
                  className="md:hidden p-2 -ml-2"
                  onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="w-full flex-1"></div>
              <Bell className="h-5 w-5 text-zinc-400" />
              <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-1 rounded-full hover:bg-zinc-700/50"
                  title="Settings"
              >
                <Settings className="h-5 w-5 text-zinc-400" />
              </button>
            </header>

            <main className="flex-1 p-4 sm:p-6 bg-zinc-950 overflow-auto">
              <Outlet context={{ refreshKey }} />
            </main>
          </div>

          <MobileSidebar
              isOpen={isMobileSidebarOpen}
              onClose={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      </>
  );
};

export default DashboardLayout;
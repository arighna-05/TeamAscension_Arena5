import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SideNavBar() {
  const { currentUser } = useAuth();
  const navItems = [
    { name: "Dashboard", path: "/", icon: "dashboard" },
    { name: "Inventory", path: "/inventory", icon: "inventory_2" },
    { name: "Scanner", path: "/scanner", icon: "photo_camera" },
    { name: "Marketplace", path: "/marketplace", icon: "handshake" },
    { name: "Wallet", path: "/wallet", icon: "account_balance_wallet" },
    { name: "Settings", path: "/settings", icon: "settings" },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-stone-100 dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 pt-20 z-40">
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 mb-2">
        <div className="text-xl font-black text-[#4A6741] dark:text-stone-100">
          AgriLink
        </div>
        <div className="font-headline-sm text-sm text-stone-500">
          Digital Farmhand
        </div>
      </div>
      <nav className="flex flex-col gap-2 p-6 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out font-body-md text-sm ${
                isActive
                  ? "bg-stone-200/50 dark:bg-stone-800/50 text-[#4A6741] dark:text-stone-50 font-bold border-r-4 border-[#4A6741]"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-6 border-t border-stone-200/50 dark:border-stone-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-300 overflow-hidden border-2 border-white dark:border-stone-900 shadow-sm flex items-center justify-center">
            {currentUser?.photoURL ? (
              <img
                alt="Farmer Profile"
                className="w-full h-full object-cover"
                src={currentUser.photoURL}
              />
            ) : (
              <span className="material-symbols-outlined text-stone-500">person</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline-sm text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
              {currentUser?.displayName || "Farmer"}
            </p>
            <p className="font-body-sm text-xs text-stone-500 truncate">
              {currentUser?.email || "Operator"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

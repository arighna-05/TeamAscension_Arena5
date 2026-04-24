import { NavLink } from "react-router-dom";

export default function BottomNavBar() {
  const navItems = [
    { name: "Home", path: "/", icon: "home" },
    { name: "Co-Pilot", path: "/inventory", icon: "mic" },
    { name: "Scanner", path: "/scanner", icon: "center_focus_weak" },
    { name: "Market", path: "/marketplace", icon: "storefront" },
    { name: "Wallet", path: "/wallet", icon: "account_balance_wallet" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 rounded-t-2xl border-t border-white/30 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xl dark:border-stone-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] h-20 flex justify-around items-center px-4 pb-safe font-headline-sm text-[10px] font-bold uppercase tracking-wider">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-colors group px-4 py-2 ${
              isActive
                ? "bg-[#4A6741] text-white rounded-xl shadow-inner scale-90 transition-transform duration-150"
                : "text-stone-500 dark:text-stone-400 hover:text-[#4A6741] dark:hover:text-[#6a8d5e]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined mb-1 ${
                  isActive ? "" : "group-hover:scale-110 transition-transform"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

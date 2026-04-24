import { Outlet } from "react-router-dom";
import TopAppBar from "./TopAppBar";
import SideNavBar from "./SideNavBar";
import BottomNavBar from "./BottomNavBar";

export default function Layout() {
  return (
    <>
      <TopAppBar />
      <SideNavBar />
      <main className="pt-24 pb-28 lg:pb-8 pl-0 lg:pl-64 min-h-screen px-4 md:px-margin gradient-mesh">
        <Outlet />
      </main>
      <BottomNavBar />
    </>
  );
}

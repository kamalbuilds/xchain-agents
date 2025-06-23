import { AppHeader } from "@/components/app-header";
import { EventsSidebar } from "@/components/events-sidebar";
import { AgentsSidebar } from "@/components/agents-sidebar";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
    const location = useLocation();
    const isChat = location.pathname.includes('chat');

    return (
        <div className="w-full h-screen flex flex-col">
            <AppHeader />
            <div className="flex-1 flex min-h-0">
                {/* AI Agents Sidebar (Left) */}
                <div className="w-[240px] shrink-0 border-r border-white/[0.08]">
                    <AgentsSidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <Outlet />
                </div>

                {/* Events Sidebar (Right) - Only show in chat */}
                {isChat && (
                    <div className="w-[240px] shrink-0 border-l border-white/[0.08]">
                        <EventsSidebar />
                    </div>
                )}
            </div>
        </div>
    );
}

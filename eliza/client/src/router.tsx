import { createBrowserRouter } from "react-router-dom";
import Agents from "./Agents";
import Layout from "./Layout";
import Chat from "./Chat";
import Analytics from "./pages/analytics";
import Portfolio from "./pages/portfolio";
import AgentsDashboard from "./pages/agents-dashboard";
import MarketData from "./pages/market-data";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Agents />,
    },
    {
        path: "/app",
        element: <Layout />,
        children: [
            {
                path: "chat/:agentId",
                element: <Chat />,
            },
            {
                path: "analytics",
                element: <Analytics />,
            },
            {
                path: "portfolio",
                element: <Portfolio />,
            },
            {
                path: "agents",
                element: <AgentsDashboard />,
            },
            {
                path: "market-data",
                element: <MarketData />,
            },
        ],
    },
]);

import { MessageSquare, LineChart, Briefcase, ChevronDown } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import logo from "../assets/logo.svg";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
    const location = useLocation();
    const { agentId } = useParams();
    const { connected, publicKey, disconnect } = useWallet();

    const currentAgentId = agentId || 'acc5e818-17b3-0509-8411-89882fdb9ce3';

    const menuItems = [
        { icon: MessageSquare, label: "Chat", path: `/app/chat/${currentAgentId}` },
        { icon: LineChart, label: "Analytics", path: "/app/analytics" },
        { icon: Briefcase, label: "Portfolio", path: "/app/portfolio" },
    ];

    // Format public key for display
    const formattedAddress = publicKey?.toBase58()
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : "No wallet connected";

    return (
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/[0.08] bg-background">
            <div className="flex items-center">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-sm font-semibold gradient-text mr-8 hover:opacity-90"
                >
                    <img src={logo} alt="XChainAgents Logo" className="h-6 w-6" />
                    <span>XChainAgents</span>
                </Link>
                <nav className="flex items-center gap-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path.includes('chat')
                            ? location.pathname.includes('chat')
                            : location.pathname.includes(item.path.split('/').pop() || '');

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                replace={false}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors
                                    ${isActive
                                        ? 'text-foreground bg-white/[0.06]'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div>
                {!connected ? (
                    <WalletMultiButton />
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/80 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium">{formattedAddress}</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500 cursor-pointer"
                                onClick={() => disconnect()}
                            >
                                Disconnect
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./styles/wallet.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import { SolanaWalletProvider } from "./components/providers/wallet-provider";
import App from "./App";

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <SolanaWalletProvider>
                <App />
            </SolanaWalletProvider>
        </QueryClientProvider>
    </StrictMode>
);

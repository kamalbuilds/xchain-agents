import { LineChart as LucideLineChart, BarChart as LucideBarChart, PieChart as LucidePieChart, ArrowUp, ArrowDown, Activity } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatCardProps {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
    const isPositive = change >= 0;

    return (
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-muted-foreground">{title}</span>
                <div className="p-2 rounded-md bg-white/[0.03]">
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{value}</span>
                <span className={`text-sm flex items-center gap-0.5 ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                    {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(change)}%
                </span>
            </div>
        </div>
    );
}

// Dummy data for charts
const tvlData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    tvl: 4000000000 + Math.random() * 2000000000,
    volume: 800000000 + Math.random() * 400000000,
}));

const protocolData = [
    { name: 'Jupiter', value: 26.13 },
    { name: 'Kamino', value: 31.53 },
    { name: 'Jito', value: 12.47 },
    { name: 'Raydium', value: 19.69 },
    { name: 'Others', value: 4.20 },
];

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 border border-white/[0.08] p-3 rounded-lg shadow-lg backdrop-blur-sm">
                <p className="text-sm font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm text-muted-foreground">
                        {entry.name}: ${(entry.value / 1e9).toFixed(2)}B
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Analytics() {
    const stats = [
        { title: "Total Value Locked", value: "$5.2B", change: 2.5, icon: <LucideLineChart className="h-4 w-4 text-blue-500" /> },
        { title: "24h Volume", value: "$890M", change: -1.2, icon: <LucideBarChart className="h-4 w-4 text-purple-500" /> },
        { title: "Active Positions", value: "1,234", change: 5.8, icon: <LucidePieChart className="h-4 w-4 text-green-500" /> },
        { title: "Protocol Revenue", value: "$12.3M", change: 3.7, icon: <Activity className="h-4 w-4 text-orange-500" /> },
    ];

    return (
        <div className="h-full flex flex-col p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Solana DeFi Ecosystem Analytics</h1>
                <div className="text-sm text-muted-foreground">Last updated: 5 minutes ago</div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* TVL Chart */}
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                    <h3 className="text-sm font-medium mb-4">TVL & Volume Over Time</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={tvlData}>
                                <defs>
                                    <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                                <YAxis
                                    stroke="rgba(255,255,255,0.5)"
                                    tickFormatter={(value) => `$${(value / 1e9).toFixed(1)}B`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="tvl"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#tvlGradient)"
                                    strokeWidth={2}
                                    name="TVL"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="volume"
                                    stroke="#60a5fa"
                                    fillOpacity={1}
                                    fill="url(#volumeGradient)"
                                    strokeWidth={2}
                                    name="Volume"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Protocol Distribution */}
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                    <h3 className="text-sm font-medium mb-4">Protocol Distribution</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={protocolData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {protocolData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Additional Chart */}
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                <h3 className="text-sm font-medium mb-4">Daily Protocol Revenue</h3>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tvlData.slice(-14)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                {tvlData.slice(-14).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`rgba(59, 130, 246, ${0.5 + (index / 28)})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

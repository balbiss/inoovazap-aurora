import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { TrendingUp } from "lucide-react";

const data = [
  { name: "Jan", atual: 4500, anterior: 3800 },
  { name: "Fev", atual: 5200, anterior: 4100 },
  { name: "Mar", atual: 4800, anterior: 4500 },
  { name: "Abr", atual: 6100, anterior: 4800 },
  { name: "Mai", atual: 7200, anterior: 5200 },
  { name: "Jun", atual: 8400, anterior: 5800 },
];

export function RevenueChart() {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Conversões</h3>
          <p className="text-sm text-muted-foreground">Comparativo mensal</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%, 0.1)", border: "1px solid hsl(142, 76%, 36%, 0.2)" }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(142, 76%, 36%)" }} />
          <span className="text-xs font-medium" style={{ color: "hsl(142, 76%, 36%)" }}>+44.8%</span>
        </div>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                <stop offset="100%" stopColor="hsl(188, 94%, 43%)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(226, 50%, 8%)",
                border: "1px solid hsl(217, 33%, 17%)",
                borderRadius: "12px",
                boxShadow: "0 25px 50px -12px hsl(234, 89%, 74%, 0.1)",
              }}
              labelStyle={{ color: "hsl(210, 40%, 98%)" }}
              itemStyle={{ color: "hsl(215, 20%, 65%)" }}
            />
            <Line
              type="monotone"
              dataKey="anterior"
              stroke="hsl(215, 20%, 45%)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Período anterior"
            />
            <Line
              type="monotone"
              dataKey="atual"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={{ fill: "hsl(188, 94%, 43%)", strokeWidth: 0, r: 4 }}
              activeDot={{ fill: "hsl(188, 94%, 43%)", strokeWidth: 0, r: 6 }}
              name="Período atual"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gradient-to-r from-neon-blue to-neon-cyan rounded" />
          <span className="text-sm text-muted-foreground">Atual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-muted-foreground rounded" style={{ borderStyle: 'dashed' }} />
          <span className="text-sm text-muted-foreground">Anterior</span>
        </div>
      </div>
    </GlassCard>
  );
}

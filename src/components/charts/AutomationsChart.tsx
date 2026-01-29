import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";

const data = [
  { name: "Boas-vindas", execucoes: 4500, sucesso: 4320 },
  { name: "Follow-up", execucoes: 3200, sucesso: 2980 },
  { name: "Lembretes", execucoes: 2800, sucesso: 2650 },
  { name: "Promoções", execucoes: 1900, sucesso: 1780 },
  { name: "Suporte", execucoes: 2400, sucesso: 2280 },
];

export function AutomationsChart() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance de Automações</h3>
        <p className="text-sm text-muted-foreground">Execuções vs taxa de sucesso</p>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                <stop offset="100%" stopColor="hsl(188, 94%, 43%)" />
              </linearGradient>
              <linearGradient id="barSuccessGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-15}
              textAnchor="end"
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
              cursor={{ fill: "hsl(217, 33%, 17%, 0.3)" }}
            />
            <Bar 
              dataKey="execucoes" 
              fill="url(#barGradient)" 
              radius={[6, 6, 0, 0]}
              name="Execuções"
            />
            <Bar 
              dataKey="sucesso" 
              fill="url(#barSuccessGradient)" 
              radius={[6, 6, 0, 0]}
              name="Sucesso"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-b from-neon-blue to-neon-cyan" />
          <span className="text-sm text-muted-foreground">Execuções</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
          <span className="text-sm text-muted-foreground">Sucesso</span>
        </div>
      </div>
    </GlassCard>
  );
}

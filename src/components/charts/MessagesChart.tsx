import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";

const data = [
  { name: "Seg", mensagens: 1200, respostas: 980 },
  { name: "Ter", mensagens: 1890, respostas: 1540 },
  { name: "Qua", mensagens: 2400, respostas: 2100 },
  { name: "Qui", mensagens: 1980, respostas: 1720 },
  { name: "Sex", mensagens: 2780, respostas: 2340 },
  { name: "Sáb", mensagens: 1890, respostas: 1620 },
  { name: "Dom", mensagens: 1390, respostas: 1180 },
];

export function MessagesChart() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Mensagens da Semana</h3>
        <p className="text-sm text-muted-foreground">Volume de mensagens enviadas e respondidas</p>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMensagens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRespostas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(188, 94%, 43%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(188, 94%, 43%)" stopOpacity={0} />
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
            <Area
              type="monotone"
              dataKey="mensagens"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMensagens)"
              name="Mensagens"
            />
            <Area
              type="monotone"
              dataKey="respostas"
              stroke="hsl(188, 94%, 43%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRespostas)"
              name="Respostas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-blue" />
          <span className="text-sm text-muted-foreground">Mensagens</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-cyan" />
          <span className="text-sm text-muted-foreground">Respostas</span>
        </div>
      </div>
    </GlassCard>
  );
}

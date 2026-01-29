import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { day: "Seg", mensagens: 1200, leads: 85 },
  { day: "Ter", mensagens: 1850, leads: 120 },
  { day: "Qua", mensagens: 1600, leads: 95 },
  { day: "Qui", mensagens: 2100, leads: 145 },
  { day: "Sex", mensagens: 2400, leads: 180 },
  { day: "Sáb", mensagens: 1800, leads: 110 },
  { day: "Dom", mensagens: 1350, leads: 75 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-slate-400 text-xs font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="text-slate-300">{entry.name}: </span>
            <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ActivityChart() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Atividade Semanal</h3>
        <p className="text-sm text-slate-400">Mensagens e leads dos últimos 7 dias</p>
      </div>
      
      <div className="h-[280px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMensagens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(188, 94%, 43%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(188, 94%, 43%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(270, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(270, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(217, 33%, 17%)" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              dx={-10}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="mensagens"
              name="Mensagens"
              stroke="hsl(188, 94%, 43%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMensagens)"
            />
            
            <Area
              type="monotone"
              dataKey="leads"
              name="Leads"
              stroke="hsl(270, 91%, 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLeads)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span className="text-xs text-slate-400">Mensagens</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-400" />
          <span className="text-xs text-slate-400">Leads</span>
        </div>
      </div>
    </div>
  );
}

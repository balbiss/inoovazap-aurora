import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";

const data = [
  { name: "Ativas", value: 342, color: "hsl(217, 91%, 60%)" },
  { name: "Pendentes", value: 128, color: "hsl(45, 93%, 47%)" },
  { name: "Resolvidas", value: 856, color: "hsl(142, 76%, 36%)" },
  { name: "Arquivadas", value: 234, color: "hsl(215, 20%, 45%)" },
];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ConversationsChart() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <GlassCard className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Status das Conversas</h3>
        <p className="text-sm text-muted-foreground">Distribuição por status</p>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              innerRadius={40}
              paddingAngle={3}
              dataKey="value"
              stroke="transparent"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const contacts = [
  {
    id: 1,
    name: "Maria Silva",
    message: "Olá! Gostaria de agendar uma consulta...",
    status: "agendado",
    avatar: null,
  },
  {
    id: 2,
    name: "João Santos",
    message: "Qual o horário disponível para amanhã?",
    status: "pendente",
    avatar: null,
  },
  {
    id: 3,
    name: "Ana Costa",
    message: "Obrigada pelo atendimento!",
    status: "concluido",
    avatar: null,
  },
  {
    id: 4,
    name: "Pedro Oliveira",
    message: "Preciso remarcar minha consulta...",
    status: "pendente",
    avatar: null,
  },
  {
    id: 5,
    name: "Carla Mendes",
    message: "Confirmado para sexta-feira às 14h",
    status: "agendado",
    avatar: null,
  },
];

const statusConfig = {
  agendado: {
    label: "Agendado",
    className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  },
  pendente: {
    label: "Pendente",
    className: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  },
  concluido: {
    label: "Concluído",
    className: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGradientForName(name: string) {
  const gradients = [
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-emerald-500 to-teal-500",
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

export function RecentContacts() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Contatos Recentes</h3>
        <p className="text-sm text-slate-400">Últimas interações</p>
      </div>
      
      <div className="space-y-1">
        {contacts.map((contact, index) => {
          const status = statusConfig[contact.status as keyof typeof statusConfig];
          
          return (
            <div
              key={contact.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors duration-200 cursor-pointer",
                index !== contacts.length - 1 && "border-b border-white/5"
              )}
            >
              <Avatar className="w-10 h-10 shrink-0">
                {contact.avatar ? (
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                ) : null}
                <AvatarFallback 
                  className={cn(
                    "bg-gradient-to-br text-white text-xs font-medium",
                    getGradientForName(contact.name)
                  )}
                >
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {contact.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {contact.message}
                </p>
              </div>
              
              <span 
                className={cn(
                  "shrink-0 px-2 py-1 rounded-lg text-xs font-medium",
                  status.className
                )}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

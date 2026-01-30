import { useState } from "react";
import { Check, CreditCard, Sparkles, Loader2, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstance } from "@/hooks/useInstance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRICING_PLANS = [
    {
        id: "pro_monthly",
        name: "InoovaSaúde Pro",
        price: "R$ 189,90",
        interval: "mês",
        priceId: "price_1Sv6tL2EzlFM3oZJQesnvNsO",
        popular: true,
        features: [
            "Agenda Médica Ilimitada",
            "IA Brain para Resumos Médicos",
            "Notificações WhatsApp Ilimitadas",
            "Lembretes Automáticos",
            "Suporte Prioritário",
        ],
    },
    {
        id: "pro_quarterly",
        name: "InoovaSaúde Pro Trimestral",
        price: "R$ 499,90",
        interval: "3 meses",
        priceId: "price_1Sv6wX2EzlFM3oZJCTN66716",
        save: "Economize R$ 70",
        features: [
            "Tudo do Plano Mensal",
            "Faturamento Único Trimestral",
            "Preço Reduzido",
            "Ideal para Clínicas Consolidadas",
        ],
    },
];

export function SubscriptionSettings() {
    const { data: rawInstance, isLoading } = useInstance();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    // Cast to any to access new Stripe columns not yet in DB types
    const instance = rawInstance as any;

    const handleSubscribe = async (priceId: string, planId: string) => {
        try {
            setLoadingPlan(planId);
            toast.info("Preparando seu checkout...");

            const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: {
                    price_id: priceId,
                    instance_id: instance.id,
                },
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error("Error redirecting to checkout:", error);
            toast.error("Erro ao iniciar assinatura", {
                description: error.message,
            });
            setLoadingPlan(null);
        }
    };

    const handleManageBilling = async () => {
        try {
            setLoadingPlan('manage');
            toast.info("Redirecionando para o Portal do Cliente...");

            const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: {
                    action: "create_portal_session",
                    instance_id: instance.id,
                },
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            toast.error("Erro ao abrir portal de faturamento");
            setLoadingPlan(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    const isPro = instance?.subscription_status === "active" || instance?.subscription_status === "trialing";
    const statusColor = isPro ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
    const statusLabel = isPro ? (instance?.subscription_status === "active" ? "Assinatura Ativa" : "Período de Teste") : "Plano Inativo";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Current Subscription Status */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className={statusColor}>
                                {statusLabel}
                            </Badge>
                            {isPro && (
                                <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50">
                                    PLANO PRO
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">
                            {instance?.company_name}
                        </h2>
                        {instance?.current_period_end && (
                            <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Vencimento/Renovação: {format(new Date(instance.current_period_end), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </p>
                        )}
                    </div>

                    <div>
                        {instance?.stripe_customer_id ? (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleManageBilling}
                                disabled={loadingPlan === 'manage'}
                            >
                                {loadingPlan === 'manage' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                Gerenciar Assinatura
                            </Button>
                        ) : (
                            <p className="text-sm text-slate-500 text-right">
                                Escolha um plano abaixo para<br />ativar sua licença profissional.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            {instance?.subscription_status !== "active" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PRICING_PLANS.map((plan) => (
                        <Card key={plan.id} className={`relative flex flex-col border-2 ${plan.popular ? 'border-teal-500 shadow-teal-50' : 'border-slate-200'} transition-all hover:shadow-md`}>
                            {plan.popular && (
                                <div className="absolute top-0 right-0 transform translate-x-0 -translate-y-1/2">
                                    <Badge className="bg-teal-500 hover:bg-teal-600 border-none px-3 py-1 flex gap-1 items-center">
                                        <Sparkles className="w-3 h-3" />
                                        Mais Popular
                                    </Badge>
                                </div>
                            )}
                            {plan.save && (
                                <div className="absolute top-4 right-4">
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                                        {plan.save}
                                    </Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <CardDescription>Acesso total ao sistema</CardDescription>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                                    <span className="text-slate-500">/{plan.interval}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                                            <div className="mt-0.5 bg-teal-100 rounded-full p-0.5">
                                                <Check className="w-3 h-3 text-teal-600" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className={`w-full ${plan.popular ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-800 hover:bg-slate-900'} text-white h-11`}
                                    onClick={() => handleSubscribe(plan.priceId, plan.id)}
                                    disabled={loadingPlan !== null}
                                >
                                    {loadingPlan === plan.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Assinar Agora
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Trust Insignia */}
            <div className="text-center space-y-2 py-4">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    Pagamento processado com segurança via Stripe
                    <ExternalLink className="w-3 h-3" />
                </p>
            </div>
        </div>
    );
}

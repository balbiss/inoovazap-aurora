import { useState, useEffect } from "react";
import { Link2, Copy, Check, ExternalLink, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";

export function PublicBookingSettings() {
  const { data: instance, refetch: refetchInstance } = useInstance();
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (instance) {
      setSlug(instance.slug || "");
      setIsActive(instance.public_booking_active ?? true);
    }
  }, [instance]);

  const baseUrl = window.location.origin;
  const bookingUrl = slug ? `${baseUrl}/book/${slug}` : "";

  const handleCopy = async () => {
    if (!bookingUrl) return;
    
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleSave = async () => {
    if (!instance) return;

    // Validate slug
    const cleanSlug = slug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanSlug) {
      toast.error("Digite um slug válido");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("instances")
        .update({
          slug: cleanSlug,
          public_booking_active: isActive,
        })
        .eq("id", instance.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Este slug já está em uso. Escolha outro.");
        } else {
          throw error;
        }
        return;
      }

      setSlug(cleanSlug);
      setIsEditing(false);
      await refetchInstance();
      toast.success("Configurações salvas!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (active: boolean) => {
    if (!instance) return;

    setIsActive(active);
    try {
      const { error } = await supabase
        .from("instances")
        .update({ public_booking_active: active })
        .eq("id", instance.id);

      if (error) throw error;
      await refetchInstance();
      toast.success(active ? "Agendamento online ativado" : "Agendamento online desativado");
    } catch (error: unknown) {
      setIsActive(!active);
      toast.error("Erro ao atualizar");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-50">
          <Link2 className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Agendamento Online</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compartilhe o link para pacientes agendarem consultas
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Toggle Active */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-slate-700">Aceitar agendamentos online</Label>
            <p className="text-xs text-slate-500 mt-0.5">
              Quando desativado, a página mostrará "indisponível"
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggleActive}
          />
        </div>

        {/* Slug Configuration */}
        <div className="space-y-2">
          <Label className="text-slate-700">Identificador da clínica (slug)</Label>
          
          {isEditing ? (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center">
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-l-lg border border-r-0 border-slate-200">
                  {baseUrl}/book/
                </span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="minha-clinica"
                  className="rounded-l-none border-slate-200"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSlug(instance?.slug || "");
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center">
                <Input
                  value={slug || "Não configurado"}
                  readOnly
                  className="bg-slate-50 border-slate-200 text-slate-600"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-slate-200"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </div>
          )}
          
          <p className="text-xs text-slate-400">
            Use apenas letras minúsculas, números e hífens. Ex: clinica-sorriso
          </p>
        </div>

        {/* Copy Link */}
        {slug && (
          <div className="space-y-2">
            <Label className="text-slate-700">Link para compartilhar</Label>
            <div className="flex gap-2">
              <Input
                value={bookingUrl}
                readOnly
                className="bg-slate-50 border-slate-200 font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopy}
                className={copied ? "bg-teal-50 border-teal-200 text-teal-700" : "border-slate-200"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(bookingUrl, "_blank")}
                className="border-slate-200"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
          <p className="text-sm text-sky-800">
            <strong>Como funciona:</strong> Ao acessar o link, o paciente poderá escolher o profissional, 
            data e horário disponíveis, e informar seus dados para confirmar o agendamento. 
            Os agendamentos aparecem automaticamente na sua agenda.
          </p>
        </div>
      </div>
    </div>
  );
}

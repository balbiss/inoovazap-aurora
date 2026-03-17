import { useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string | null) => void;
    folder: string;
    className?: string;
    label?: string;
}

export function ImageUpload({ value, onChange, folder, className, label }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!file.type.startsWith("image/")) {
            toast.error("Por favor, selecione uma imagem válida.");
            return;
        }

        // Validate size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 2MB.");
            return;
        }

        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${folder}/${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = fileName;

            const { data, error: uploadError } = await supabase.storage
                .from("clinic-assets")
                .upload(filePath, file, {
                    upsert: true,
                    contentType: file.type,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("clinic-assets")
                .getPublicUrl(filePath);

            onChange(publicUrl);
            toast.success("Imagem enviada com sucesso!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Erro ao enviar imagem: " + (error.message || "Erro desconhecido"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        onChange(null);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <div className={cn(
                        "w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50/50 transition-all group-hover:border-teal-400 group-hover:bg-slate-50",
                        value && "border-solid border-teal-500 shadow-sm"
                    )}>
                        {value ? (
                            <img src={value} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                            <ImageIcon className="w-10 h-10 text-slate-300" />
                        )}

                        {isUploading && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                            </div>
                        )}
                    </div>

                    {value && !isUploading && (
                        <button
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-colors"
                            type="button"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <div className="flex-1">
                    <input
                        type="file"
                        id={`image-upload-${folder}`}
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <Label htmlFor={`image-upload-${folder}`} className="cursor-pointer">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={isUploading}
                            asChild
                        >
                            <span>
                                <Upload className="w-4 h-4" />
                                {value ? "Trocar Imagem" : "Enviar Imagem"}
                            </span>
                        </Button>
                    </Label>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                        JPG, PNG ou GIF. Máximo 2MB.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Simple Label component since I'm using it inside but might need a separate import if not already available
function Label({ children, htmlFor, className }: any) {
    return (
        <label htmlFor={htmlFor} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
            {children}
        </label>
    );
}

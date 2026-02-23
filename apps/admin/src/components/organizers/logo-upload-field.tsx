"use client";

import { useEffect, useRef, useState } from "react";
import { Image, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export function LogoUploadField({
    value,
    onChange,
}: {
    value: string;
    onChange: (next: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { startUpload, isUploading } = useUploadThing("organizerLogo", {
        onClientUploadComplete: (res) => {
            const url = res?.[0]?.url;
            if (url) {
                onChange(url);
                setPreviewUrl(null);
            }
        },
        onUploadError: (e) => {
            setError(e.message);
        },
    });

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    async function handleFile(file: File | null) {
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Faqat PNG yoki JPG fayl qabul qilinadi.");
            return;
        }

        if (file.size > MAX_SIZE) {
            setError("Fayl hajmi 2MB dan oshmasligi kerak.");
            return;
        }

        setError(null);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        try {
            await startUpload([file]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Yuklashda xatolik.");
        }
    }

    function clearLogo() {
        onChange("");
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (inputRef.current) inputRef.current.value = "";
        setError(null);
    }

    const displayUrl = value || previewUrl;

    return (
        <div className="grid gap-2">
            <div
                role="button"
                tabIndex={0}
                onClick={() => {
                    if (isUploading) return;
                    inputRef.current?.click();
                }}
                onKeyDown={(e) => {
                    if (isUploading) return;
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                className={`group flex flex-col gap-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    isUploading
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-muted/30"
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md border bg-background">
                        <UploadCloud className="size-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm">
                        <div className="font-medium">Logo yuklang</div>
                        <div className="text-xs text-muted-foreground">
                            PNG/JPG, 2MB gacha
                        </div>
                    </div>
                </div>

                {displayUrl ? (
                    <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-md border bg-background">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={displayUrl}
                                alt="Logo ko'rinishi"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Ko'rinish
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Image className="size-3" />
                        Logo ko'rinishi shu yerda chiqadi
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                >
                    O'zgartirish
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearLogo}
                    disabled={isUploading || !displayUrl}
                >
                    <X className="size-4" />
                    O'chirish
                </Button>
                {isUploading ? (
                    <span className="text-xs text-muted-foreground">
                        Yuklanmoqda...
                    </span>
                ) : null}
            </div>

            {error ? (
                <div className="text-sm text-destructive">{error}</div>
            ) : null}

            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}



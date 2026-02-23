"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toastError, toastSuccess } from "@/lib/toast";

type ActionState = {
    status?: "idle" | "success" | "error" | "noop";
    message?: string;
};

const initialState: ActionState = { status: "idle" };

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={disabled || pending}>
            {pending ? "Yuborilmoqda..." : "So'rov yuborish"}
        </Button>
    );
}

export function RequestAccessForm({
    action,
    defaultMessage,
    disabled,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    defaultMessage: string;
    disabled?: boolean;
}) {
    const [state, formAction] = useActionState(action, initialState);

    useEffect(() => {
        if (state.status === "success") {
            toastSuccess("So'rov yuborildi ✅");
        }
        if (state.status === "error") {
            toastError(state.message || "Xatolik");
        }
    }, [state]);

    return (
        <form className="space-y-3" action={formAction}>
            <Textarea
                name="message"
                placeholder="Izoh (ixtiyoriy)"
                defaultValue={defaultMessage}
            />
            <SubmitButton disabled={disabled} />
        </form>
    );
}


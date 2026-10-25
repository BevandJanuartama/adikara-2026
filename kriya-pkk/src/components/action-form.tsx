"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

export type FormState = { error?: string; message?: string } | undefined;

// Form generik: memanggil Server Action dan menampilkan pesan error/sukses di bawahnya.
export function ActionForm({
  action, children, submitLabel, className = "space-y-3", variant = "default",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  submitLabel: string;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{state.error}</p>}
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-base text-green-800">{state.message}</p>}
      <Button type="submit" variant={variant} disabled={pending} className="h-12 w-full text-base">
        {pending ? "Memproses…" : submitLabel}
      </Button>
    </form>
  );
}

export function Field({ label, name, type = "text", defaultValue, required = true, step, min, max, placeholder }: {
  label: string; name: string; type?: string; defaultValue?: string | number; required?: boolean;
  step?: string; min?: number; max?: number; placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-base">{label}</span>
      <input
        name={name} type={type} defaultValue={defaultValue} required={required} step={step} min={min} max={max}
        placeholder={placeholder} inputMode={type === "number" ? "decimal" : undefined}
        className="h-12 w-full rounded-md border bg-background px-3 text-base"
      />
    </label>
  );
}

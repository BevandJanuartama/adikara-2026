"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Notice, inputClass, labelClass } from "@/components/kriya-ui";
import { cn } from "@/lib/utils";

export type FormState = { error?: string; message?: string } | undefined;

// Form generik: memanggil Server Action dan menampilkan pesan error/sukses di bawahnya.
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-4",
  variant = "default",
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
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.message && <Notice tone="success">{state.message}</Notice>}
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        className={cn("h-12 w-full rounded-xl text-base font-semibold", variant === "outline" && "bg-card")}
      >
        {pending ? "Memproses…" : submitLabel}
      </Button>
    </form>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = true,
  step,
  min,
  max,
  placeholder,
  suffix,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  step?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>
        {label}
        {!required && <span className="font-normal text-muted-foreground"> (opsional)</span>}
      </span>
      <span className="relative block">
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          inputMode={type === "number" ? "decimal" : undefined}
          className={cn(inputClass, suffix && "pr-14")}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

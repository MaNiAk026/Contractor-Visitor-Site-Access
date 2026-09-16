"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { DEMO_ACCOUNTS } from "@/lib/api/fixtures";
import { setSession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: z.string().min(1, "Choose a demo role.")
});

type LoginValues = z.infer<typeof loginSchema>;

/**
 * Renders the credential-free role demonstration sign-in screen.
 *
 * @returns An accessible form that starts a local demo session.
 */
export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_ACCOUNTS[0].email,
      role: DEMO_ACCOUNTS[0].role
    }
  });

  const onSubmit = async (values: LoginValues) => {
    const session = await apiClient.signIn(values);
    setSession(session);
    router.push(session.role === "gate_operator" ? "/gate" : "/dashboard");
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-lockup">
          <span className="brand-mark"><Building2 size={23} aria-hidden="true" /></span>
          <div>
            <strong>renewi</strong>
            <span>Access operations</span>
          </div>
        </div>

        <div className="login-copy">
          <p className="eyebrow">Vlaardingen lighthouse</p>
          <h1 id="login-title">A safer way to welcome people on site.</h1>
          <p>
            Demonstration access uses deterministic local data. Production identity, document,
            notification, and access-control integrations remain separately configurable.
          </p>
        </div>

        <form className="form-stack" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <label htmlFor="email">
            Demo account
            <select id="email" {...form.register("email")}>
              {DEMO_ACCOUNTS.map((account) => (
                <option key={account.email} value={account.email}>
                  {account.name} — {account.label}
                </option>
              ))}
            </select>
          </label>
          {form.formState.errors.email && <p className="field-error">{form.formState.errors.email.message}</p>}

          <label htmlFor="role">
            Access mode
            <select id="role" {...form.register("role")}>
              {DEMO_ACCOUNTS.map((account) => (
                <option key={account.role} value={account.role}>
                  {account.label}
                </option>
              ))}
            </select>
          </label>
          {form.formState.errors.role && <p className="field-error">{form.formState.errors.role.message}</p>}

          <button className="button button-primary login-action" type="submit">
            Open demo workspace <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        <aside className="privacy-note">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>No production credentials or personal documents are used in this local demo.</span>
        </aside>
      </section>

      <aside className="login-visual" aria-label="Access decision illustration">
        <div className="login-visual-content">
          <p className="eyebrow">Site readiness, made visible</p>
          <h2>One operational view from invitation to exit.</h2>
          <div className="visual-steps">
            {["Register and validate", "Issue a private access token", "Make an explainable gate decision"].map((step, index) => (
              <div className="visual-step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}

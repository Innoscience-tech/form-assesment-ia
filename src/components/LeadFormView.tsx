'use client';

import React, { useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { AssessmentLead } from '@/types/assessment';

export interface LeadFormViewProps {
  initialLead?: AssessmentLead | null;
  onSubmit: (lead: AssessmentLead) => void;
  onBack?: () => void;
}

type LeadField = keyof AssessmentLead;

function formatPhoneBr(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateLeadFields(values: AssessmentLead): Partial<Record<LeadField, string>> {
  const errors: Partial<Record<LeadField, string>> = {};
  if (values.name.trim().length < 2) {
    errors.name = 'Informe seu nome completo.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Informe um e-mail corporativo válido.';
  }
  const phoneDigits = values.phone.replace(/\D/g, '');
  if (phoneDigits.length < 8) {
    errors.phone = 'Informe um telefone válido com DDD.';
  }
  if (values.company.trim().length < 1) {
    errors.company = 'Informe o nome da sua empresa.';
  }
  if (values.role.trim().length < 1) {
    errors.role = 'Informe o seu cargo atual.';
  }
  return errors;
}

export function LeadFormView({ initialLead, onSubmit, onBack }: LeadFormViewProps) {
  const formId = useId();
  const prefersReducedMotion = useReducedMotion();

  const [values, setValues] = useState<AssessmentLead>({
    name: initialLead?.name ?? '',
    email: initialLead?.email ?? '',
    phone: initialLead?.phone ?? '',
    company: initialLead?.company ?? '',
    role: initialLead?.role ?? '',
  });

  const [touched, setTouched] = useState<Partial<Record<LeadField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = validateLeadFields(values);

  const handleChange = (field: LeadField, rawValue: string) => {
    const nextValue = field === 'phone' ? formatPhoneBr(rawValue) : rawValue;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleBlur = (field: LeadField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    const currentErrors = validateLeadFields(values);
    if (Object.keys(currentErrors).length > 0) {
      return;
    }
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      company: values.company.trim(),
      role: values.role.trim(),
    });
  };

  const showError = (field: LeadField) =>
    (submitAttempted || touched[field]) && Boolean(errors[field]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <motion.section
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        aria-labelledby={`lead-heading-${formId}`}
        className="editorial-card p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8"
      >
        <div className="space-y-3 border-b border-[#E5E7EB] pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FAB600] bg-[#FFFBEB] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#111111]">
            <span>Identificação · Etapa Inicial</span>
          </div>
          <h1
            id={`lead-heading-${formId}`}
            className="font-editorial text-3xl sm:text-4xl text-[#111111]"
          >
            Antes de iniciar, identifique seu perfil
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-[#555555]">
            Preencha seus dados para personalizar a leitura executiva de prontidão em IA da sua organização nas 8 dimensões do Octógono da IA.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nome */}
            <div className="sm:col-span-2 space-y-1.5">
              <label
                htmlFor={`${formId}-name`}
                className="block text-xs font-bold uppercase tracking-[0.12em] text-[#292929]"
              >
                Nome completo <span className="text-[#B45309]">*</span>
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]"
                  aria-hidden="true"
                />
                <input
                  id={`${formId}-name`}
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Ex.: Ana Beatriz Souza"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  aria-invalid={showError('name')}
                  aria-describedby={showError('name') ? `${formId}-name-error` : undefined}
                  className={`w-full rounded-xl border bg-[#F9FAFB] pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#888888] transition-colors focus:bg-[#FFFFFF] focus:border-[#FAB600] focus:outline-none ${
                    showError('name') ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
                  }`}
                />
              </div>
              {showError('name') && (
                <p id={`${formId}-name-error`} role="alert" className="text-xs font-medium text-[#DC2626]">
                  {errors.name}
                </p>
              )}
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-email`}
                className="block text-xs font-bold uppercase tracking-[0.12em] text-[#292929]"
              >
                E-mail corporativo <span className="text-[#B45309]">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]"
                  aria-hidden="true"
                />
                <input
                  id={`${formId}-email`}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  aria-invalid={showError('email')}
                  aria-describedby={showError('email') ? `${formId}-email-error` : undefined}
                  className={`w-full rounded-xl border bg-[#F9FAFB] pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#888888] transition-colors focus:bg-[#FFFFFF] focus:border-[#FAB600] focus:outline-none ${
                    showError('email') ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
                  }`}
                />
              </div>
              {showError('email') && (
                <p id={`${formId}-email-error`} role="alert" className="text-xs font-medium text-[#DC2626]">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-phone`}
                className="block text-xs font-bold uppercase tracking-[0.12em] text-[#292929]"
              >
                Telefone / WhatsApp <span className="text-[#B45309]">*</span>
              </label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]"
                  aria-hidden="true"
                />
                <input
                  id={`${formId}-phone`}
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={values.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  aria-invalid={showError('phone')}
                  aria-describedby={showError('phone') ? `${formId}-phone-error` : undefined}
                  className={`w-full rounded-xl border bg-[#F9FAFB] pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#888888] transition-colors focus:bg-[#FFFFFF] focus:border-[#FAB600] focus:outline-none tabular-nums ${
                    showError('phone') ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
                  }`}
                />
              </div>
              {showError('phone') && (
                <p id={`${formId}-phone-error`} role="alert" className="text-xs font-medium text-[#DC2626]">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Empresa */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-company`}
                className="block text-xs font-bold uppercase tracking-[0.12em] text-[#292929]"
              >
                Empresa <span className="text-[#B45309]">*</span>
              </label>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]"
                  aria-hidden="true"
                />
                <input
                  id={`${formId}-company`}
                  name="company"
                  type="text"
                  required
                  autoComplete="organization"
                  placeholder="Nome da sua organização"
                  value={values.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  onBlur={() => handleBlur('company')}
                  aria-invalid={showError('company')}
                  aria-describedby={showError('company') ? `${formId}-company-error` : undefined}
                  className={`w-full rounded-xl border bg-[#F9FAFB] pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#888888] transition-colors focus:bg-[#FFFFFF] focus:border-[#FAB600] focus:outline-none ${
                    showError('company') ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
                  }`}
                />
              </div>
              {showError('company') && (
                <p id={`${formId}-company-error`} role="alert" className="text-xs font-medium text-[#DC2626]">
                  {errors.company}
                </p>
              )}
            </div>

            {/* Cargo */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-role`}
                className="block text-xs font-bold uppercase tracking-[0.12em] text-[#292929]"
              >
                Cargo <span className="text-[#B45309]">*</span>
              </label>
              <div className="relative">
                <Briefcase
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]"
                  aria-hidden="true"
                />
                <input
                  id={`${formId}-role`}
                  name="role"
                  type="text"
                  required
                  autoComplete="organization-title"
                  placeholder="Ex.: Diretor(a) de Inovação / TI"
                  value={values.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  onBlur={() => handleBlur('role')}
                  aria-invalid={showError('role')}
                  aria-describedby={showError('role') ? `${formId}-role-error` : undefined}
                  className={`w-full rounded-xl border bg-[#F9FAFB] pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#888888] transition-colors focus:bg-[#FFFFFF] focus:border-[#FAB600] focus:outline-none ${
                    showError('role') ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
                  }`}
                />
              </div>
              {showError('role') && (
                <p id={`${formId}-role-error`} role="alert" className="text-xs font-medium text-[#DC2626]">
                  {errors.role}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 flex items-center gap-3 text-xs text-[#555555]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#E0A400]" aria-hidden="true" />
            <span>
              Seus dados são utilizados exclusivamente para contextualizar o diagnóstico da sua empresa junto à Innoscience.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E7EB]">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#000000] transition-colors hover:border-[#000000] hover:bg-[#F9FAFB] cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Voltar ao início</span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#FAB600] px-6 py-3.5 text-sm font-bold text-[#000000] shadow-[0_6px_20px_rgba(250,182,0,0.28)] transition-all hover:bg-[#E0A400] cursor-pointer"
            >
              <span>Começar perguntas</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}

export default LeadFormView;

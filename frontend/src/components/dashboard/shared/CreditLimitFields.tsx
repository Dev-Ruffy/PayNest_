"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input, Label, Select } from "@/components/ui/Input";
import { RegisterSchoolInput } from "@/lib/validation";

// Blank inputs must become `undefined` (not "" or 0) so the optional validation rules treat them as "not set".
const toNumber = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));
const toEnum = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

export function CreditLimitFields({
  register,
  errors,
}: {
  register: UseFormRegister<RegisterSchoolInput>;
  errors: FieldErrors<RegisterSchoolInput>;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-400">Student spending limits (optional)</legend>
      <p className="text-xs text-slate-400">
        Leave these blank for no limits. You can change them later from Settings.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Maximum credit per student, resets every</Label>
          <Select {...register("creditPeriodType", { setValueAs: toEnum })} defaultValue="">
            <option value="">No limit</option>
            <option value="TERM">Term</option>
            <option value="SESSION">Session</option>
          </Select>
        </div>
        <div>
          <Label>Maximum amount</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="e.g. 50000"
            {...register("creditPeriodMaxAmount", { setValueAs: toNumber })}
            error={errors.creditPeriodMaxAmount?.message}
          />
        </div>
      </div>

      <div>
        <Label>Maximum a student can spend per day</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="e.g. 2000"
          {...register("dailySpendMaxAmount", { setValueAs: toNumber })}
          error={errors.dailySpendMaxAmount?.message}
        />
      </div>
    </fieldset>
  );
}

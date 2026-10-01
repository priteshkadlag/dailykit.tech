"use client";

import { useState } from "react";
import { format } from "date-fns";
import { calculateAge, parseDateInput } from "@/lib/calculations/age";
import { formatNumber } from "@/lib/format";
import { useTodayInputValue } from "@/lib/hooks/use-client-values";
import { DateField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, ErrorResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";

const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

export function AgeCalculator() {
  const today = useTodayInputValue();
  const [dob, setDob] = useState("");
  const [asOfOverride, setAsOfOverride] = useState<string | null>(null);
  const asOf = asOfOverride ?? today;

  const dobDate = parseDateInput(dob);
  const asOfDate = parseDateInput(asOf);
  const dobError = dob && !dobDate ? "Enter a valid date" : undefined;
  const asOfError = asOf && !asOfDate ? "Enter a valid date" : undefined;
  const orderError = dobDate && asOfDate && dobDate > asOfDate ? "Date of birth must be on or before the 'age on' date." : undefined;

  const result = dobDate && asOfDate && !orderError ? calculateAge(dobDate, asOfDate) : null;

  const ageText = result ? `${plural(result.years, "year")}, ${plural(result.months, "month")} and ${plural(result.days, "day")}` : "";

  return (
    <CalculatorLayout
      inputs={
        <InputCard>
          <DateField label="Date of birth" value={dob} onChange={setDob} max={asOf || undefined} error={dobError} />
          <DateField
            label="Age on"
            value={asOf}
            onChange={setAsOfOverride}
            error={asOfError}
            hint="Defaults to today. Change it to find your age on any date — e.g. an exam or job cut-off date."
          />
        </InputCard>
      }
      result={
        orderError ? (
          <ErrorResult message={orderError} />
        ) : result && asOfDate ? (
          <ResultCard
            highlightLabel="Your age"
            highlightValue={ageText}
            highlightCaption={`as on ${format(asOfDate, "d MMMM yyyy")}`}
            actions={
              <>
                <CopyButton text={`Age: ${ageText} (as on ${format(asOfDate, "d MMM yyyy")})`} />
                <ResetButton
                  onReset={() => {
                    setDob("");
                    setAsOfOverride(null);
                  }}
                />
              </>
            }
          >
            <ResultRows
              rows={[
                { label: "Total months", value: formatNumber(result.totalMonths) },
                { label: "Total weeks", value: `${formatNumber(result.totalWeeks)}${result.remainingDaysAfterWeeks ? ` + ${plural(result.remainingDaysAfterWeeks, "day")}` : ""}` },
                { label: "Total days", value: formatNumber(result.totalDays) },
              ]}
            />
            <div className="mt-4 rounded-lg bg-accent p-4 text-accent-foreground">
              <p className="text-sm font-medium">🎂 Next birthday</p>
              {result.isBirthdayToday ? (
                <p className="mt-1 text-lg font-semibold">Happy birthday! You turn {result.turningAge} today.</p>
              ) : (
                <>
                  <p className="mt-1 text-lg font-semibold">
                    {plural(result.daysToNextBirthday, "day")} to go
                  </p>
                  <p className="text-sm">
                    {format(result.nextBirthday, "EEEE, d MMMM yyyy")} · turning {result.turningAge}
                  </p>
                </>
              )}
            </div>
          </ResultCard>
        ) : (
          <EmptyResult message="Pick your date of birth to see your exact age and a countdown to your next birthday." />
        )
      }
    />
  );
}

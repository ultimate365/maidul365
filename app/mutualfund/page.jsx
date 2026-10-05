"use client";

import { useMemo, useState } from "react";

export default function MutualFundCalculator() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const todayString = new Date().toISOString().split("T")[0];

  const [investmentDate, setInvestmentDate] = useState("");
  const [frequency, setFrequency] = useState("quarterly");
  const [premiumAmount, setPremiumAmount] = useState("");
  const [currentValue, setCurrentValue] = useState("");

  // ---------------------------------------------------------
  // Date Helpers
  // ---------------------------------------------------------

  const parseDate = (dateString) => {
    if (!dateString) return null;

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ---------------------------------------------------------
  // Add months while preserving the original day where possible
  // Handles dates such as 31st January correctly.
  // ---------------------------------------------------------

  const addMonths = (date, months) => {
    const result = new Date(date);

    const originalDay = date.getDate();

    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const lastDay = new Date(
      result.getFullYear(),
      result.getMonth() + 1,
      0,
    ).getDate();

    result.setDate(Math.min(originalDay, lastDay));

    return result;
  };

  // ---------------------------------------------------------
  // Calculation
  // ---------------------------------------------------------

  const calculation = useMemo(() => {
    if (!investmentDate || !premiumAmount) {
      return null;
    }

    const startDate = parseDate(investmentDate);
    const premium = Number(premiumAmount);

    if (
      !startDate ||
      Number.isNaN(startDate.getTime()) ||
      !Number.isFinite(premium) ||
      premium <= 0 ||
      startDate > today
    ) {
      return null;
    }

    const intervalMonths = frequency === "monthly" ? 1 : 3;

    const previousPremiums = [];
    const upcomingPremiums = [];

    /*
      We calculate all premium dates around today.

      First premium:
      investmentDate

      Subsequent premiums:
      monthly   => +1 month
      quarterly => +3 months
    */

    let currentDate = new Date(startDate);

    let totalInstallments = 0;

    // Safety limit
    let iterations = 0;

    while (currentDate <= today && iterations < 1000) {
      previousPremiums.push(new Date(currentDate));

      totalInstallments++;

      currentDate = addMonths(currentDate, intervalMonths);

      iterations++;
    }

    // Generate next 6 upcoming premiums
    for (let i = 0; i < 6; i++) {
      upcomingPremiums.push(new Date(currentDate));

      currentDate = addMonths(currentDate, intervalMonths);
    }

    const totalInvested = totalInstallments * premium;

    const fundValue =
      currentValue !== "" && Number.isFinite(Number(currentValue))
        ? Number(currentValue)
        : null;

    let profitLoss = null;
    let profitLossPercentage = null;

    if (fundValue !== null) {
      profitLoss = fundValue - totalInvested;

      profitLossPercentage =
        totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
    }

    return {
      totalInstallments,
      totalInvested,
      fundValue,
      profitLoss,
      profitLossPercentage,
      previousPremiums,
      upcomingPremiums,
      nextPremiumDate: upcomingPremiums[0] || null,
      firstPremiumDate: startDate,
      intervalMonths,
    };
  }, [investmentDate, frequency, premiumAmount, currentValue]);

  // ---------------------------------------------------------
  // Reset
  // ---------------------------------------------------------

  const resetCalculator = () => {
    setInvestmentDate("");
    setFrequency("quarterly");
    setPremiumAmount("");
    setCurrentValue("");
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            Investment Calculator
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Mutual Fund{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Investment Calculator
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Calculate your total investment, premium schedule and current profit
            or loss based on your actual instalment frequency.
          </p>
        </header>

        {/* =====================================================
            MAIN CARD
        ====================================================== */}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="grid lg:grid-cols-12">
            {/* =================================================
                LEFT - INPUTS
            ================================================== */}

            <section className="border-b border-white/10 p-6 sm:p-8 lg:col-span-4 lg:border-b-0 lg:border-r">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
                  Investment Details
                </p>

                <h2 className="mt-2 text-2xl font-bold">Your Investment</h2>

                <p className="mt-2 text-sm text-slate-500">
                  Enter your fund details below.
                </p>
              </div>

              <div className="space-y-6">
                {/* ---------------------------------------------
                    Investment Date
                ---------------------------------------------- */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Investment Starting Date
                  </label>

                  <input
                    type="date"
                    value={investmentDate}
                    max={todayString}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-white outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Your first premium is paid on this exact date.
                  </p>
                </div>

                {/* ---------------------------------------------
                    Frequency
                ---------------------------------------------- */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Premium Frequency
                  </label>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-1.5">
                    <button
                      type="button"
                      onClick={() => setFrequency("monthly")}
                      className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                        frequency === "monthly"
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      Monthly
                    </button>

                    <button
                      type="button"
                      onClick={() => setFrequency("quarterly")}
                      className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                        frequency === "quarterly"
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      Quarterly
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>
                      {frequency === "monthly"
                        ? "📅 Every month"
                        : "📅 Every 3 months"}
                    </span>

                    {investmentDate && (
                      <span>from {formatDate(parseDate(investmentDate))}</span>
                    )}
                  </div>
                </div>

                {/* ---------------------------------------------
                    Premium
                ---------------------------------------------- */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Premium Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={premiumAmount}
                      onChange={(e) => setPremiumAmount(e.target.value)}
                      placeholder="10,000"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 py-3.5 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {frequency === "monthly"
                      ? "Amount invested every month."
                      : "Amount invested every 3 months."}
                  </p>
                </div>

                {/* ---------------------------------------------
                    Current Value
                ---------------------------------------------- */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Current Fund Value
                    </label>

                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-500">
                      OPTIONAL
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      placeholder="Enter current value"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 py-3.5 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Enter the latest value of your investment to calculate
                    profit or loss.
                  </p>
                </div>

                {/* ---------------------------------------------
                    Reset
                ---------------------------------------------- */}

                <button
                  type="button"
                  onClick={resetCalculator}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  Reset Calculator
                </button>
              </div>

              {/* First Premium Info */}

              {calculation && (
                <div className="mt-7 rounded-2xl border border-indigo-400/10 bg-indigo-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    First Premium
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {formatDate(calculation.firstPremiumDate)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    The recurring schedule starts from this date.
                  </p>
                </div>
              )}
            </section>

            {/* =================================================
                RIGHT - RESULTS
            ================================================== */}

            <section className="p-6 sm:p-8 lg:col-span-8">
              <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                    Investment Summary
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">Your Results</h2>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400">
                  As of{" "}
                  <span className="font-semibold text-slate-300">
                    {formatDate(today)}
                  </span>
                </div>
              </div>

              {!calculation ? (
                /* EMPTY STATE */

                <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 text-4xl">
                    📊
                  </div>

                  <h3 className="text-xl font-bold text-white">
                    Start Your Calculation
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Enter your investment date and premium amount. The
                    calculator will automatically generate your complete premium
                    schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* =================================================
                      TOTAL INVESTMENT
                  ================================================== */}

                  <div className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-transparent p-6">
                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Total Invested Amount
                    </p>

                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        {formatCurrency(calculation.totalInvested)}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="rounded-lg bg-white/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                          Premium
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {formatCurrency(Number(premiumAmount))}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                          Frequency
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-slate-200">
                          {frequency}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                          Instalments
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {calculation.totalInstallments}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      STAT CARDS
                  ================================================== */}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-lg">
                        🔢
                      </div>

                      <p className="text-xs text-slate-500">
                        Total Instalments
                      </p>

                      <p className="mt-1 text-2xl font-bold text-white">
                        {calculation.totalInstallments}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Paid till today
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-lg">
                        ✓
                      </div>

                      <p className="text-xs text-slate-500">Last Premium</p>

                      <p className="mt-1 text-lg font-bold text-white">
                        {formatDate(
                          calculation.previousPremiums[
                            calculation.previousPremiums.length - 1
                          ],
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Most recent payment
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-lg">
                        ⏳
                      </div>

                      <p className="text-xs text-slate-500">Next Premium</p>

                      <p className="mt-1 text-lg font-bold text-white">
                        {formatDate(calculation.nextPremiumDate)}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Upcoming payment
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      PROFIT / LOSS
                  ================================================== */}

                  {calculation.fundValue !== null && (
                    <div
                      className={`rounded-2xl border p-6 ${
                        calculation.profitLoss >= 0
                          ? "border-emerald-400/20 bg-emerald-500/5"
                          : "border-red-400/20 bg-red-500/5"
                      }`}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p
                            className={`text-xs font-bold uppercase tracking-wider ${
                              calculation.profitLoss >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {calculation.profitLoss >= 0
                              ? "Investment Profit"
                              : "Investment Loss"}
                          </p>

                          <p
                            className={`mt-2 text-3xl font-bold ${
                              calculation.profitLoss >= 0
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {calculation.profitLoss >= 0 ? "+" : ""}
                            {formatCurrency(calculation.profitLoss)}
                          </p>

                          <p className="mt-2 text-sm text-slate-500">
                            Invested{" "}
                            <span className="text-slate-300">
                              {formatCurrency(calculation.totalInvested)}
                            </span>{" "}
                            → Current value{" "}
                            <span className="text-slate-300">
                              {formatCurrency(calculation.fundValue)}
                            </span>
                          </p>
                        </div>

                        <div
                          className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border ${
                            calculation.profitLoss >= 0
                              ? "border-emerald-400/20 bg-emerald-500/10"
                              : "border-red-400/20 bg-red-500/10"
                          }`}
                        >
                          <span
                            className={`text-xl font-bold ${
                              calculation.profitLoss >= 0
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {calculation.profitLoss >= 0 ? "+" : ""}
                            {calculation.profitLossPercentage.toFixed(2)}%
                          </span>

                          <span className="text-[10px] uppercase text-slate-500">
                            Return
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      PREMIUM TIMELINE
                  ================================================== */}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Premium Schedule
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-white">
                          Your Premium Dates
                        </h3>
                      </div>

                      <div className="text-xs text-slate-500">
                        {frequency === "monthly"
                          ? "Every month"
                          : "Every 3 months"}
                      </div>
                    </div>

                    {/* ---------------------------------------------
                        PREVIOUS PREMIUMS
                    ---------------------------------------------- */}

                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                          ✓
                        </div>

                        <h4 className="text-sm font-semibold text-slate-300">
                          Previous Premiums
                        </h4>

                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {calculation.previousPremiums.length}
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto pr-2">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {calculation.previousPremiums
                            .slice()
                            .reverse()
                            .map((date, index) => (
                              <div
                                key={date.toISOString()}
                                className={`group flex items-center justify-between rounded-xl border p-3 transition ${
                                  index === 0
                                    ? "border-emerald-400/20 bg-emerald-500/5"
                                    : "border-white/5 bg-white/[0.02]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
                                      index === 0
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    ✓
                                  </div>

                                  <div>
                                    <p className="text-sm font-semibold text-slate-200">
                                      {formatDate(date)}
                                    </p>

                                    <p className="text-[10px] text-slate-600">
                                      Premium #
                                      {calculation.totalInstallments - index}
                                    </p>
                                  </div>
                                </div>

                                <span className="text-xs font-medium text-slate-500">
                                  {formatCurrency(Number(premiumAmount))}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}

                    <div className="my-6 border-t border-white/5" />

                    {/* ---------------------------------------------
                        UPCOMING PREMIUMS
                    ---------------------------------------------- */}

                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-xs text-indigo-400">
                          →
                        </div>

                        <h4 className="text-sm font-semibold text-slate-300">
                          Upcoming Premiums
                        </h4>

                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                          Next 6
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {calculation.upcomingPremiums.map((date, index) => (
                          <div
                            key={date.toISOString()}
                            className={`rounded-xl border p-3 transition ${
                              index === 0
                                ? "border-indigo-400/30 bg-indigo-500/10 shadow-lg shadow-indigo-950/20"
                                : "border-white/5 bg-white/[0.02]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
                                    index === 0
                                      ? "bg-indigo-500/20 text-indigo-300"
                                      : "bg-slate-800 text-slate-500"
                                  }`}
                                >
                                  {index === 0 ? "→" : index + 1}
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-slate-200">
                                    {formatDate(date)}
                                  </p>

                                  <p className="text-[10px] text-slate-600">
                                    {index === 0
                                      ? "Next premium"
                                      : `Upcoming #${index + 1}`}
                                  </p>
                                </div>
                              </div>

                              <span className="text-xs font-medium text-slate-500">
                                {formatCurrency(Number(premiumAmount))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      FORMULA
                  ================================================== */}

                  <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Calculation
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-300">
                        {formatCurrency(Number(premiumAmount))}
                      </span>

                      <span className="text-slate-600">×</span>

                      <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-300">
                        {calculation.totalInstallments} instalments
                      </span>

                      <span className="text-slate-600">=</span>

                      <span className="rounded-lg bg-indigo-500/10 px-3 py-2 font-bold text-indigo-300">
                        {formatCurrency(calculation.totalInvested)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="mt-6 text-center text-xs leading-5 text-slate-600">
          This calculator is for estimation purposes only. Actual mutual fund
          returns depend on NAV, units allotted, market performance, taxes,
          charges and other applicable factors.
        </footer>
      </div>
    </main>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";

// Brazil eVisa – Multi-Step Form Web App (MVP)
// Notes:
// - Single-file React app ready to drop into a Next.js page or CRA/Vite entry.
// - TailwindCSS classes used for styling.
// - Implements: multi-step flow, progress, inline validation, tooltips, file guidance,
//   save & resume (localStorage), simple FAQ, and a review step.
// - Replace FAKE submit with your backend + payment later.
// - Includes lightweight self-tests for validators (see console).

export default function BrazilEVisaApp() {
  const STORAGE_KEY = "brazil_evisa_mvp_v1";

  const [step, setStep] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<null | { ok: boolean; message: string }>(null);

  const empty: FormDataState = useMemo(
    () => ({
      account: { email: "", phone: "" },
      personal: {
        firstName: "",
        lastName: "",
        dob: "",
        nationality: "United States",
        gender: "",
      },
      passport: {
        number: "",
        issueDate: "",
        expiryDate: "",
        issuingCountry: "United States",
      },
      travel: {
        purpose: "Tourism",
        arrivalDate: "",
        departureDate: "",
        addressInBrazil: "",
      },
      documents: {
        photo: null,
        bioPage: null,
        itinerary: null,
      },
      consents: { agreeAccuracy: false, agreePrivacy: false },
    }),
    []
  );

  const [data, setData] = useState<FormDataState>(empty);

  useEffect(() => {
    // Hydrate from localStorage if exists
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FormDataState;
        // Files cannot be persisted; null them out
        if (parsed?.documents) {
          parsed.documents.photo = null;
          parsed.documents.bioPage = null;
          parsed.documents.itinerary = null;
        }
        setData(parsed);
        setSavedAt(new Date().toLocaleString());
      }
    } catch (e) {
      console.warn("Failed to parse saved form", e);
    }
  }, [STORAGE_KEY]);

  // ---- Lightweight Self Tests (console only) ----
  useEffect(() => {
    try {
      runSelfTests();
    } catch (e) {
      console.warn("Self-tests failed to run:", e);
    }
  }, []);

  function save() {
    const toSave = {
      ...data,
      documents: { ...data.documents, photo: null, bioPage: null, itinerary: null },
    } satisfies FormDataState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setSavedAt(new Date().toLocaleString());
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setData(empty);
    setStep(0);
    setSavedAt(null);
    setSubmitResult(null);
  }

  const steps: StepDef[] = [
    { key: "account", title: "Account", component: AccountStep },
    { key: "personal", title: "Personal", component: PersonalStep },
    { key: "passport", title: "Passport", component: PassportStep },
    { key: "travel", title: "Travel", component: TravelStep },
    { key: "documents", title: "Documents", component: DocumentsStep },
    { key: "review", title: "Review & Submit", component: ReviewStep },
  ];

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }

  // Validation guard per step
  const currentKey = steps[step].key;
  const currentErrors = validate(currentKey, data);
  const canContinue = currentErrors.length === 0 || step === steps.length - 1; // allow submit step to handle itself

  async function fakeSubmit() {
    // Replace with real API + payment integration
    setSubmitting(true);
    setSubmitResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitResult({ ok: true, message: "Application received. We’ll email you updates." });
    save();
  }

  // Properly render the dynamic step component
  const ActiveStep = steps[step].component;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrazilFlag />
            <div>
              <h1 className="text-xl font-semibold">Brazil eVisa – Premium Application</h1>
              <p className="text-xs text-gray-500">Save & resume • Inline checks • Guided uploads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFAQ(true)} className="text-sm underline">
              FAQ
            </button>
            <button onClick={save} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100">
              Save
            </button>
            <button onClick={resetAll} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100">
              Reset
            </button>
          </div>
        </div>
        <Progress steps={steps} activeIndex={step} />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {savedAt && (
          <div className="mb-4 rounded-lg border bg-white px-4 py-2 text-sm text-gray-700">
            Last saved: <span className="font-medium">{savedAt}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border bg-white p-4 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-1">{steps[step].title}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Step {step + 1} of {steps.length}
            </p>

            <ActiveStep data={data} setData={setData} />

            {step !== steps.length - 1 && currentErrors.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium mb-1">Please fix the following:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {currentErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button onClick={prev} disabled={step === 0} className="rounded-xl border px-4 py-2 disabled:opacity-50">
                Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={next}
                  disabled={!canContinue}
                  className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={fakeSubmit}
                  disabled={submitting}
                  className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit Application"}
                </button>
              )}
            </div>
            {submitResult && (
              <div
                className={`mt-4 rounded-lg border p-3 text-sm ${
                  submitResult.ok
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {submitResult.message}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-4 h-fit">
            <Checklist data={data} />
            <HelpCard onOpenFAQ={() => setShowFAQ(true)} />
            <SecurityCard />
          </aside>
        </div>
      </main>

      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}

      <footer className="mt-10 border-t bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
          <p>
            Not a government website. We guide and submit through the official channel. Data protected with AES-256 in transit & at rest. MFA supported. PCI-compliant payments on production.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Types

type StepKey = "account" | "personal" | "passport" | "travel" | "documents" | "review";

type StepDef = { key: StepKey; title: string; component: React.ComponentType<StepProps> };

type FormDataState = {
  account: { email: string; phone: string };
  personal: { firstName: string; lastName: string; dob: string; nationality: string; gender: string };
  passport: { number: string; issueDate: string; expiryDate: string; issuingCountry: string };
  travel: { purpose: "Tourism" | "Business"; arrivalDate: string; departureDate: string; addressInBrazil: string };
  documents: { photo: File | null; bioPage: File | null; itinerary: File | null };
  consents: { agreeAccuracy: boolean; agreePrivacy: boolean };
};

type StepProps = { data: FormDataState; setData: React.Dispatch<React.SetStateAction<FormDataState>> };

// Components – Steps

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function AccountStep({ data, setData }: StepProps) {
  return (
    <div>
      <TwoCol>
        <Field label="Email" required hint="We'll send confirmations here.">
          <input
            type="email"
            className="w-full rounded-lg border px-3 py-2"
            value={data.account.email}
            onChange={(e) =>
              setData((d) => ({ ...d, account: { ...d.account, email: e.target.value } }))
            }
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone" required hint="Use a number we can text if needed.">
          <input
            type="tel"
            className="w-full rounded-lg border px-3 py-2"
            value={data.account.phone}
            onChange={(e) =>
              setData((d) => ({ ...d, account: { ...d.account, phone: e.target.value } }))
            }
            placeholder="+1 312 555 0123"
          />
        </Field>
      </TwoCol>
    </div>
  );
}

function PersonalStep({ data, setData }: StepProps) {
  return (
    <div>
      <TwoCol>
        <Field label="First Name" required>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={data.personal.firstName}
            onChange={(e) =>
              setData((d) => ({ ...d, personal: { ...d.personal, firstName: e.target.value } }))
            }
          />
        </Field>
        <Field label="Last Name" required>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={data.personal.lastName}
            onChange={(e) =>
              setData((d) => ({ ...d, personal: { ...d.personal, lastName: e.target.value } }))
            }
          />
        </Field>
      </TwoCol>
      <TwoCol>
        <Field label="Date of Birth" required hint="Format: YYYY-MM-DD">
          <input
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={data.personal.dob}
            onChange={(e) =>
              setData((d) => ({ ...d, personal: { ...d.personal, dob: e.target.value } }))
            }
          />
        </Field>
        <Field label="Gender" required>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={data.personal.gender}
            onChange={(e) =>
              setData((d) => ({ ...d, personal: { ...d.personal, gender: e.target.value } }))
            }
          >
            <option value="">Select…</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </Field>
      </TwoCol>
      <TwoCol>
        <Field label="Nationality" required>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={data.personal.nationality}
            onChange={(e) =>
              setData((d) => ({ ...d, personal: { ...d.personal, nationality: e.target.value } }))
            }
            placeholder="United States"
          />
        </Field>
        <div />
      </TwoCol>
    </div>
  );
}

function PassportStep({ data, setData }: StepProps) {
  return (
    <div>
      <TwoCol>
        <Field label="Passport Number" required>
          <input
            className="w-full rounded-lg border px-3 py-2 uppercase tracking-widest"
            value={data.passport.number}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                passport: { ...d.passport, number: e.target.value.toUpperCase() },
              }))
            }
            placeholder="X12345678"
          />
        </Field>
        <Field label="Issuing Country" required>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={data.passport.issuingCountry}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                passport: { ...d.passport, issuingCountry: e.target.value },
              }))
            }
            placeholder="United States"
          />
        </Field>
      </TwoCol>
      <TwoCol>
        <Field label="Issue Date" required>
          <input
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={data.passport.issueDate}
            onChange={(e) =>
              setData((d) => ({ ...d, passport: { ...d.passport, issueDate: e.target.value } }))
            }
          />
        </Field>
        <Field label="Expiry Date" required>
          <input
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={data.passport.expiryDate}
            onChange={(e) =>
              setData((d) => ({ ...d, passport: { ...d.passport, expiryDate: e.target.value } }))
            }
          />
        </Field>
      </TwoCol>
    </div>
  );
}

function TravelStep({ data, setData }: StepProps) {
  return (
    <div>
      <TwoCol>
        <Field label="Purpose" required>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={data.travel.purpose}
            onChange={(e) =>
              setData((d) => ({ ...d, travel: { ...d.travel, purpose: e.target.value as TravelPurpose } }))
            }
          >
            <option>Tourism</option>
            <option>Business</option>
          </select>
        </Field>
        <div />
      </TwoCol>
      <TwoCol>
        <Field label="Arrival Date" required>
          <input
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={data.travel.arrivalDate}
            onChange={(e) =>
              setData((d) => ({ ...d, travel: { ...d.travel, arrivalDate: e.target.value } }))
            }
          />
        </Field>
        <Field label="Departure Date" required>
          <input
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={data.travel.departureDate}
            onChange={(e) =>
              setData((d) => ({ ...d, travel: { ...d.travel, departureDate: e.target.value } }))
            }
          />
        </Field>
      </TwoCol>
      <Field label="Address in Brazil" required hint="Hotel/Airbnb or host address.">
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={data.travel.addressInBrazil}
          onChange={(e) =>
            setData((d) => ({ ...d, travel: { ...d.travel, addressInBrazil: e.target.value } }))
          }
          placeholder="Hotel Name, Street, City"
        />
      </Field>
    </div>
  );
}

type TravelPurpose = FormDataState["travel"]["purpose"];

function DocumentsStep({ data, setData }: StepProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Upload clear, colored scans. Max 10 MB each. Accepted: JPG/PNG/PDF.
      </p>
      <TwoCol>
        <Field
          label="Passport Photo"
          required
          hint={
            <>
              A color photo with a white background, eyes open, front-facing, shadowless, appropriate attire. Minimum
              400×600 px. Face must be 50–60% of image height.
            </>
          }
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) =>
              setData((d) => ({
                ...d,
                documents: { ...d.documents, photo: e.target.files?.[0] ?? null },
              }))
            }
            className="w-full rounded-lg border px-3 py-2"
          />
          <FileBadge file={data.documents.photo} />
        </Field>
        <Field
          label="Passport Bio Page"
          required
          hint="Upload a colored scan of the bio page. Photos of passports are not accepted."
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) =>
              setData((d) => ({
                ...d,
                documents: { ...d.documents, bioPage: e.target.files?.[0] ?? null },
              }))
            }
            className="w-full rounded-lg border px-3 py-2"
          />
          <FileBadge file={data.documents.bioPage} />
        </Field>
      </TwoCol>
      <Field
        label="Travel Itinerary"
        hint={
          <>
            A) Upload updated itinerary if traveling by Air or Sea. B) Upload your hotel reservation. If traveling by
            Land and no voucher available, upload passport copy to proceed. C) Crew members: upload Crew ID.
          </>
        }
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) =>
            setData((d) => ({
              ...d,
              documents: { ...d.documents, itinerary: e.target.files?.[0] ?? null },
            }))
          }
          className="w-full rounded-lg border px-3 py-2"
        />
        <FileBadge file={data.documents.itinerary} />
      </Field>
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.consents.agreeAccuracy}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                consents: { ...d.consents, agreeAccuracy: e.target.checked },
              }))
            }
          />
          I confirm all information is accurate.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.consents.agreePrivacy}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                consents: { ...d.consents, agreePrivacy: e.target.checked },
              }))
            }
          />
          I agree to the privacy policy and secure handling of my data.
        </label>
      </div>
    </div>
  );
}

function ReviewStep({ data }: StepProps) {
  return (
    <div className="space-y-6">
      <Section title="Contact">
        <KVP k="Email" v={data.account.email} />
        <KVP k="Phone" v={data.account.phone} />
      </Section>
      <Section title="Personal">
        <KVP k="Name" v={`${data.personal.firstName} ${data.personal.lastName}`} />
        <KVP k="DOB" v={data.personal.dob} />
        <KVP k="Gender" v={data.personal.gender} />
        <KVP k="Nationality" v={data.personal.nationality} />
      </Section>
      <Section title="Passport">
        <KVP k="Number" v={data.passport.number} />
        <KVP k="Issuing Country" v={data.passport.issuingCountry} />
        <KVP k="Issue Date" v={data.passport.issueDate} />
        <KVP k="Expiry Date" v={data.passport.expiryDate} />
      </Section>
      <Section title="Travel">
        <KVP k="Purpose" v={data.travel.purpose} />
        <KVP k="Arrival" v={data.travel.arrivalDate} />
        <KVP k="Departure" v={data.travel.departureDate} />
        <KVP k="Stay Address" v={data.travel.addressInBrazil} />
      </Section>
      <Section title="Documents">
        <KVP k="Photo" v={data.documents.photo?.name ?? "(not attached in this session)"} />
        <KVP k="Bio Page" v={data.documents.bioPage?.name ?? "(not attached in this session)"} />
        <KVP k="Itinerary" v={data.documents.itinerary?.name ?? "(optional)"} />
      </Section>
      <Section title="Consents">
        <KVP k="Accuracy" v={data.consents.agreeAccuracy ? "Yes" : "No"} />
        <KVP k="Privacy" v={data.consents.agreePrivacy ? "Yes" : "No"} />
      </Section>
      <p className="text-xs text-gray-500">
        Files aren’t stored in localStorage. Attach them again before final submission.
      </p>
    </div>
  );
}

// Validation

function validate(step: StepKey, d: FormDataState): string[] {
  const errs: string[] = [];
  function req(v: string, name: string) {
    if (!v?.trim()) errs.push(`${name} is required.`);
  }
  function isDate(v: string, name: string) {
    if (!/\d{4}-\d{2}-\d{2}/.test(v)) errs.push(`${name} must be a valid date.`);
  }

  if (step === "account") {
    req(d.account.email, "Email");
    if (d.account.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.account.email)) errs.push("Email format looks wrong.");
    req(d.account.phone, "Phone");
  }
  if (step === "personal") {
    req(d.personal.firstName, "First name");
    req(d.personal.lastName, "Last name");
    req(d.personal.gender, "Gender");
    req(d.personal.nationality, "Nationality");
    req(d.personal.dob, "Date of birth");
    if (d.personal.dob) isDate(d.personal.dob, "Date of birth");
  }
  if (step === "passport") {
    req(d.passport.number, "Passport number");
    req(d.passport.issuingCountry, "Issuing country");
    req(d.passport.issueDate, "Issue date");
    req(d.passport.expiryDate, "Expiry date");
    if (d.passport.issueDate) isDate(d.passport.issueDate, "Issue date");
    if (d.passport.expiryDate) isDate(d.passport.expiryDate, "Expiry date");
    if (d.passport.issueDate && d.passport.expiryDate && d.passport.issueDate > d.passport.expiryDate) {
      errs.push("Expiry date must be after issue date.");
    }
  }
  if (step === "travel") {
    req(d.travel.arrivalDate, "Arrival date");
    req(d.travel.departureDate, "Departure date");
    if (d.travel.arrivalDate) isDate(d.travel.arrivalDate, "Arrival date");
    if (d.travel.departureDate) isDate(d.travel.departureDate, "Departure date");
    if (d.travel.arrivalDate && d.travel.departureDate && d.travel.arrivalDate > d.travel.departureDate) {
      errs.push("Departure must be after arrival.");
    }
    req(d.travel.addressInBrazil, "Address in Brazil");
  }
  if (step === "documents") {
    if (!d.documents.photo) errs.push("Passport photo is required.");
    if (!d.documents.bioPage) errs.push("Passport bio page is required.");
    if (!d.consents.agreeAccuracy) errs.push("You must confirm accuracy.");
    if (!d.consents.agreePrivacy) errs.push("You must accept the privacy policy.");
  }

  return errs;
}

// ---- Self Tests (do not remove; extend if needed) ----
function runSelfTests() {
  const base: FormDataState = {
    account: { email: "", phone: "" },
    personal: { firstName: "", lastName: "", dob: "", nationality: "United States", gender: "" },
    passport: { number: "", issueDate: "", expiryDate: "", issuingCountry: "United States" },
    travel: { purpose: "Tourism", arrivalDate: "", departureDate: "", addressInBrazil: "" },
    documents: { photo: null, bioPage: null, itinerary: null },
    consents: { agreeAccuracy: false, agreePrivacy: false },
  };

  // Test 1: account validation catches bad email and missing phone
  const d1 = structuredClone(base);
  d1.account.email = "bad";
  d1.account.phone = "";
  const t1 = validate("account", d1);
  console.assert(
    t1.some((x) => x.includes("Email format")) && t1.some((x) => x.includes("Phone is required")),
    "Test 1 failed",
  );

  // Test 2: travel dates ordering
  const d2 = structuredClone(base);
  d2.travel.arrivalDate = "2025-12-10";
  d2.travel.departureDate = "2025-12-01";
  d2.travel.addressInBrazil = "Hotel";
  const t2 = validate("travel", d2);
  console.assert(t2.some((x) => x.includes("Departure must be after arrival")), "Test 2 failed");

  // Test 3: passport issue/expiry ordering
  const d3 = structuredClone(base);
  d3.passport.number = "X123";
  d3.passport.issuingCountry = "United States";
  d3.passport.issueDate = "2026-01-01";
  d3.passport.expiryDate = "2025-01-01";
  const t3 = validate("passport", d3);
  console.assert(t3.some((x) => x.includes("Expiry date must be after issue date")), "Test 3 failed");

  // Test 4: documents + consents required
  const d4 = structuredClone(base);
  const t4 = validate("documents", d4);
  console.assert(
    [
      "Passport photo is required.",
      "Passport bio page is required.",
      "You must confirm accuracy.",
      "You must accept the privacy policy.",
    ].every((msg) => t4.includes(msg)),
    "Test 4 failed",
  );

  // Test 5: happy path minimal fields
  const d5 = structuredClone(base);
  d5.account = { email: "ok@x.com", phone: "123" };
  d5.personal = {
    firstName: "A",
    lastName: "B",
    dob: "1990-01-01",
    nationality: "United States",
    gender: "Male",
  };
  d5.passport = {
    number: "X123",
    issueDate: "2020-01-01",
    expiryDate: "2030-01-01",
    issuingCountry: "United States",
  };
  d5.travel = {
    purpose: "Tourism",
    arrivalDate: "2025-12-01",
    departureDate: "2025-12-10",
    addressInBrazil: "Hotel",
  };
  d5.documents = { photo: {} as File, bioPage: {} as File, itinerary: null };
  d5.consents = { agreeAccuracy: true, agreePrivacy: true };
  const t5a = validate("account", d5);
  const t5b = validate("personal", d5);
  const t5c = validate("passport", d5);
  const t5d = validate("travel", d5);
  const t5e = validate("documents", d5);
  console.assert([t5a, t5b, t5c, t5d, t5e].every((arr) => arr.length === 0), "Test 5 failed");

  console.info("Self-tests completed");
}

// Support UI blocks

function Progress({ steps, activeIndex }: { steps: StepDef[]; activeIndex: number }) {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl px-4 pb-3">
        <ol className="flex items-center justify-between gap-2">
          {steps.map((s, i) => (
            <li key={s.key} className="flex-1">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-full rounded-full ${i <= activeIndex ? "bg-emerald-600" : "bg-gray-200"}`} />
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">{s.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Checklist({ data }: { data: FormDataState }) {
  const items = [
    { label: "Valid passport (6+ months)", done: !!data.passport.number },
    { label: "Passport photo ready", done: !!data.documents.photo },
    { label: "Bio page scan uploaded", done: !!data.documents.bioPage },
    { label: "Travel dates set", done: !!(data.travel.arrivalDate && data.travel.departureDate) },
    { label: "Address in Brazil", done: !!data.travel.addressInBrazil },
    { label: "Consents accepted", done: data.consents.agreeAccuracy && data.consents.agreePrivacy },
  ];
  return (
    <div>
      <h3 className="font-semibold mb-2">What you need</h3>
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm">
            <span className={`inline-block h-2 w-2 rounded-full ${it.done ? "bg-emerald-600" : "bg-gray-300"}`} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HelpCard({ onOpenFAQ }: { onOpenFAQ: () => void }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold mb-1">Need help?</h3>
      <p className="text-sm text-gray-600 mb-3">Check quick answers or chat with us.</p>
      <div className="flex gap-2">
        <button onClick={onOpenFAQ} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          Open FAQ
        </button>
        <button className="rounded-lg bg-black text-white px-3 py-1.5 text-sm">Start Chat</button>
      </div>
    </div>
  );
}

function SecurityCard() {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold mb-1">Security & Privacy</h3>
      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
        <li>AES-256 encryption (in transit & at rest)</li>
        <li>Multi-Factor Authentication</li>
        <li>PCI-DSS payment gateway</li>
        <li>GDPR/CCPA compliant</li>
      </ul>
    </div>
  );
}

function FileBadge({ file }: { file: File | null }) {
  if (!file) return null;
  const kb = Math.round(file.size / 1024);
  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
      <span className="truncate max-w-[220px]">{file.name}</span>
      <span className="text-gray-500">{kb} KB</span>
    </div>
  );
}

function FAQModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">FAQ</h3>
          <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm">
            Close
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Is this a government website?</p>
            <p>No. We’re a private service that prepares and submits via the official Brazilian e-visa channel.</p>
          </div>
          <div>
            <p className="font-medium">How long does it take?</p>
            <p>Standard cases take a few business days. Expedited options may be faster. We’ll show live status.</p>
          </div>
          <div>
            <p className="font-medium">Photo rules?</p>
            <p>White background, front-facing, eyes open, shadowless, 400×600 px minimum. Face = 50–60% of height.</p>
          </div>
          <div>
            <p className="font-medium">What if I make a mistake?</p>
            <p>Inline checks catch most issues. You can edit before submission. Our premium review can verify everything.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="rounded-xl border p-4">{children}</div>
    </div>
  );
}

function KVP({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="text-gray-600 w-40">{k}</span>
      <span className="flex-1 font-medium">{v}</span>
    </div>
  );
}

function BrazilFlag() {
  return (
    <svg viewBox="0 0 640 480" className="h-7 w-7" aria-hidden="true">
      <path fill="#009b3a" d="M0 0h640v480H0z" />
      <path fill="#ffdf00" d="M320 64 608 240 320 416 32 240z" />
      <circle cx="320" cy="240" r="96" fill="#002776" />
      <path d="M224 240a96 96 0 0 1 192 0c-64-32-128-32-192 0" fill="#fff" />
    </svg>
  );
}

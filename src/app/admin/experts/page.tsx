"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { Badge, Button, Field, LoadError, Notice, Pager, Panel, Section, State, Table } from "@/components/ui";

type Expert = {
  id: string;
  full_name: string;
  phone_number: string;
  expert_type: string;
  organization: string;
  county_id: string;
  is_available: boolean;
};

type ConsoleAccount = {
  id: string;
  full_name: string;
  phone_number: string;
  role: string;
  expert_id: string | null;
  is_active: boolean;
};

type County = {
  id: string;
  name: string;
};

type FieldOfficerResult = {
  expert: Expert;
  staff: ConsoleAccount;
};

const PAGE_SIZE = 20;
const DISCIPLINES = ["Agriculture", "Veterinary"] as const;

function consoleAccess(expertId: string, staffByExpert: Map<string, ConsoleAccount>) {
  const login = staffByExpert.get(expertId);
  if (!login) {
    return { label: "No console access", tone: "zinc" as const };
  }
  if (!login.is_active) {
    return { label: "Inactive account", tone: "amber" as const };
  }
  return { label: "Console access", tone: "green" as const };
}

export default function ExpertsPage() {
  const client = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [discipline, setDiscipline] = useState<(typeof DISCIPLINES)[number]>("Agriculture");
  const [countyId, setCountyId] = useState("");
  const [saved, setSaved] = useState("");

  const counties = useQuery({
    queryKey: ["counties"],
    queryFn: () => api<County[]>("/admin/counties"),
    staleTime: 300_000,
  });
  const experts = useQuery({
    queryKey: ["experts", offset],
    queryFn: () => api<Page<Expert>>(`/admin/experts?limit=${PAGE_SIZE}&offset=${offset}`),
  });
  const staff = useQuery({
    queryKey: ["staff"],
    queryFn: () => api<Page<ConsoleAccount>>("/admin/staff"),
  });

  const countyMap = useMemo(() => new Map((counties.data || []).map((row) => [row.id, row.name])), [counties.data]);

  const staffByExpert = useMemo(() => {
    const map = new Map<string, ConsoleAccount>();
    for (const row of staff.data?.items || []) {
      if (row.expert_id && row.role === "officer") map.set(row.expert_id, row);
    }
    return map;
  }, [staff.data]);

  const activeOfficerAccounts = useMemo(
    () => (staff.data?.items || []).filter((row) => row.role === "officer").length,
    [staff.data],
  );

  const createOfficer = useMutation({
    mutationFn: () =>
      api<FieldOfficerResult>("/admin/field-officers", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phone.trim(),
          password,
          expert_type: discipline,
          county_id: countyId,
          organization: organization.trim(),
          is_available: false,
        }),
      }),
    onSuccess: (data) => {
      setSaved(`${data.expert.full_name} has a field-officer console account.`);
      setFullName("");
      setPhone("");
      setPassword("");
      setOrganization("");
      setCountyId("");
      client.invalidateQueries({ queryKey: ["experts"] });
      client.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved("");
    createOfficer.mutate();
  }

  const countyOptions = counties.data || [];
  const countyReady = countyOptions.length > 0;
  const formValid =
    fullName.trim().length >= 3 &&
    phone.trim().length >= 10 &&
    password.length >= 8 &&
    organization.trim().length >= 2 &&
    Boolean(countyId);

  if (experts.isLoading && !experts.data) return <State kind="loading" />;
  if (experts.isError) return <LoadError error={experts.error} onRetry={() => experts.refetch()} />;

  return (
    <div className="space-y-8">
      <Section eyebrow="Roster" title="Create a field officer">
        <Panel className="p-5 md:p-6">
          {!countyReady && !counties.isLoading ? (
            <State
              kind="empty"
              title="Counties are not loaded"
              text="Connect to the API, then try again."
            />
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <input
                  className="field-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  minLength={3}
                  maxLength={150}
                  required
                  disabled={createOfficer.isPending}
                />
              </Field>
              <Field label="Phone">
                <input
                  className="field-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2547… or 07…"
                  inputMode="tel"
                  minLength={10}
                  maxLength={20}
                  required
                  disabled={createOfficer.isPending}
                />
              </Field>
              <Field label="Initial password" hint="At least 8 characters">
                <input
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                  disabled={createOfficer.isPending}
                />
              </Field>
              <Field label="Organisation">
                <input
                  className="field-input"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. County extension"
                  minLength={2}
                  maxLength={150}
                  required
                  disabled={createOfficer.isPending}
                />
              </Field>
              <Field label="Discipline">
                <select
                  className="field-input"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value as (typeof DISCIPLINES)[number])}
                  disabled={createOfficer.isPending}
                >
                  {DISCIPLINES.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </Field>
              <Field label="County">
                {countyOptions.length ? (
                  <select
                    className="field-input"
                    value={countyId}
                    onChange={(e) => setCountyId(e.target.value)}
                    required
                    disabled={createOfficer.isPending || counties.isLoading}
                  >
                    <option value="">Select county</option>
                    {countyOptions.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-stone-500">Loading counties…</p>
                )}
              </Field>
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={createOfficer.isPending || !formValid || counties.isLoading}>
                  {createOfficer.isPending ? "Creating field officer…" : "Create field officer"}
                </Button>
                {counties.isLoading ? <span className="text-xs text-stone-500">Loading counties…</span> : null}
              </div>
            </form>
          )}
          {counties.isError ? (
            <div className="mt-4">
              <LoadError error={counties.error} onRetry={() => counties.refetch()} />
            </div>
          ) : null}
        </Panel>
        {saved ? <Notice>{saved}</Notice> : null}
        {createOfficer.isError ? <Notice tone="error">{(createOfficer.error as Error).message}</Notice> : null}
      </Section>

      <Section title="Expert roster and field officer access">
        <div className="space-y-4">
          {staff.isError ? <LoadError error={staff.error} onRetry={() => staff.refetch()} /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
            <span>{experts.data?.items.length ?? 0} expert records</span>
            <span>{activeOfficerAccounts} field-officer console accounts</span>
          </div>
          <Table
            caption="Field officers"
            emptyTitle="No officers"
            headers={["Officer", "County", "Discipline", "Organisation", "Duty", "Access"]}
            rows={(experts.data?.items || []).map((row) => {
              const access = consoleAccess(row.id, staffByExpert);
              return [
                <div key={row.id}>
                  <p className="font-medium">{row.full_name}</p>
                  <p className="text-xs text-stone-500">{row.phone_number}</p>
                </div>,
                countyMap.get(row.county_id) || "—",
                row.expert_type,
                row.organization,
                <Badge key="d" tone={row.is_available ? "green" : "zinc"}>
                  {row.is_available ? "On duty" : "Off duty"}
                </Badge>,
                <Badge key="c" tone={access.tone}>
                  {access.label}
                </Badge>,
              ];
            })}
          />
          <Pager total={experts.data?.total ?? 0} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
        </div>
      </Section>
    </div>
  );
}

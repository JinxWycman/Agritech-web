"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { DemoScenario } from "@/lib/data-mode";
import type { UserRole } from "@/types/domain";
import { farmerProfileService, lifecycleExpertsService } from "@/services";
import { demoExperts } from "@/mocks/fixtures";
import { fastForwardDemoClock } from "@/lib/request-store";

const roles: UserRole[] = ["farmer", "expert", "admin"];
const routes: Record<UserRole, string> = {
  farmer: "/app/overview",
  expert: "/expert/overview",
  admin: "/admin/overview",
};

export function DemoControls({ role }: { role: UserRole }) {
  const t = useTranslations("controls");
  const router = useRouter();
  const pathname = usePathname();
  const queries = useQueryClient();
  const [scenario, setScenario] = useState<DemoScenario>("success");
  const [profileReset, setProfileReset] = useState(false);
  const [actingExpert, setActingExpert] = useState(demoExperts[0]?.id ?? "");

  function apply(nextRole: UserRole, nextScenario: DemoScenario) {
    document.cookie = `demo_role=${nextRole}; Path=/; SameSite=Lax`;
    document.cookie = `demo_scenario=${nextScenario}; Path=/; SameSite=Lax`;
    setScenario(nextScenario);
    queries.clear();
    router.replace(nextRole === role ? pathname : routes[nextRole]);
    router.refresh();
  }

  function fastForward() {
    fastForwardDemoClock(10);
    queries.invalidateQueries({ queryKey: ["lifecycle-requests"] });
    queries.invalidateQueries({ queryKey: ["farmer"] });
    queries.invalidateQueries({ queryKey: ["subscription"] });
    router.refresh();
  }

  function actAsExpert() {
    lifecycleExpertsService.setActingExpertId(actingExpert);
    document.cookie = "demo_role=expert; Path=/; SameSite=Lax";
    queries.clear();
    router.replace(routes.expert);
    router.refresh();
  }

  function resetProfile() {
    farmerProfileService.resetDemoProfile();
    setProfileReset(true);
    queries.invalidateQueries({ queryKey: ["farmer"] });
    queries.invalidateQueries({ queryKey: ["subscription"] });
  }

  return (
    <details className="rounded-xl border border-forest-700/25 bg-forest-50 p-3 text-sm text-forest-950">
      <summary className="cursor-pointer font-semibold">{t("title")}</summary>
      <p className="mt-2 text-xs">{t("mock")}</p>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium">{t("persona")}</span>
        <select
          value={role}
          onChange={(event) => apply(event.target.value as UserRole, scenario)}
          className="min-h-10 w-full rounded-lg border border-forest-700/30 bg-white px-2 text-sm"
        >
          {roles.map((item) => <option key={item} value={item}>{t(`role${item[0].toUpperCase()}${item.slice(1)}`)}</option>)}
        </select>
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium">{t("scenario")}</span>
        <select
          value={scenario}
          onChange={(event) => apply(role, event.target.value as DemoScenario)}
          className="min-h-10 w-full rounded-lg border border-forest-700/30 bg-white px-2 text-sm"
        >
          <option value="success">{t("success")}</option>
          <option value="empty">{t("empty")}</option>
          <option value="error">{t("error")}</option>
        </select>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={fastForward} className="min-h-11 rounded-lg border border-forest-700/30 bg-white px-3 font-semibold">{t("fastForward")}</button>
        <label className="flex min-h-11 items-center gap-2"><span>{t("selectExpert")}</span><select value={actingExpert} onChange={(event) => setActingExpert(event.target.value)} className="min-h-10 rounded-lg border border-forest-700/30 bg-white px-2">{demoExperts.map((expert) => <option key={expert.id} value={expert.id}>{expert.name}</option>)}</select></label>
        <button type="button" onClick={actAsExpert} className="min-h-11 rounded-lg border border-forest-700/30 bg-white px-3 font-semibold">{t("actAsExpert")}</button>
      </div>
      <p className="mt-3 text-xs">{t("review")}</p>
      {role === "farmer" && (
        <div className="mt-3">
          <button type="button" onClick={resetProfile} className="min-h-11 rounded-lg border border-forest-700/30 bg-white px-3 font-semibold">
            {t("resetDemoData")}
          </button>
          {profileReset && <p role="status" className="mt-2 text-xs">{t("resetDone")}</p>}
        </div>
      )}
    </details>
  );
}

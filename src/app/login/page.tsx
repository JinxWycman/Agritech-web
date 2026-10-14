import { Suspense } from "react";
import { LoginExperience } from "./login-experience";
import { LoadingState } from "@/components/portal-state";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginExperience />
    </Suspense>
  );
}

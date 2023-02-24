import { useOutletContext } from "@remix-run/react";
import type { SupabaseOutletContext } from "~/root";
import { useState } from "react";
import SignInForm from "components/SignInForm";

export default function Signin() {
  const { supabase } = useOutletContext<SupabaseOutletContext>();
  const [isLoading, setLoading] = useState(false);

  const handleSignin = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email
    });

    if (error) console.error(error);
    setLoading(false);
  }

  return (
    <>
      <h1>Signin</h1>
      <SignInForm onSubmit={handleSignin} disabled={isLoading} />
    </>
  )
}
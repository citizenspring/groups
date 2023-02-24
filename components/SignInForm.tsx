import { useOutletContext } from "@remix-run/react";
import type { SupabaseOutletContext } from "~/root";
import { useState } from "react";

type SignInFormData = {
  email: string
};

type Props = {
  onSubmit: ({email} : SignInFormData) => void,
  disabled: boolean
};

export default function Signin({ onSubmit, disabled } : Props) {
  const { supabase } = useOutletContext<SupabaseOutletContext>();
  const [email, setEmail] = useState<string>("");

  const handleSignin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email
    });

    if (error) console.error(error);
  }

  return (
    <>
      
    </>
  )
}
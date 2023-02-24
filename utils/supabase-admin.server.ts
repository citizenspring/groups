import { createClient } from "@supabase/supabase-js";

import type { Database } from "db_types";
console.log(">>> connecting to supabase", process.env.SUPABASE_URL);
export default createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { redirect } from "next/navigation";

/**
 * Sends the root route to the main operational dashboard.
 *
 * @returns This route always redirects to the dashboard.
 */
export default function HomePage() {
  redirect("/dashboard");
}

// This file cannot coexist with app/page.tsx for the "/" route.
// Dashboard home is served by app/page.tsx which imports DashboardLayout directly.
// This file must not be loaded — keeping it causes a routing conflict.
// Workaround: export a redirect so Next.js resolves deterministically.
import { redirect } from 'next/navigation'

export default function DashboardRootRedirect() {
  redirect('/')
}

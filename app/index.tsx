// app/index.tsx

import { Redirect } from "expo-router";

/**
 * Uygulama ilk açıldığında kullanıcıyı giriş ekranına yönlendirir.
 *
 * İleride auth sistemi büyürse burada:
 * - kullanıcı giriş yaptı mı?
 * - onboarding tamamlandı mı?
 * gibi kontroller yapılabilir.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}

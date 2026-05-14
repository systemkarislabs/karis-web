export default defineNuxtRouteMiddleware(async (to) => {
  const superAdmin = useSuperAdminStore();
  superAdmin.loadFromStorage();

  if (!superAdmin.token) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (!superAdmin.platformUser) {
    await superAdmin.fetchMe();
  }

  if (!superAdmin.token) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});

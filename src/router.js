import { createRouter, createWebHistory } from "vue-router";

export const routes = [
  {
    path: "/auth",
    component: () => import("./features/auth/layouts/AuthLayout.vue"),
    children: [
      {
        path: "login",
        name: "login",
        component: () => import("./features/auth/pages/LoginPage.vue"),
      },
      {
        path: "register",
        name: "register",
        component: () => import("./features/auth/pages/RegisterPage.vue"),
      },
    ],
  },
  {
    path: "/",
    component: () => import("./features/aucations/layouts/AucationLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        component: () => import("./features/aucations/pages/HomePage.vue"),
      },
      {
        path: "aucations/:aucationId",
        name: "aucation-detail",
        component: () => import("./features/aucations/pages/DetailPage.vue"),
      },
      {
        path: "users",
        name: "users",
        component: () => import("./features/users/pages/UsersPage.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("./features/users/pages/ProfilePage.vue"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("./features/common/pages/NotFoundPage.vue"),
  },
];

export function createAppRouter(history = createWebHistory()) {
  return createRouter({
    history,
    routes,
  });
}

const router = createAppRouter();

export default router;
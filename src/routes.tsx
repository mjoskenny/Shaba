import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import {
  CartPage,
  ContactPage,
  NotFoundPage,
  ProductDetailPage,
  RefundPolicyPage,
  ShopPage,
  SiteLayout,
  StoryPage,
} from "./pages/StorePages";

export const router = createBrowserRouter([
  { path: "/admin", Component: AdminPage },
  {
    Component: SiteLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "shop", Component: ShopPage },
      { path: "products/:slug", Component: ProductDetailPage },
      { path: "story", Component: StoryPage },
      { path: "contact", Component: ContactPage },
      { path: "refund-policy", Component: RefundPolicyPage },
      { path: "cart", Component: CartPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

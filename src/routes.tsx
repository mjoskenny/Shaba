import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import {
  CarePage,
  CartPage,
  ContactPage,
  CraftPage,
  JournalDetailPage,
  JournalPage,
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
      { path: "craft", Component: CraftPage },
      { path: "journal", Component: JournalPage },
      { path: "journal/:slug", Component: JournalDetailPage },
      { path: "care", Component: CarePage },
      { path: "contact", Component: ContactPage },
      { path: "refund-policy", Component: RefundPolicyPage },
      { path: "cart", Component: CartPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

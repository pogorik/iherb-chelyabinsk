import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { QuickViewModal } from "@/components/quick-view-modal";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { CartProvider } from "@/lib/cart-context";
import { QuickViewProvider } from "@/lib/quickview-context";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <QuickViewProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <QuickViewModal />
        <ScrollToTopButton />
      </QuickViewProvider>
    </CartProvider>
  );
}

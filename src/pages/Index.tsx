import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, TrendingUp, Shield, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

interface Category {
  id: string;
  name_fa: string;
  slug: string;
  icon: string;
}

export default function Index() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("sort_order");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/listings");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              هر چیزی که نیاز دارید،
              <br />
              <span className="text-gradient">اینجا پیدا کنید</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              بزرگترین پلتفرم خرید و فروش کالا و خدمات در سراسر ایران
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="دنبال چه چیزی می‌گردید؟"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-12 h-14 text-lg shadow-lg border-2"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              </div>
              <Button onClick={handleSearch} size="lg" className="h-14 px-8 shadow-lg">
                جستجو
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="outline" size="sm" onClick={() => navigate("/listings")}>
                مشاهده همه آگهی‌ها
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/new-listing")}>
                ثبت آگهی رایگان
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">دسته‌بندی‌ها</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.id} to={`/listings?category=${category.slug}`}>
                <Card className="p-6 text-center hover:shadow-lg transition-smooth cursor-pointer group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-fast">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold">{category.name_fa}</h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">ثبت آگهی آسان</h3>
              <p className="text-muted-foreground">
                در کمتر از ۵ دقیقه آگهی خود را ثبت کنید
              </p>
            </Card>

            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-accent/10">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">امن و قابل اعتماد</h3>
              <p className="text-muted-foreground">
                تمام آگهی‌ها توسط تیم ما بررسی می‌شوند
              </p>
            </Card>

            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">دسترسی گسترده</h3>
              <p className="text-muted-foreground">
                میلیون‌ها کاربر در انتظار آگهی شما هستند
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            آماده‌اید آگهی خود را منتشر کنید؟
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            با ثبت رایگان آگهی، محصول یا خدمات خود را به میلیون‌ها نفر نشان دهید
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/new-listing")}
            className="shadow-lg"
          >
            ثبت آگهی رایگان
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
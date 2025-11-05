import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface Listing {
  id: string;
  title: string;
  price: number;
  city: string;
  created_at: string;
  slug: string;
  categories: { name_fa: string } | null;
  listing_images: { image_url: string }[];
}

interface Category {
  id: string;
  name_fa: string;
  slug: string;
}

export default function Listings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedCity, setSelectedCity] = useState("all");

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, [selectedCategory, selectedCity, searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("sort_order");
    if (data) setCategories(data);
  };

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select(`
        *,
        categories:category_id (name_fa),
        listing_images (image_url)
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    const search = searchParams.get("search");
    const category = searchParams.get("category");

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (category && category !== "all") {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();
      if (cat) {
        query = query.eq("category_id", cat.id);
      }
    }

    if (selectedCity !== "all") {
      query = query.eq("city", selectedCity);
    }

    const { data } = await query;
    if (data) setListings(data as Listing[]);
    setLoading(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Search & Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="جستجو در آگهی‌ها..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name_fa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="w-full">
                اعمال فیلتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {listings.length} آگهی یافت شد
          </h1>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">آگهی یافت نشد</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className="cursor-pointer hover:shadow-lg transition-smooth overflow-hidden group"
                onClick={() => navigate(`/listing/${listing.slug}`)}
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {listing.listing_images[0] ? (
                    <img
                      src={listing.listing_images[0].image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-fast">
                    {listing.title}
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-primary">
                      {listing.price?.toLocaleString("fa-IR")} تومان
                    </span>
                    {listing.categories && (
                      <Badge variant="secondary">{listing.categories.name_fa}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(listing.created_at), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
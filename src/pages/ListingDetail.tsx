import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Phone, Eye, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  phone: string;
  condition: string;
  is_negotiable: boolean;
  created_at: string;
  views_count: number;
  categories: { name_fa: string } | null;
  profiles: { full_name: string; phone: string } | null;
  listing_images: { image_url: string; sort_order: number }[];
}

export default function ListingDetail() {
  const { slug } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchListing();
    }
  }, [slug]);

  const fetchListing = async () => {
    const { data } = await supabase
      .from("listings")
      .select(`
        *,
        categories:category_id (name_fa),
        profiles:user_id (full_name, phone),
        listing_images (image_url, sort_order)
      `)
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    if (data) {
      setListing(data as Listing);
      // Increment view count
      await supabase
        .from("listings")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", data.id);
    }
    setLoading(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("لینک آگهی کپی شد");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container py-8">
          <Card className="animate-pulse">
            <div className="aspect-video bg-muted" />
            <CardContent className="p-6 space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container py-8 text-center">
          <Card className="p-12">
            <h1 className="text-2xl font-bold mb-4">آگهی یافت نشد</h1>
            <p className="text-muted-foreground">این آگهی وجود ندارد یا حذف شده است</p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const images = listing.listing_images.sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]?.image_url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-fast ${
                        selectedImage === idx ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`تصویر ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      {listing.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(listing.created_at), {
                          addSuffix: true,
                          locale: faIR,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {listing.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {listing.views_count} بازدید
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-3">
                  {listing.categories && (
                    <Badge variant="secondary">{listing.categories.name_fa}</Badge>
                  )}
                  {listing.condition && (
                    <Badge variant="outline">
                      {listing.condition === "new" && "نو"}
                      {listing.condition === "like_new" && "در حد نو"}
                      {listing.condition === "good" && "خوب"}
                      {listing.condition === "fair" && "متوسط"}
                    </Badge>
                  )}
                  {listing.is_negotiable && (
                    <Badge variant="outline">قابل مذاکره</Badge>
                  )}
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-3">توضیحات</h2>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground mb-2">قیمت</p>
                  <p className="text-3xl font-bold text-primary">
                    {listing.price?.toLocaleString("fa-IR")} تومان
                  </p>
                  {listing.is_negotiable && (
                    <p className="text-sm text-muted-foreground mt-1">قابل مذاکره</p>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    برای تماس با آگهی‌دهنده
                  </p>
                  <Button className="w-full gap-2" size="lg">
                    <Phone className="h-4 w-4" />
                    {listing.phone || listing.profiles?.phone || "تماس"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            {listing.profiles && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">آگهی‌دهنده</h3>
                  <p className="text-foreground/90">{listing.profiles.full_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">عضو آگهی یاب</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
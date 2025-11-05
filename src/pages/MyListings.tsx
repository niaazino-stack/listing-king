import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, Edit, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface Listing {
  id: string;
  title: string;
  price: number;
  city: string;
  status: "pending" | "approved" | "rejected" | "expired";
  created_at: string;
  views_count: number;
  slug: string;
  listing_images: { image_url: string }[];
}

export default function MyListings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("برای مشاهده آگهی‌ها باید وارد شوید");
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchListings(session.user.id);
    });
  }, [navigate]);

  const fetchListings = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select(`
        *,
        listing_images (image_url)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setListings(data as Listing[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("خطا در حذف آگهی");
      return;
    }

    toast.success("آگهی حذف شد");
    setListings(listings.filter(l => l.id !== id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> در انتظار تایید</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" /> تایید شده</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> رد شده</Badge>;
      case "expired":
        return <Badge variant="secondary">منقضی شده</Badge>;
      default:
        return null;
    }
  };

  const filteredListings = listings.filter(listing => {
    if (activeTab === "all") return true;
    return listing.status === activeTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container py-8">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">آگهی‌های من</h1>
          <Button onClick={() => navigate("/new-listing")}>
            ثبت آگهی جدید
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">همه ({listings.length})</TabsTrigger>
            <TabsTrigger value="pending">در انتظار ({listings.filter(l => l.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="approved">تایید شده ({listings.filter(l => l.status === "approved").length})</TabsTrigger>
            <TabsTrigger value="rejected">رد شده ({listings.filter(l => l.status === "rejected").length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredListings.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">آگهی یافت نشد</p>
                <Button onClick={() => navigate("/new-listing")}>
                  ثبت اولین آگهی
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <Card key={listing.id} className="hover:shadow-md transition-smooth">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          {listing.listing_images[0] ? (
                            <img
                              src={listing.listing_images[0].image_url}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-3xl">📦</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                            {getStatusBadge(listing.status)}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="font-semibold text-primary text-base">
                              {listing.price?.toLocaleString("fa-IR")} تومان
                            </span>
                            <span>{listing.city}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {listing.views_count} بازدید
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(listing.created_at), {
                                addSuffix: true,
                                locale: faIR,
                              })}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/listing/${listing.slug}`)}
                            >
                              <Eye className="ml-2 h-4 w-4" />
                              مشاهده
                            </Button>

                            {listing.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/edit-listing/${listing.id}`)}
                                >
                                  <Edit className="ml-2 h-4 w-4" />
                                  ویرایش
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive">
                                      <Trash2 className="ml-2 h-4 w-4" />
                                      حذف
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>حذف آگهی</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        آیا مطمئن هستید که می‌خواهید این آگهی را حذف کنید؟ این عمل قابل بازگشت نیست.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(listing.id)} className="bg-destructive">
                                        حذف
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
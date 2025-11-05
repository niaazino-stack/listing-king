import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { CheckCircle2, XCircle, Eye, BarChart3, Users, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface Listing {
  id: string;
  title: string;
  price: number;
  city: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  slug: string;
  profiles: { full_name: string; phone: string } | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface Stats {
  totalListings: number;
  pendingListings: number;
  approvedListings: number;
  totalUsers: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("برای دسترسی به پنل مدیریت باید وارد شوید");
        navigate("/auth");
        return;
      }
      setUser(session.user);
      checkAdminRole(session.user.id);
    });
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast.error("شما دسترسی به پنل مدیریت ندارید");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select(`
        *,
        profiles:user_id (full_name, phone)
      `)
      .order("created_at", { ascending: false });

    if (listingsData) {
      setListings(listingsData as Listing[]);
      
      // Calculate stats
      const pending = listingsData.filter(l => l.status === "pending").length;
      const approved = listingsData.filter(l => l.status === "approved").length;
      
      setStats(prev => ({
        ...prev,
        totalListings: listingsData.length,
        pendingListings: pending,
        approvedListings: approved,
      }));
    }

    // Fetch user count
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (count !== null) {
      setStats(prev => ({ ...prev, totalUsers: count }));
    }

    setLoading(false);
  };

  const handleStatusChange = async (listingId: string, newStatus: "approved" | "rejected") => {
    const { error } = await supabase
      .from("listings")
      .update({
        status: newStatus,
        approved_at: newStatus === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", listingId);

    if (error) {
      toast.error("خطا در تغییر وضعیت آگهی");
      return;
    }

    toast.success(newStatus === "approved" ? "آگهی تایید شد" : "آگهی رد شد");
    fetchData();
  };

  const analyzeSEO = (listing: Listing) => {
    const issues: string[] = [];
    
    if (!listing.meta_title || listing.meta_title.length < 30) {
      issues.push("عنوان SEO کوتاه است (حداقل ۳۰ کاراکتر)");
    }
    if (listing.meta_title && listing.meta_title.length > 60) {
      issues.push("عنوان SEO بلند است (حداکثر ۶۰ کاراکتر)");
    }
    if (!listing.meta_description || listing.meta_description.length < 120) {
      issues.push("توضیحات SEO کوتاه است (حداقل ۱۲۰ کاراکتر)");
    }
    if (listing.meta_description && listing.meta_description.length > 160) {
      issues.push("توضیحات SEO بلند است (حداکثر ۱۶۰ کاراکتر)");
    }
    
    return issues;
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingListings = listings.filter(l => l.status === "pending");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-8">پنل مدیریت</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کل آگهی‌ها</p>
                  <p className="text-2xl font-bold">{stats.totalListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">در انتظار تایید</p>
                  <p className="text-2xl font-bold">{stats.pendingListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تایید شده</p>
                  <p className="text-2xl font-bold">{stats.approvedListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کاربران</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Management */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">در انتظار تایید ({pendingListings.length})</TabsTrigger>
            <TabsTrigger value="all">همه آگهی‌ها</TabsTrigger>
            <TabsTrigger value="seo">تحلیل SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>آگهی‌های در انتظار تایید</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    آگهی‌ای در انتظار تایید نیست
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>عنوان</TableHead>
                        <TableHead>آگهی‌دهنده</TableHead>
                        <TableHead>قیمت</TableHead>
                        <TableHead>شهر</TableHead>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">{listing.title}</TableCell>
                          <TableCell>
                            {listing.profiles?.full_name}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {listing.profiles?.phone}
                            </span>
                          </TableCell>
                          <TableCell>{listing.price?.toLocaleString("fa-IR")} تومان</TableCell>
                          <TableCell>{listing.city}</TableCell>
                          <TableCell className="text-sm">
                            {formatDistanceToNow(new Date(listing.created_at), {
                              addSuffix: true,
                              locale: faIR,
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/listing/${listing.slug}`, "_blank")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(listing.id, "approved")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStatusChange(listing.id, "rejected")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>همه آگهی‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>عنوان</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>قیمت</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.slice(0, 20).map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">{listing.title}</TableCell>
                        <TableCell>
                          {listing.status === "pending" && <Badge variant="outline">در انتظار</Badge>}
                          {listing.status === "approved" && <Badge className="bg-green-500">تایید شده</Badge>}
                          {listing.status === "rejected" && <Badge variant="destructive">رد شده</Badge>}
                        </TableCell>
                        <TableCell>{listing.price?.toLocaleString("fa-IR")}</TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(listing.created_at), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/listing/${listing.slug}`, "_blank")}
                          >
                            مشاهده
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تحلیل SEO آگهی‌های تایید شده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {listings
                    .filter(l => l.status === "approved")
                    .slice(0, 10)
                    .map((listing) => {
                      const seoIssues = analyzeSEO(listing);
                      return (
                        <Card key={listing.id} className={seoIssues.length > 0 ? "border-yellow-500" : "border-green-500"}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{listing.title}</h3>
                                {seoIssues.length > 0 ? (
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {seoIssues.map((issue, idx) => (
                                      <li key={idx}>⚠️ {issue}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-green-600">✅ SEO بهینه است</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/listing/${listing.slug}`, "_blank")}
                              >
                                مشاهده
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
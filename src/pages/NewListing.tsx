import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, Upload, X } from "lucide-react";
import { z } from "zod";

const listingSchema = z.object({
  title: z.string().min(10, "عنوان باید حداقل ۱۰ کاراکتر باشد").max(100, "عنوان نباید بیشتر از ۱۰۰ کاراکتر باشد"),
  description: z.string().min(50, "توضیحات باید حداقل ۵۰ کاراکتر باشد").max(2000, "توضیحات نباید بیشتر از ۲۰۰۰ کاراکتر باشد"),
  price: z.number().min(0, "قیمت باید مثبت باشد"),
  city: z.string().min(2, "شهر را وارد کنید"),
  category_id: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
});

interface Category {
  id: string;
  name_fa: string;
}

export default function NewListing() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    city: "",
    address: "",
    phone: "",
    category_id: "",
    condition: "good" as "new" | "like_new" | "good" | "fair",
    is_negotiable: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("برای ثبت آگهی باید وارد شوید");
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name_fa")
      .is("parent_id", null)
      .order("sort_order");
    if (data) setCategories(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 8) {
      toast.error("حداکثر ۸ تصویر می‌توانید آپلود کنید");
      return;
    }

    setImages([...images, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (listingId: string) => {
    const uploadedUrls: { image_url: string; sort_order: number }[] = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${listingId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      uploadedUrls.push({
        image_url: publicUrl,
        sort_order: i,
      });
    }

    if (uploadedUrls.length > 0) {
      await supabase.from('listing_images').insert(
        uploadedUrls.map(img => ({
          ...img,
          listing_id: listingId,
        }))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("برای ثبت آگهی باید وارد شوید");
      navigate("/auth");
      return;
    }

    try {
      const validated = listingSchema.parse({
        ...formData,
        price: Number(formData.price),
      });

      setLoading(true);

      // Generate slug
      const slug = `${validated.title.substring(0, 30).replace(/\s+/g, '-')}-${Date.now()}`;

      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert([{
          title: validated.title,
          description: validated.description,
          price: validated.price,
          city: validated.city,
          address: formData.address,
          phone: validated.phone,
          category_id: validated.category_id,
          condition: formData.condition,
          is_negotiable: formData.is_negotiable,
          user_id: user.id,
          slug,
          meta_title: validated.title.substring(0, 60),
          meta_description: validated.description.substring(0, 160),
        }])
        .select()
        .single();

      if (listingError) throw listingError;

      // Upload images
      if (images.length > 0) {
        await uploadImages(listing.id);
      }

      toast.success("آگهی شما با موفقیت ثبت شد و در انتظار تایید است");
      navigate("/my-listings");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error("خطا در ثبت آگهی: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">ثبت آگهی جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Images */}
              <div className="space-y-3">
                <Label>تصاویر (حداکثر ۸ عکس)</Label>
                <div className="grid grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-fast flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">افزودن عکس</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">عنوان آگهی *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: گوشی سامسونگ S23 نو در حد صفر"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">دسته‌بندی *</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_fa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">توضیحات *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات کامل محصول یا خدمات خود را بنویسید..."
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  حداقل ۵۰ کاراکتر - {formData.description.length} کاراکتر
                </p>
              </div>

              {/* Price & Condition */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">قیمت (تومان) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="۱۰۰۰۰۰۰"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">وضعیت کالا</Label>
                  <Select value={formData.condition} onValueChange={(value: any) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">نو</SelectItem>
                      <SelectItem value="like_new">در حد نو</SelectItem>
                      <SelectItem value="good">خوب</SelectItem>
                      <SelectItem value="fair">متوسط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Negotiable */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="negotiable" className="cursor-pointer">قیمت قابل مذاکره است</Label>
                <Switch
                  id="negotiable"
                  checked={formData.is_negotiable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_negotiable: checked })}
                />
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">شهر *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="تهران"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">محله/منطقه</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="ولنجک"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">شماره تماس *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09123456789"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ثبت آگهی
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
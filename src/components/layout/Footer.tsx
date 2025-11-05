import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t bg-card mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-glow">
                آ
              </div>
              <span className="text-xl font-bold text-gradient">آگهی یاب</span>
            </div>
            <p className="text-sm text-muted-foreground">
              بزرگترین پلتفرم آگهی و نیازمندی‌های آنلاین
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">دسته‌بندی‌ها</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/listings?category=real-estate" className="hover:text-primary transition-fast">
                  املاک
                </Link>
              </li>
              <li>
                <Link to="/listings?category=vehicles" className="hover:text-primary transition-fast">
                  وسایل نقلیه
                </Link>
              </li>
              <li>
                <Link to="/listings?category=digital-goods" className="hover:text-primary transition-fast">
                  کالای دیجیتال
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">خدمات</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/new-listing" className="hover:text-primary transition-fast">
                  ثبت آگهی
                </Link>
              </li>
              <li>
                <Link to="/listings" className="hover:text-primary transition-fast">
                  جستجوی آگهی
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">درباره ما</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition-fast">
                  درباره آگهی یاب
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-fast">
                  تماس با ما
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© ۱۴۰۳ آگهی یاب. تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
};
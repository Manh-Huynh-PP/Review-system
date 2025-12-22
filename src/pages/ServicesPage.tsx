

import { ArrowLeft, Check, Server, Shield, Zap, Database, Mail, MessageSquare, Linkedin, AtSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function ServicesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            <div className="max-w-6xl mx-auto py-12 px-6">
                {/* Header */}
                <header className="mb-16">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại Trang chủ
                    </Link>
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <Zap className="w-4 h-4" />
                            <span>Dịch vụ Setup</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            Setup Hệ thống Review
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Hỗ trợ triển khai hệ thống Review cho dự án của bạn.
                        </p>
                    </div>
                </header>

                {/* Main Content Container */}
                <div className="max-w-5xl mx-auto">
                    {/* Self-Setup Option */}
                    <div className="mb-12 bg-gradient-to-br from-blue-500/5 via-background to-background border border-blue-500/20 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Server className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">Tự cài đặt</h3>
                                <p className="text-muted-foreground mb-4">
                                    Dự án này là mã nguồn mở. Bạn có thể tự triển khai theo tài liệu hướng dẫn.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Link to="/installation">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Zap className="w-4 h-4" />
                                            Hướng dẫn Cài đặt
                                        </Button>
                                    </Link>
                                    <Link to="/usage">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Database className="w-4 h-4" />
                                            Hướng dẫn Sử dụng
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-12">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-4 text-sm text-muted-foreground">
                                Dịch vụ triển khai chuyên nghiệp
                            </span>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-20">
                        {/* Standard Plan */}
                        <div className="relative bg-card rounded-2xl border border-border p-8 shadow-sm hover:shadow-md transition-all flex flex-col">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-muted px-4 py-1 rounded-full border border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Gói Tiêu chuẩn
                            </div>
                            <div className="text-center mb-6 mt-4">
                                <div className="text-3xl font-bold">3.000.000 <span className="text-lg font-normal text-muted-foreground">VND</span></div>
                                <p className="text-sm text-muted-foreground mt-1">Thanh toán 1 lần duy nhất</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                <FeatureItem text="Deploy lên Vercel & Firebase (Free Tier)" />
                                <FeatureItem text="Cấu hình Tên miền riêng (Custom Domain)" />
                                <FeatureItem text="Giao diện cơ bản (Dark/Light Mode)" />
                                <FeatureItem text="Hướng dẫn sử dụng chi tiết" />
                                <FeatureItem text="Bàn giao 100% Source Code" />
                            </ul>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Liên hệ Tư vấn
                            </Button>
                        </div>

                        {/* Advanced Plan */}
                        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl border-2 border-primary/30 p-8 shadow-lg hover:shadow-xl transition-all flex flex-col">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wide">
                                Khuyên dùng
                            </div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold shadow-lg uppercase tracking-wide">
                                Gói Nâng cao
                            </div>
                            <div className="text-center mb-6 mt-4">
                                <div className="text-4xl font-bold text-primary">5.500.000 <span className="text-lg font-normal text-primary/80">VND</span></div>
                                <p className="text-sm text-muted-foreground mt-1">Thanh toán 1 lần duy nhất</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                <FeatureItem text="Tất cả tính năng gói Tiêu chuẩn" highlight />
                                <FeatureItem text="Full Branding (Logo, Màu sắc thương hiệu)" highlight />
                                <FeatureItem text="Hỗ trợ kỹ thuật 1 năm" highlight />
                            </ul>
                            <Button
                                className="w-full font-bold"
                                size="lg"
                                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Liên hệ ngay
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Technical Info */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                        <Server className="w-6 h-6" />
                        Thông tin Kỹ thuật & Hạ tầng
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <TechCard
                            icon={<Zap className="w-6 h-6 text-yellow-500" />}
                            title="Chi phí Hàng tháng"
                            value="0 VND"
                            desc="Sử dụng Free Tier của Vercel (Frontend) và Firebase (Backend)."
                        />
                        <TechCard
                            icon={<Database className="w-6 h-6 text-blue-500" />}
                            title="Lưu trữ & Băng thông"
                            value="5GB Storage"
                            desc="Đủ cho hàng trăm dự án đang hoạt động. 50k lượt đọc/ghi mỗi ngày."
                        />
                        <TechCard
                            icon={<Shield className="w-6 h-6 text-green-500" />}
                            title="Bảo mật & Quyền"
                            value="Toàn quyền"
                            desc="Bạn sở hữu hoàn toàn dữ liệu và source code. Không phụ thuộc vào bên thứ 3."
                        />
                    </div>
                    <div className="mt-8 bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground text-center border border-border">
                        <strong>Lưu ý:</strong> Chi phí trên chưa bao gồm phí mua Tên miền (Domain). Dịch vụ chỉ bao gồm việc cài đặt kỹ thuật, không bao gồm đào tạo quy trình làm việc (workflow) chi tiết ngoài tài liệu hướng dẫn.
                    </div>
                </div>

                {/* Contact Footer */}
                <div id="contact" className="mt-32 border-t border-border pt-16 pb-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">Liên hệ</h2>
                        <p className="text-muted-foreground mb-12">
                            Cần tư vấn hoặc có thắc mắc? Liên hệ với tôi qua các kênh sau
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            {/* Zalo/Viber */}
                            <a
                                href="tel:+84359312806"
                                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                    <MessageSquare className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs text-muted-foreground mb-1">Zalo / Viber</div>
                                    <div className="font-semibold">+84 359 312 806</div>
                                </div>
                            </a>

                            {/* Email */}
                            <a
                                href="mailto:admin@manhhuynh.work"
                                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <Mail className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                                    <div className="font-semibold">admin@manhhuynh.work</div>
                                </div>
                            </a>

                            {/* Threads */}
                            <a
                                href="https://www.threads.com/@manh.des.98"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <AtSign className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs text-muted-foreground mb-1">Threads</div>
                                    <div className="font-semibold">@manh.des.98</div>
                                </div>
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="https://www.linkedin.com/in/manh-huynh-designer/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-blue-700/10 rounded-lg group-hover:bg-blue-700/20 transition-colors">
                                    <Linkedin className="w-6 h-6 text-blue-700" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs text-muted-foreground mb-1">LinkedIn</div>
                                    <div className="font-semibold">Mạnh Huỳnh</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ text, highlight = false }: { text: string, highlight?: boolean }) {
    return (
        <li className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-0.5 ${highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Check className="w-3 h-3" />
            </div>
            <span className={highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>{text}</span>
        </li>
    )
}

function TechCard({ icon, title, value, desc }: { icon: React.ReactNode, title: string, value: string, desc: string }) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border text-center">
            <div className="inline-flex justify-center items-center p-3 bg-secondary rounded-full mb-4">
                {icon}
            </div>
            <h3 className="font-semibold text-muted-foreground mb-1">{title}</h3>
            <div className="text-xl font-bold text-foreground mb-2">{value}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    )
}

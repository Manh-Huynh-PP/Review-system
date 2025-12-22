import { ArrowLeft, Globe, User, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '@/stores/language'
import { Button } from '@/components/ui/button'

const content = {
    vi: {
        backHome: 'Quay lại Trang chủ',
        title: 'Hướng dẫn Sử dụng',
        subtitle: 'Tài liệu chi tiết cho Admin và Reviewer.',
        admin: {
            title: 'Dành cho Admin (Người tạo)',
            desc: 'Quản lý dự án, file và phiên bản.',
            items: [
                {
                    title: '1. Tạo Tài khoản & Đăng nhập',
                    content: 'Tạo tài khoản qua Firebase Console (Authentication > Add User) hoặc đăng nhập bằng Google. Truy cập /login để vào Dashboard.'
                },
                {
                    title: '2. Quản lý Dự án',
                    content: 'Tạo dự án mới: Nhấn "New Project". Archive dự án: Vào Settings > Archive để ẩn dự án đã hoàn thành khỏi Dashboard chính.'
                },
                {
                    title: '3. Upload & Quản lý File',
                    content: 'Upload file (Kéo thả). Khóa bình luận: Nhấn icon "Lock" trên toolbar để chặn thêm feedback cho version đó.'
                },
                {
                    title: '4. Chia sẻ Link',
                    content: 'Nhấn nút Share để lấy link review công khai. Gửi link này cho khách hàng (họ không cần tài khoản).'
                }
            ]
        },
        reviewer: {
            title: 'Dành cho Reviewer (Khách hàng)',
            desc: 'Xem và phản hồi về các asset thiết kế.',
            items: [
                {
                    title: 'Truy cập Link',
                    content: 'Không cần tài khoản. Nhập tên hiển thị của bạn để bắt đầu.'
                },
                {
                    title: 'Công cụ Review',
                    content: 'Vẽ trực tiếp lên ảnh. Dùng các công cụ: Bút, Hình chữ nhật, Mũi tên.'
                },
                {
                    title: 'Bình luận Video',
                    content: 'Bình luận sẽ tự động gắn thẻ thời gian (timestamp) hiện tại của video.'
                },
                {
                    title: 'Mô hình 3D',
                    content: 'Xoay, phóng to, thu nhỏ mô hình để kiểm tra chi tiết mọi góc độ.'
                }
            ]
        }
    },
    en: {
        backHome: 'Back to Home',
        title: 'User Guide',
        subtitle: 'Detailed documentation for Admins and Reviewers.',
        admin: {
            title: 'For Admins (Creators)',
            desc: 'Manage projects, files, and versions.',
            items: [
                {
                    title: '1. Account Setup & Login',
                    content: 'Create account via Firebase Console (Authentication > Add User) or sign in with Google. Access /login to enter Dashboard.'
                },
                {
                    title: '2. Managing Projects',
                    content: 'Create "New Project". Archive Projects: Go to Settings > Archive to hide completed projects from main view.'
                },
                {
                    title: '3. Upload & File Management',
                    content: 'Upload files (Drag & Drop). Lock Comments: Click "Lock" icon on toolbar to prevent further feedback on a version.'
                },
                {
                    title: '4. Sharing',
                    content: 'Click "Share" to generate a public review link. Send this link to clients (no account required for them).'
                }
            ]
        },
        reviewer: {
            title: 'For Reviewers (Clients)',
            desc: 'View and provide feedback on assets.',
            items: [
                {
                    title: 'Accessing Links',
                    content: 'No account required. Enter your display name to start reviewing.'
                },
                {
                    title: 'Review Tools',
                    content: 'Draw directly on images using Pen, Rectangle, and Arrow tools.'
                },
                {
                    title: 'Video Comments',
                    content: 'Comments are automatically tagged with the current video timestamp.'
                },
                {
                    title: '3D Models',
                    content: 'Orbit, pan, and zoom to inspect models from every angle.'
                }
            ]
        }
    }
}

export default function UsagePage() {
    const { language, toggleLanguage } = useLanguageStore()
    const t = content[language]

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <div className="max-w-5xl mx-auto py-12 px-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t.backHome}
                    </Link>
                    <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-2">
                        <Globe className="w-4 h-4" />
                        {language.toUpperCase()}
                    </Button>
                </div>

                {/* Hero */}
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h1 className="text-4xl font-extrabold mb-4 text-primary tracking-tight">{t.title}</h1>
                    <p className="text-xl text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Admin Section */}
                    <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="bg-primary/5 p-6 border-b border-border">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">{t.admin.title}</h2>
                            <p className="text-muted-foreground mt-2">{t.admin.desc}</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {t.admin.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Reviewer Section */}
                    <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="bg-blue-500/5 p-6 border-b border-border">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500">
                                <User className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">{t.reviewer.title}</h2>
                            <p className="text-muted-foreground mt-2">{t.reviewer.desc}</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {t.reviewer.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

import { ArrowLeft, Globe, Copy, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '@/stores/language'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const content = {
    vi: {
        backHome: 'Quay lại Trang chủ',
        title: 'Hướng dẫn Cài đặt',
        subtitle: 'Hướng dẫn từng bước để thiết lập Review System trên máy của bạn.',
        prerequisites: {
            title: 'Yêu cầu tiên quyết',
            items: [
                'Node.js (v18 trở lên)',
                'Git',
                'Tài khoản Google cho Firebase'
            ]
        },
        sections: [
            {
                title: '1. Clone Repository',
                desc: 'Mở terminal và clone dự án về máy:',
                code: 'git clone https://github.com/Manh-Huynh-Opensource/Review-system.git\ncd Review-system'
            },
            {
                title: '2. Cài đặt Dependencies',
                desc: 'Cài đặt các thư viện cần thiết bằng npm:',
                code: 'npm install'
            },
            {
                title: '3. Cấu hình Firebase',
                desc: 'Dự án sử dụng Firebase cho Auth, Database và Storage. Bạn cần tạo project của riêng mình.',
                steps: [
                    'Truy cập Firebase Console và tạo project mới.',
                    'Bật Authentication (Google Sign-in).',
                    'Tạo Firestore Database (Test mode).',
                    'Bật Storage (Test mode).'
                ]
            },
            {
                title: '4. Biến môi trường',
                desc: 'Tạo file .env từ file mẫu và điền thông tin config của bạn:',
                code: 'cp .env.example .env',
                keyInstructions: {
                    title: 'Cách lấy Firebase Keys:',
                    steps: [
                        'Vào Project settings (biểu tượng bánh răng).',
                        'Kéo xuống phần "Your apps".',
                        'Chọn Web App (hoặc tạo mới </>)',
                        'Chọn "Config" để xem firebaseConfig object',
                        'Copy từng giá trị tương ứng vào file .env'
                    ]
                }
            },
            {
                title: '5. Chạy Local',
                desc: 'Khởi chạy server phát triển:',
                code: 'npm run dev'
            },
            {
                title: '6. Build & Deploy',
                desc: 'Build cho production:',
                code: 'npm run build',
                deployment: {
                    title: 'Deploy lên Vercel:',
                    steps: [
                        'Đẩy code lên GitHub.',
                        'Tạo project mới trên Vercel và import repo.',
                        'Framework Preset: Vite.',
                        'Quan trọng: Copy toàn bộ nội dung .env vào phần Environment Variables trên Vercel.',
                        'Nhấn Deploy.'
                    ]
                }
            },
            {
                title: 'Hỗ trợ',
                desc: 'Nếu gặp khó khăn trong quá trình cài đặt, vui lòng liên hệ:',
                contact: 'admin@mahhuynh.work'
            }
        ]
    },
    en: {
        backHome: 'Back to Home',
        title: 'Installation Guide',
        subtitle: 'Step-by-step instructions to set up the Review System locally.',
        prerequisites: {
            title: 'Prerequisites',
            items: [
                'Node.js (v18 or higher)',
                'Git',
                'Google Account for Firebase'
            ]
        },
        sections: [
            {
                title: '1. Clone the Repository',
                desc: 'Open your terminal and clone the project:',
                code: 'git clone https://github.com/Manh-Huynh-Opensource/Review-system.git\ncd Review-system'
            },
            {
                title: '2. Install Dependencies',
                desc: 'Install required packages using npm:',
                code: 'npm install'
            },
            {
                title: '3. Configure Firebase',
                desc: 'The app uses Firebase for Auth, Database, and Storage. You need to create your own project.',
                steps: [
                    'Go to Firebase Console and create a new project.',
                    'Enable Authentication (Google Sign-in).',
                    'Create Firestore Database (Test mode).',
                    'Enable Storage (Test mode).'
                ]
            },
            {
                title: '4. Environment Variables',
                desc: 'Create .env file from the example and fill in your keys:',
                code: 'cp .env.example .env',
                keyInstructions: {
                    title: 'How to get Firebase Keys:',
                    steps: [
                        'Go to Project settings (gear icon).',
                        'Scroll to "Your apps".',
                        'Select Web App (or register new </>)',
                        'Select "Config" radio button',
                        'Copy values to your .env file'
                    ]
                }
            },
            {
                title: '5. Run Locally',
                desc: 'Start the development server:',
                code: 'npm run dev'
            },
            {
                title: '6. Build & Deploy',
                desc: 'Build for production:',
                code: 'npm run build',
                deployment: {
                    title: 'Deploy to Vercel:',
                    steps: [
                        'Push code to GitHub.',
                        'Create new project on Vercel and import repo.',
                        'Framework Preset: Vite.',
                        'Important: Add all .env variables to Vercel Environment Variables.',
                        'Click Deploy.'
                    ]
                }
            },
            {
                title: 'Support',
                desc: 'If you have issues during installation, please contact:',
                contact: 'admin@mahhuynh.work'
            }
        ]
    }
}

export default function InstallationPage() {
    const { language, toggleLanguage } = useLanguageStore()
    const t = content[language]

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <div className="max-w-4xl mx-auto py-12 px-6">
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
                <div className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-primary tracking-tight">{t.title}</h1>
                    <p className="text-xl text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="space-y-12">
                    {/* Prerequisites */}
                    <section className="bg-secondary/30 p-6 rounded-xl border border-border/50">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            {t.prerequisites.title}
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            {t.prerequisites.items.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </section>

                    {/* Steps */}
                    {/* @ts-ignore */}
                    {t.sections.map((section: any, idx) => (
                        <section key={idx} className="relative pl-8 border-l-2 border-primary/20 hover:border-primary transition-colors">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                            <p className="text-muted-foreground mb-4">{section.desc}</p>

                            {section.steps && (
                                <ul className="list-decimal list-inside space-y-2 text-muted-foreground mb-4 bg-card p-4 rounded-lg border">
                                    {/* @ts-ignore */}
                                    {section.steps.map((step: any, sIdx: number) => (
                                        <li key={sIdx}>{step}</li>
                                    ))}
                                </ul>
                            )}

                            {section.code && (
                                <CodeBlock code={section.code} />
                            )}

                            {/* @ts-ignore */}
                            {section.keyInstructions && (
                                <div className="bg-muted p-4 rounded-lg mt-4 border border-border">
                                    {/* @ts-ignore */}
                                    <h3 className="font-semibold mb-2">{section.keyInstructions.title}</h3>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {/* @ts-ignore */}
                                        {section.keyInstructions.steps.map((kStep: any, kIdx: number) => (
                                            <li key={kIdx}>{kStep}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* @ts-ignore */}
                            {section.deployment && (
                                <div className="bg-blue-500/10 p-4 rounded-lg mt-4 border border-blue-500/20">
                                    {/* @ts-ignore */}
                                    <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">{section.deployment.title}</h3>
                                    <ul className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                                        {/* @ts-ignore */}
                                        {section.deployment.steps.map((dStep: any, dIdx: number) => (
                                            <li key={dIdx}>{dStep}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* @ts-ignore */}
                            {section.contact && (
                                <p className="mt-2 font-medium text-primary">
                                    <a href={`mailto:${section.contact}`} className="hover:underline">{section.contact}</a>
                                </p>
                            )}

                            {/* @ts-ignore */}
                            {section.note && (
                                <p className="text-sm text-amber-500 mt-2 italic">Note: {section.note}</p>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    )
}

function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    const copy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative group">
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                {code}
            </pre>
            <button
                onClick={copy}
                className="absolute top-2 right-2 p-2 rounded bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
            >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    )
}

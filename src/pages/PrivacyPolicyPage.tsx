import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <div className="max-w-4xl mx-auto py-12 px-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-extrabold mb-8 text-primary">Privacy Policy</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Effective Date: December 22, 2025
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                        <p>
                            Welcome to the Creative Asset Review System. Your privacy is important to us.
                            This Privacy Policy explains how we collect, use, and protect your information when you use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Account Information (Admins):</strong> When you sign in via Google, we collect your email address and profile picture for authentication purposes.
                            </li>
                            <li>
                                <strong>Reviewer Information (Guests):</strong> We may store a display name you provide locally on your device to identify your comments.
                            </li>
                            <li>
                                <strong>Usage Data:</strong> We may collect anonymous data about how you interact with the application to improve performance and user experience.
                            </li>
                            <li>
                                <strong>Uploaded Content:</strong> Files (images, videos, models) uploaded to the system are stored securely in our cloud storage provider.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                        <p>We use the collected information solely to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide and maintain the service.</li>
                            <li>Authenticate your access to the admin dashboard.</li>
                            <li>Enable collaboration features like comments and annotations.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Data Sharing and Disclosure</h2>
                        <p>
                            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
                            Data may be shared with trusted third-party service providers (like Firebase) who assist us in operating our application,
                            so long as those parties agree to keep this information confidential.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                        <p>
                            We implement a variety of security measures to maintain the safety of your personal information.
                            However, no method of transmission over the Internet or method of electronic storage is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
                        <p>
                            You have the right to access, correct, or delete your personal information.
                            If you wish to remove your account or data, please contact the project administrator.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:contact@manhhuynh.work" className="text-primary hover:underline">contact@manhhuynh.work</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

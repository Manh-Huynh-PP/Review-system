import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TermsOfServicePage() {
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

                <h1 className="text-4xl font-extrabold mb-8 text-primary">Terms of Service</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Effective Date: December 22, 2025
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the Creative Asset Review System (the "Service"), you agree to be bound by these Terms of Service.
                            If you disagree with any part of the terms, you may not access the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
                        <p>
                            This project is open-source software licensed under the <strong>CC BY-NC 4.0</strong> (Attribution-NonCommercial 4.0 International) License.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>You may copy, distribute, and display the material for non-commercial purposes.</li>
                            <li>You must give appropriate credit to the original author.</li>
                            <li>You may not use this material for commercial purposes without explicit permission.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. User Conduct</h2>
                        <p>
                            You agree not to use the Service:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>In any way that violates any applicable national or international law or regulation.</li>
                            <li>To transmit, or procure the sending of, any advertising or promotional material.</li>
                            <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Intellectual Property</h2>
                        <p>
                            The Service and its original content, features, and functionality are and will remain the exclusive property of the developers and its licensors.
                            Content uploaded by users remains the property of the respective users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Termination</h2>
                        <p>
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever,
                            including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
                        <p>
                            In no event shall the developers be liable for any indirect, incidental, special, consequential or punitive damages,
                            including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Changes</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
                            We will try to provide at least 30 days' notice prior to any new terms taking effect.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

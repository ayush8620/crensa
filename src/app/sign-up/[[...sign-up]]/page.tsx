import { SignUp } from '@clerk/nextjs';
import { AuthPageLayout, crensaAuthTheme } from '@/components/auth';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { userRepository } from '@/lib/database/repositories';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
 const { userId } = await auth();

 // If user is already signed in, check their existing profile
 if (userId) {
 const existingUser = await userRepository.findByClerkId(userId);

 if (existingUser) {
 if (existingUser.role === 'member') {
 // Already a member — send them to their dashboard
 redirect('/dashboard');
 }

 // Already a creator — block and show message
 return (
 <AuthPageLayout
 title="Account Already Exists"
 subtitle="You already have an account on Crensa"
 >
 <div className="text-center py-8 px-4">
 <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
 <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
 </svg>
 </div>
 <p className="text-white text-lg font-semibold mb-2">
 This account is already registered as a creator
 </p>
 <p className="text-neutral-white/60 text-sm mb-6">
 Each account can only have one role. You cannot sign up as a member with an existing creator account.
 </p>
 <Link
 href="/creator/dashboard"
 className="inline-flex items-center justify-center px-6 py-3 bg-accent-pink hover:bg-accent-bright-pink text-white font-semibold rounded-lg transition-colors duration-200"
 >
 Go to Creator Dashboard
 </Link>
 </div>
 </AuthPageLayout>
 );
 }
 }

 const role = 'member';

 return (
 <AuthPageLayout
 title="Join Crensa"
 subtitle="Create your account and discover amazing content instantly"
 >
 {/* Creator Signup Button - Top Section */}
 <div className="mb-6 text-center">
 <Link
 href="/creator-signup"
 className="inline-flex items-center justify-center px-6 py-3 bg-accent-pink hover:bg-accent-bright-pink text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
 >
 Sign up as a Creator
 </Link>
 <p className="text-neutral-white/60 text-sm mt-2">
 Want to monetize your content? Join as a creator instead
 </p>
 </div>

 <SignUp
 appearance={crensaAuthTheme}
 forceRedirectUrl={`/api/auth/post-signup?role=${role}`}
 signInUrl="/sign-in"
 unsafeMetadata={{ role }}
 />
 </AuthPageLayout>
 );
}

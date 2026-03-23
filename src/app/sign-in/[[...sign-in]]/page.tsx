import { SignIn } from '@clerk/nextjs';
import { AuthPageLayout, crensaAuthTheme } from '@/components/auth';

export default async function SignInPage({
 searchParams,
}: {
 searchParams: Promise<{ role?: string }>;
}) {
 const params = await searchParams;
 const role = params.role || 'member';
 const isCreator = role === 'creator';

 return (
 <AuthPageLayout
 title="Welcome Back"
 subtitle={
 isCreator
 ? 'Sign in to your creator account and start creating'
 : 'Sign in to discover amazing content'
 }
 >
 <SignIn
 appearance={crensaAuthTheme}
 forceRedirectUrl="/api/auth/post-signin"
 unsafeMetadata={{ role }}
 />
 </AuthPageLayout>
 );
}
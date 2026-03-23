import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { userRepository } from '@/lib/database/repositories';

export async function GET(request: NextRequest) {
 try {
 const { userId } = await auth();
 const clerkUser = await currentUser();
 
 if (!userId || !clerkUser) {
 return NextResponse.redirect(new URL('/sign-in', request.url));
 }

 const user = await userRepository.findByClerkId(userId);
 
 if (!user) {
 // User signed in but no profile found - check Clerk metadata for intended role
 console.warn('User signed in but no profile found, checking role from Clerk metadata');
 
 // Check unsafeMetadata for role (set during signup attempt)
 const clerkRole = clerkUser.unsafeMetadata?.role as string | undefined;
 const intendedRole = clerkRole && ['creator', 'member'].includes(clerkRole) ? clerkRole : 'member';
 
 // Redirect to appropriate signup page to complete profile creation
 const signupUrl = intendedRole === 'creator' ? '/creator-signup' : '/sign-up';
 console.log(`Redirecting to ${signupUrl} for role: ${intendedRole}`);
 return NextResponse.redirect(new URL(signupUrl, request.url));
 }

 const dashboardUrl = user.role === 'creator' 
 ? '/creator/dashboard' 
 : '/dashboard';
 
 return NextResponse.redirect(new URL(dashboardUrl, request.url));
 
 } catch (error) {
 console.error('Error in post-signin handler:', error);
 return NextResponse.redirect(new URL('/dashboard', request.url));
 }
}

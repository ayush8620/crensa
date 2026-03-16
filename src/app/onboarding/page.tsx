'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { UserRole } from '@/contexts/AuthContext';

function OnboardingPage() {
 const { user } = useUser();
 const router = useRouter();
 const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [checkingProfile, setCheckingProfile] = useState(true);

 useEffect(() => {
 const checkExistingProfile = async () => {
 if (!user) {

 console.log('Onboarding: No user found, redirecting to sign-up');
 router.push('/sign-up');
 return;
 }

 try {
 const response = await fetch('/api/auth/profile');
 if (response.ok) {
 const data = await response.json();

 console.log('Onboarding: Profile found, redirecting to dashboard');
 if (data.user.role === 'creator') {
 router.push('/creator/dashboard');
 } else {
 router.push('/dashboard');
 }
 return;
 } else if (response.status === 404) {

 console.warn('Onboarding: No profile found for authenticated user - showing role selection');
 }
 } catch (error) {
 console.error('Onboarding: Error checking profile:', error);
 }
 
 setCheckingProfile(false);
 };

 checkExistingProfile();
 }, [user, router]);

 if (checkingProfile) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
 <div className="text-white text-xl">Checking your profile...</div>
 </div>
 </div>
 );
 }

 const handleRoleSelection = async (role: UserRole) => {
 if (!user || isLoading) return;

 setIsLoading(true);
 
 try {
 const response = await fetch('/api/auth/setup-profile', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 role,
 email: user.emailAddresses[0]?.emailAddress,
 username: user.username || user.firstName || `user_${Date.now()}`,
 }),
 });

 const data = await response.json();

 if (response.ok) {
 console.log('Profile setup successful:', data);

 await new Promise(resolve => setTimeout(resolve, 1000));

 if (role === 'creator') {
 window.location.href = '/creator/dashboard';
 } else {
 window.location.href = '/dashboard';
 }
 } else if (response.status === 409) {

 // Redirect to the EXISTING role's dashboard, not the requested one
 console.log('Profile already exists, redirecting to existing role dashboard...');
 const existingRole = data?.user?.role;
 if (existingRole === 'creator') {
 window.location.href = '/creator/dashboard';
 } else {
 window.location.href = '/dashboard';
 }
 } else {
 console.error('Failed to setup profile:', data);
 alert(`Failed to setup profile: ${data.error || 'Unknown error'}`);
 }
 } catch (error) {
 console.error('Error setting up profile:', error);
 alert('Network error occurred. Please try again.');
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
 <div className="max-w-2xl w-full mx-4">
 <div className="text-center mb-12">
 <h1 className="text-4xl font-bold text-white mb-4">Welcome to Crensa!</h1>
 <p className="text-xl text-gray-300">Choose how you want to use Crensa</p>
 </div>

 <div className="grid md:grid-cols-2 gap-8">
 {}
 <div
 className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 cursor-pointer transition-all duration-300 ${
 selectedRole === 'creator'
 ? 'border-purple-400 bg-white/20'
 : 'border-white/20 hover:border-white/40 hover:bg-white/15'
 }`}
 onClick={() => setSelectedRole('creator')}
 >
 <div className="text-center">
 <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
 </svg>
 </div>
 <h3 className="text-2xl font-bold text-white mb-3">Creator</h3>
 <p className="text-gray-300 mb-6">
 Upload and monetize your short video content. Set your own pricing and earn from every view.
 </p>
 <ul className="text-sm text-gray-400 space-y-2">
 <li>• Upload unlimited videos</li>
 <li>• Set custom pricing</li>
 <li>• Track earnings & analytics</li>
 <li>• Share content easily</li>
 </ul>
 </div>
 </div>

 {}
 <div
 className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 cursor-pointer transition-all duration-300 ${
 selectedRole === 'member'
 ? 'border-blue-400 bg-white/20'
 : 'border-white/20 hover:border-white/40 hover:bg-white/15'
 }`}
 onClick={() => setSelectedRole('member')}
 >
 <div className="text-center">
 <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 013-3h6a3 3 0 013 3v2M7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2z" />
 </svg>
 </div>
 <h3 className="text-2xl font-bold text-white mb-3">Member</h3>
 <p className="text-gray-300 mb-6">
 Discover and watch amazing content from creators. Pay only for what you watch.
 </p>
 <ul className="text-sm text-gray-400 space-y-2">
 <li>• Browse trending content</li>
 <li>• Pay-per-view system</li>
 <li>• Wallet management</li>
 <li>• Exclusive member content</li>
 </ul>
 </div>
 </div>
 </div>

 {selectedRole && (
 <div className="text-center mt-8">
 <button
 onClick={() => handleRoleSelection(selectedRole)}
 disabled={isLoading}
 className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isLoading ? 'Setting up your account...' : `Continue as ${selectedRole === 'creator' ? 'Creator' : 'Member'}`}
 </button>
 </div>
 )}
 </div>
 </div>
 );
}

export default OnboardingPage;
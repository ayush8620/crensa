import React from 'react';

interface AuthPageLayoutProps {
 children: React.ReactNode;
 title: string;
 subtitle: string;
}

export default function AuthPageLayout({ children, title, subtitle }: AuthPageLayoutProps) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-navy via-primary-navy/90 to-primary-navy/80">
 {}
 <div className="absolute inset-0 bg-gradient-to-br from-primary-neon-yellow/5 via-transparent to-accent-pink/5 pointer-events-none" />
 
 <div className="relative max-w-md w-full mx-4 z-10">
 {}
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold text-neutral-white mb-2 animate-fade-in-up">
 {title}
 </h1>
 <p className="text-neutral-white/80 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
 {subtitle}
 </p>
 </div>
 
 {}
 <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
 {children}
 </div>
 </div>
 </div>
 );
}

export const crensaAuthTheme = {
 elements: {

 formButtonPrimary: 
 "bg-primary-neon-yellow hover:bg-primary-light-yellow text-primary-navy font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl",

 card: "bg-neutral-white/95 backdrop-blur-sm shadow-2xl border border-neutral-white/20 rounded-xl",

 headerTitle: "text-primary-navy font-bold text-xl",
 headerSubtitle: "text-neutral-dark-gray",

 socialButtonsBlockButton: 
 "bg-neutral-white border-neutral-gray text-primary-navy hover:bg-neutral-gray transition-colors duration-200 shadow-sm hover:shadow-md",

 formFieldInput: 
 "border-neutral-gray focus:border-primary-navy focus:ring-2 focus:ring-primary-navy/20 bg-neutral-white text-primary-navy placeholder:text-neutral-dark-gray transition-all duration-200",

 formFieldLabel: "text-primary-navy font-medium",

 // Hide "Optional" hint on first name field only, show * instead
 formFieldOptionalFieldHint__firstName: "hidden",
 formFieldLabel__firstName: "text-primary-navy font-medium after:content-['*'] after:ml-0.5 after:text-red-500",

 footerActionLink: "text-accent-pink hover:text-accent-bright-pink transition-colors duration-200 font-medium",

 identityPreviewText: "text-primary-navy",

 formButtonReset: "text-accent-pink hover:text-accent-bright-pink transition-colors duration-200",

 dividerLine: "bg-neutral-gray",
 dividerText: "text-neutral-dark-gray",

 formFieldErrorText: "text-red-500",

 spinner: "text-primary-navy",

 formFieldSuccessText: "text-accent-green",

 formFieldAction: "text-accent-pink hover:text-accent-bright-pink",
 formFieldHintText: "text-neutral-dark-gray text-sm",

 formFieldInputShowPasswordButton: "text-neutral-dark-gray hover:text-primary-navy",

 otpCodeFieldInput: "border-neutral-gray focus:border-primary-navy focus:ring-2 focus:ring-primary-navy/20 text-primary-navy",

 alertText: "text-primary-navy",

 badge: "bg-primary-neon-yellow text-primary-navy",

 menuButton: "text-primary-navy hover:bg-neutral-gray",
 menuList: "bg-neutral-white border-neutral-gray shadow-xl",

 profileSectionPrimaryButton: "bg-primary-neon-yellow hover:bg-primary-light-yellow text-primary-navy",

 navbarButton: "text-primary-navy hover:bg-neutral-gray",

 pageScrollBox: "bg-neutral-white",

 rootBox: "bg-transparent",

 form: "space-y-4",

 cardBox: "bg-neutral-white/95 backdrop-blur-sm",

 footer: "text-center",

 header: "text-center mb-6",
 },
 layout: {
 logoImageUrl: undefined, // Can be set to Crensa logo URL if available
 showOptionalFields: true,
 },
 variables: {
 colorPrimary: '#CCE53F', // Neon yellow
 colorDanger: '#ef4444', // Red for errors
 colorSuccess: '#62CF6F', // Green for success
 colorWarning: '#f59e0b', // Orange for warnings
 colorNeutral: '#6C757D', // Dark gray
 colorText: '#01164D', // Navy
 colorTextOnPrimaryBackground: '#01164D', // Navy on yellow
 colorTextSecondary: '#6C757D', // Dark gray
 colorBackground: '#FFFFFF', // White
 colorInputBackground: '#FFFFFF', // White
 colorInputText: '#01164D', // Navy
 borderRadius: '0.75rem', // Rounded-xl
 fontFamily: 'var(--font-inter), system-ui, sans-serif',
 fontSize: '0.875rem', // text-sm
 fontWeight: {
 normal: '400',
 medium: '500',
 semibold: '600',
 bold: '700',
 },
 },
};
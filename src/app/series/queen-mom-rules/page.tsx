'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowLeft, Crown } from 'lucide-react';

export default function QueenMomRulesSeriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-gray via-white to-neutral-light-gray">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-primary-navy hover:text-accent-pink transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Home</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Series Thumbnail */}
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/image.png"
              alt="Queen Mom Rules"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Series Info */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-pink/10 rounded-full text-accent-pink font-semibold mb-4">
                <Clock className="w-4 h-4 animate-pulse" />
                Coming Soon
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-primary-navy mb-4 flex items-center gap-3">
                Queen Mom Rules
                <Crown className="w-10 h-10 text-accent-pink" />
              </h1>
              
              <p className="text-lg text-neutral-dark-gray leading-relaxed mb-6">
                A CEO is humiliated and kicked out of her parents anniversary dinner. 
                A powerful story about family, resilience, and the strength of a woman who refuses to be defined by others.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {["Family", "Strong Female Lead", "CEO", "Drama"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-neutral-light-gray text-neutral-dark-gray px-4 py-2 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent-pink/10 to-accent-teal/10 border-2 border-accent-pink/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-primary-navy mb-3">
                👑 Videos Coming Soon
              </h3>
              <p className="text-neutral-dark-gray">
                We are working hard to bring you this powerful story. Check back soon for updates!
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-pink to-accent-bright-pink text-white font-bold rounded-2xl hover:from-accent-bright-pink hover:to-accent-pink transition-all duration-300 transform hover:scale-105"
            >
              Explore More Series
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

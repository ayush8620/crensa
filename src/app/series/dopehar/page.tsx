'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';

export default function DopeharSeriesPage() {
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
              src="/images/series/dopehar.jpg"
              alt="Dopehar"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Series Info */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-teal/10 rounded-full text-accent-teal font-semibold mb-4">
                <Clock className="w-4 h-4 animate-pulse" />
                Coming Soon
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-primary-navy mb-4">
                Dopehar
              </h1>
              
              <p className="text-lg text-neutral-dark-gray leading-relaxed mb-6">
                From the makers of... An exciting new series coming your way! Stay tuned for an action-packed drama that will keep you on the edge of your seat.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {["Drama", "Action", "Thriller"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-neutral-light-gray text-neutral-dark-gray px-4 py-2 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent-pink/10 to-accent-teal/10 border-2 border-accent-teal/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-primary-navy mb-3">
                🎬 Videos Coming Soon
              </h3>
              <p className="text-neutral-dark-gray">
                We are working hard to bring you amazing content. Check back soon for updates!
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

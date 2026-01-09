import React from 'react';

function NativeAd({ onUpgradeClick }) {
    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg shadow-md p-6 border-2 border-purple-300 dark:border-purple-700 hover:shadow-xl transition relative flex flex-col">
            {/* Sponsored Badge */}
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                SPONSORED
            </div>

            {/* Ad Content */}
            <div className="flex items-start gap-4 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-3 flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Unlock Premium Features! ⭐
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                        Get 40 applications per day, zero ads, premium badge, and priority in recruiter searches.
                    </p>
                </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                    { icon: '🚀', text: '40 apps/day' },
                    { icon: '🚫', text: 'No ads' },
                    { icon: '⭐', text: 'Premium badge' },
                    { icon: '🏆', text: 'Top of search' }
                ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>{feature.icon}</span>
                        <span>{feature.text}</span>
                    </div>
                ))}
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">149 EGP</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">for 3 months (~50 EGP/month)</div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-through">179 EGP</div>
                </div>
            </div>

            {/* CTA Button */}
            <button
                onClick={onUpgradeClick}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800 transition font-semibold shadow-lg"
            >
                Upgrade Now - First Time Offer! 🎉
            </button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Limited time offer for new premium users
            </p>
        </div>
    );
}

export default NativeAd;

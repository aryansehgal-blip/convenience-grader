'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const router = useRouter();

  const handleSearch = async (value: string) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: value }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place: any) => {
    setSelectedPlace(place);
    setQuery(place.name);
    setResults([]);
  };

  const handleStartScan = async () => {
    if (!selectedPlace) return;

    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: selectedPlace.place_id }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/scan/${data.session_id}`);
      } else {
        alert(data.error || 'Failed to start scan');
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to start scan. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">ConvenienceGrader</h1>
            <nav className="space-x-4">
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600">
                How It Works
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                Pricing
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Is Your Convenience Store Easy to Find Online?
        </h2>
        <p className="text-xl text-gray-600 mb-12">
          Get your free Online Health Grade in 60 seconds. See what's hurting your visibility and
          how to fix it.
        </p>

        {/* Search Box */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Enter your store name (e.g., QuickStop Market, Shell Station)"
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Autocomplete Results */}
          {results.length > 0 && (
            <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {results.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelect(result)}
                  className="w-full px-6 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{result.name}</div>
                  <div className="text-sm text-gray-600">{result.address}</div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Place */}
          {selectedPlace && results.length === 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">✓ Selected:</div>
                  <div className="text-gray-900">{selectedPlace.name}</div>
                  <div className="text-sm text-gray-600">{selectedPlace.address}</div>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleStartScan}
            disabled={!selectedPlace}
            className={`mt-6 w-full px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
              selectedPlace
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Get My Free Grade →
          </button>

          <p className="mt-4 text-sm text-gray-500">
            100% free • No credit card required • Results in 60 seconds
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-gray-600">Trusted by 500+ convenience store owners</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: 'Increased foot traffic 23% in 3 months',
              author: 'Maria, Chicago',
            },
            {
              quote: 'Finally understand why I wasn\'t showing up on Google Maps',
              author: 'James, Atlanta',
            },
            {
              quote: 'Easy report to share with my franchisor',
              author: 'Priya, Dallas',
            },
          ].map((testimonial, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
              <p className="text-sm text-gray-500">— {testimonial.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Enter your store',
                description: 'Search for your convenience store by name',
              },
              {
                step: '2',
                title: 'We scan 15+ factors',
                description: 'Rankings, website speed, Google Business Profile, reviews',
              },
              {
                step: '3',
                title: 'Get your grade & action plan',
                description: 'See what's broken, how to fix it, and revenue impact',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 ConvenienceGrader. All rights reserved.
          </p>
          <div className="mt-4 space-x-4 text-sm">
            <a href="#" className="text-gray-400 hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              Terms of Use
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              How Scoring Works
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

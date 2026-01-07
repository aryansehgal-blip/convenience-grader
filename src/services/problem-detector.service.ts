import { PlaceDetails } from './google-places.service';
import { SearchVisibilityResult } from './search-visibility.service';
import { WebsiteExperienceResult } from './website-experience.service';
import { LocalListingsResult } from './local-listings.service';

export interface Problem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  impactArea: 'search' | 'website' | 'listings';
  impactScore: number;
  explanation: string;
  fix: string;
  complexity: 'quick' | 'easy' | 'moderate' | 'hard';
  estimatedTime: string;
  priorityRank: number;
}

export function detectProblems(
  place: PlaceDetails,
  searchResult: SearchVisibilityResult,
  websiteResult: WebsiteExperienceResult,
  listingsResult: LocalListingsResult
): Problem[] {
  const problems: Problem[] = [];

  // Website issues
  if (!websiteResult.hasWebsite) {
    problems.push({
      id: 'no_website',
      severity: 'critical',
      title: 'No working website found',
      impactArea: 'website',
      impactScore: -35,
      explanation: 'Your business doesn\'t have a website or it\'s unreachable. 77% of customers research online before visiting.',
      fix: 'Create a simple website with your hours, location, services, and contact info. Use a template like Wix, Squarespace, or WordPress.',
      complexity: 'moderate',
      estimatedTime: '1-2 weeks',
      priorityRank: 1,
    });
  }

  // Slow website
  if (websiteResult.pageSpeedData && websiteResult.pageSpeedData.lcp > 4000) {
    const loadTime = (websiteResult.pageSpeedData.lcp / 1000).toFixed(1);
    problems.push({
      id: 'slow_mobile_load',
      severity: 'critical',
      title: `Slow mobile website (${loadTime}s load time)`,
      impactArea: 'website',
      impactScore: -15,
      explanation: `Your website takes ${loadTime} seconds to load on mobile. Google recommends <2.5s. Slow sites lose 53% of mobile visitors.`,
      fix: 'Compress images, enable browser caching, and minify CSS/JS. Consider using a CDN.',
      complexity: 'moderate',
      estimatedTime: '1-2 days with developer help',
      priorityRank: 2,
    });
  }

  // Missing hours
  if (!listingsResult.details.hasCompleteHours) {
    problems.push({
      id: 'missing_hours',
      severity: 'high',
      title: 'Missing or incomplete store hours on Google Business Profile',
      impactArea: 'listings',
      impactScore: -10,
      explanation: 'Google hides stores with incomplete hours from some searches. Customers can\'t tell if you\'re open.',
      fix: 'Add all 7 days of hours in Google Business Profile at google.com/business',
      complexity: 'quick',
      estimatedTime: '2 minutes',
      priorityRank: 1,
    });
  }

  // Low review count
  if (listingsResult.details.reviewCount < 10) {
    problems.push({
      id: 'low_reviews',
      severity: 'high',
      title: `Only ${listingsResult.details.reviewCount} Google reviews`,
      impactArea: 'listings',
      impactScore: -8,
      explanation: '88% of customers trust online reviews as much as personal recommendations. Low review count = less trust.',
      fix: 'Ask happy customers for reviews. Create review request cards with QR codes. Send follow-up emails/SMS to customers.',
      complexity: 'moderate',
      estimatedTime: 'Ongoing (target 5 reviews/month)',
      priorityRank: 4,
    });
  }

  // Poor ranking for 24-hour
  const twentyFourHourTheme = searchResult.breakdown.find((b) => b.theme === '24_hour');
  if (twentyFourHourTheme && twentyFourHourTheme.ranking && twentyFourHourTheme.ranking > 10) {
    problems.push({
      id: 'poor_24hour_ranking',
      severity: 'high',
      title: `Not ranking for "24 hour store" keywords (ranked #${twentyFourHourTheme.ranking})`,
      impactArea: 'search',
      impactScore: -6,
      explanation: '"24 hour" searches peak at 11 PM-4 AM (late-night customers). You\'re missing 200+ monthly searches.',
      fix: 'Add "24/7" and "Open 24 Hours" to Google Business description. Create website page about 24-hour service.',
      complexity: 'quick',
      estimatedTime: '30 minutes',
      priorityRank: 3,
    });
  }

  // Missing essential info on website
  if (websiteResult.hasWebsite && !websiteResult.details.hasPhone) {
    problems.push({
      id: 'no_phone_website',
      severity: 'high',
      title: 'No phone number on website',
      impactArea: 'website',
      impactScore: -6,
      explanation: 'Customers can\'t easily call you. 70% of mobile searches lead to a phone call within an hour.',
      fix: 'Add a click-to-call link: <a href="tel:+15125550100">Call Us</a>',
      complexity: 'quick',
      estimatedTime: '5 minutes',
      priorityRank: 2,
    });
  }

  // Missing services/amenities
  if (websiteResult.hasWebsite && !websiteResult.details.hasServices) {
    problems.push({
      id: 'missing_amenity_info',
      severity: 'medium',
      title: 'No amenity information on website',
      impactArea: 'website',
      impactScore: -5,
      explanation: 'Customers searching "convenience store with ATM" won\'t know you have one.',
      fix: 'Add a "Services & Amenities" section listing: ATM, hot food, lottery, propane, etc.',
      complexity: 'quick',
      estimatedTime: '20 minutes',
      priorityRank: 6,
    });
  }

  // Few photos
  if (listingsResult.details.photoCount < 8) {
    problems.push({
      id: 'few_photos',
      severity: 'medium',
      title: `Only ${listingsResult.details.photoCount} photos on Google Business Profile`,
      impactArea: 'listings',
      impactScore: -5,
      explanation: 'Fresh photos signal active business. Stores with 15+ photos get 35% more clicks.',
      fix: 'Upload 10+ photos: exterior, interior, products, services. Update monthly.',
      complexity: 'quick',
      estimatedTime: '30 minutes',
      priorityRank: 7,
    });
  }

  // No schema markup
  if (websiteResult.hasWebsite && !websiteResult.details.hasSchema) {
    problems.push({
      id: 'no_schema_markup',
      severity: 'medium',
      title: 'Website missing schema markup',
      impactArea: 'website',
      impactScore: -10,
      explanation: 'Google can\'t understand your business type, hours, or location from your website.',
      fix: 'Add LocalBusiness schema markup (JSON-LD) to your website. Use Google\'s Structured Data Markup Helper.',
      complexity: 'easy',
      estimatedTime: '15 minutes with developer',
      priorityRank: 8,
    });
  }

  // No promotions
  if (websiteResult.hasWebsite && !websiteResult.details.hasPromotions) {
    problems.push({
      id: 'no_promotions',
      severity: 'low',
      title: 'No current promotions or deals visible on website',
      impactArea: 'website',
      impactScore: -2,
      explanation: 'Competitors show "Gas 10¢ off" or weekly deals. You\'re missing traffic-driving opportunities.',
      fix: 'Add a "Weekly Deals" section. Update weekly with current promotions.',
      complexity: 'quick',
      estimatedTime: '10 minutes/week',
      priorityRank: 9,
    });
  }

  // Low rating
  if (listingsResult.details.averageRating < 3.5 && listingsResult.details.reviewCount > 5) {
    problems.push({
      id: 'low_rating',
      severity: 'high',
      title: `Low average rating (${listingsResult.details.averageRating} stars)`,
      impactArea: 'listings',
      impactScore: -10,
      explanation: 'Customers avoid businesses with ratings below 4.0. Your rating is hurting conversions.',
      fix: 'Respond to negative reviews professionally. Improve service quality. Encourage satisfied customers to leave reviews to balance negatives.',
      complexity: 'hard',
      estimatedTime: 'Ongoing (3-6 months to improve)',
      priorityRank: 5,
    });
  }

  // Calculate priority ranks based on impact and complexity
  problems.forEach((problem) => {
    const severityWeight = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    }[problem.severity];

    const complexityWeight = {
      quick: 1,
      easy: 2,
      moderate: 4,
      hard: 8,
    }[problem.complexity];

    // Higher score = higher priority
    problem.priorityRank = (severityWeight * Math.abs(problem.impactScore)) / complexityWeight;
  });

  // Sort by priority
  problems.sort((a, b) => b.priorityRank - a.priorityRank);

  // Re-assign sequential priority ranks
  problems.forEach((problem, index) => {
    problem.priorityRank = index + 1;
  });

  return problems;
}

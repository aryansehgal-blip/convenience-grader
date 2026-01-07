import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzePageSpeed, scoreCoreWebVitals, PageSpeedResult } from './pagespeed.service';

export interface WebsiteExperienceResult {
  score: number;
  coreWebVitalsScore: number;
  essentialInfoScore: number;
  schemaScore: number;
  mobileScore: number;
  conversionScore: number;
  pageSpeedData?: PageSpeedResult;
  hasWebsite: boolean;
  details: {
    hasHours: boolean;
    hasPhone: boolean;
    hasAddress: boolean;
    hasServices: boolean;
    hasPromotions: boolean;
    hasSchema: boolean;
    hasOpeningHoursSchema: boolean;
    hasMobileViewport: boolean;
    hasDirections: boolean;
  };
}

export async function analyzeWebsiteExperience(url: string | undefined): Promise<WebsiteExperienceResult> {
  if (!url) {
    return {
      score: 0,
      coreWebVitalsScore: 0,
      essentialInfoScore: 0,
      schemaScore: 0,
      mobileScore: 0,
      conversionScore: 0,
      hasWebsite: false,
      details: {
        hasHours: false,
        hasPhone: false,
        hasAddress: false,
        hasServices: false,
        hasPromotions: false,
        hasSchema: false,
        hasOpeningHoursSchema: false,
        hasMobileViewport: false,
        hasDirections: false,
      },
    };
  }

  try {
    // Run PageSpeed analysis
    const pageSpeedData = await analyzePageSpeed(url);
    const coreWebVitalsScore = pageSpeedData ? scoreCoreWebVitals(pageSpeedData) : 0;

    // Fetch HTML for content analysis
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Essential information checks
    const details = {
      hasHours: checkForHours($, html),
      hasPhone: checkForPhone($),
      hasAddress: checkForAddress($, html),
      hasServices: checkForServices($, html),
      hasPromotions: checkForPromotions($, html),
      hasSchema: checkForSchema($),
      hasOpeningHoursSchema: checkForOpeningHoursSchema($),
      hasMobileViewport: checkForMobileViewport($),
      hasDirections: checkForDirections($),
    };

    // Calculate scores
    let essentialInfoScore = 0;
    if (details.hasHours) essentialInfoScore += 8;
    if (details.hasPhone) essentialInfoScore += 6;
    if (details.hasAddress) essentialInfoScore += 6;
    if (details.hasServices) essentialInfoScore += 5;
    if (details.hasPromotions) essentialInfoScore += 5;

    let schemaScore = 0;
    if (details.hasSchema) schemaScore += 10;
    if (details.hasOpeningHoursSchema) schemaScore += 5;

    let mobileScore = 0;
    if (details.hasMobileViewport) mobileScore += 3;
    mobileScore += 7; // Assume reasonable mobile UX if page loads

    let conversionScore = 0;
    if (details.hasDirections) conversionScore += 2;
    conversionScore += 3; // Base conversion elements

    const totalScore = coreWebVitalsScore + essentialInfoScore + schemaScore + mobileScore + conversionScore;

    return {
      score: Math.min(totalScore, 100),
      coreWebVitalsScore,
      essentialInfoScore,
      schemaScore,
      mobileScore,
      conversionScore,
      pageSpeedData: pageSpeedData || undefined,
      hasWebsite: true,
      details,
    };
  } catch (error) {
    console.error('Website analysis error:', error);
    return {
      score: 0,
      coreWebVitalsScore: 0,
      essentialInfoScore: 0,
      schemaScore: 0,
      mobileScore: 0,
      conversionScore: 0,
      hasWebsite: false,
      details: {
        hasHours: false,
        hasPhone: false,
        hasAddress: false,
        hasServices: false,
        hasPromotions: false,
        hasSchema: false,
        hasOpeningHoursSchema: false,
        hasMobileViewport: false,
        hasDirections: false,
      },
    };
  }
}

function checkForHours($: cheerio.CheerioAPI, html: string): boolean {
  const hourPatterns = [
    /(mon|tue|wed|thu|fri|sat|sun).*(am|pm|\d{1,2}:\d{2})/i,
    /hours.*open/i,
    /open.*\d{1,2}/i,
  ];
  return hourPatterns.some((pattern) => pattern.test(html));
}

function checkForPhone($: cheerio.CheerioAPI): boolean {
  const phoneLinks = $('a[href^="tel:"]');
  if (phoneLinks.length > 0) return true;

  const text = $('body').text();
  const phonePattern = /\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/;
  return phonePattern.test(text);
}

function checkForAddress($: cheerio.CheerioAPI, html: string): boolean {
  const addressPatterns = [/\d+\s+[\w\s]+\s+(street|st|avenue|ave|road|rd|drive|dr)/i, /\d{5}/];
  return addressPatterns.some((pattern) => pattern.test(html));
}

function checkForServices($: cheerio.CheerioAPI, html: string): boolean {
  const services = ['atm', 'lottery', 'hot food', 'coffee', 'car wash', 'propane'];
  const lowerHtml = html.toLowerCase();
  return services.some((service) => lowerHtml.includes(service));
}

function checkForPromotions($: cheerio.CheerioAPI, html: string): boolean {
  const promoKeywords = ['deal', 'special', 'sale', 'discount', 'promotion', 'offer'];
  const lowerHtml = html.toLowerCase();
  return promoKeywords.some((keyword) => lowerHtml.includes(keyword));
}

function checkForSchema($: cheerio.CheerioAPI): boolean {
  const jsonLd = $('script[type="application/ld+json"]');
  if (jsonLd.length === 0) return false;

  try {
    const schemaText = jsonLd.first().html();
    if (!schemaText) return false;
    const schema = JSON.parse(schemaText);
    const types = ['LocalBusiness', 'ConvenienceStore', 'GasStation', 'Store'];
    return types.some((type) =>
      schema['@type'] === type ||
      (Array.isArray(schema['@type']) && schema['@type'].includes(type))
    );
  } catch {
    return false;
  }
}

function checkForOpeningHoursSchema($: cheerio.CheerioAPI): boolean {
  const jsonLd = $('script[type="application/ld+json"]');
  if (jsonLd.length === 0) return false;

  try {
    const schemaText = jsonLd.first().html();
    if (!schemaText) return false;
    const schema = JSON.parse(schemaText);
    return !!schema.openingHoursSpecification || !!schema.openingHours;
  } catch {
    return false;
  }
}

function checkForMobileViewport($: cheerio.CheerioAPI): boolean {
  const viewport = $('meta[name="viewport"]');
  return viewport.length > 0;
}

function checkForDirections($: cheerio.CheerioAPI): boolean {
  const directionsLinks = $('a[href*="maps.google.com"], a[href*="google.com/maps"]');
  return directionsLinks.length > 0;
}

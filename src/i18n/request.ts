import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Default to 'en' if locale is undefined
  const currentLocale = locale || 'en';
  
  let messages;
  try {
    messages = (await import(`../messages/${currentLocale}.json`)).default;
  } catch (error) {
    // Fallback to English if the locale file doesn't exist
    messages = (await import(`../messages/en.json`)).default;
  }

  return {
    locale: currentLocale,
    messages
  };
});
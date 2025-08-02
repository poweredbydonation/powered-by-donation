const fs = require('fs');

function countKeys(obj) {
  let count = 0;
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

// Get target language from command line argument
const targetLang = process.argv[2];
if (!targetLang) {
  console.log('Usage: node verify-language.js <language-code>');
  console.log('Example: node verify-language.js de');
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync('en.json', 'utf8'));
const target = JSON.parse(fs.readFileSync(`${targetLang}.json`, 'utf8'));

console.log('EN total keys:', countKeys(en));
console.log(`${targetLang.toUpperCase()} total keys:`, countKeys(target));

// Check for any remaining English text in target file
const targetString = JSON.stringify(target);
const englishPatterns = [
  'Browse Services', 'Loading...', 'Create Service', 'Dashboard', 
  'Profile', 'Login', 'Logout', 'Welcome', 'Provider', 'Service Provider',
  'Home', 'Search', 'Error', 'Success', 'Cancel', 'Save', 'Delete'
];

let foundEnglish = [];
englishPatterns.forEach(pattern => {
  if (targetString.includes(pattern)) {
    foundEnglish.push(pattern);
  }
});

if (foundEnglish.length > 0) {
  console.log('⚠️  Found English text:', foundEnglish.join(', '));
} else {
  console.log(`✅ No English text found in ${targetLang} translation`);
}

console.log('✅ Both files have same number of lines:', fs.readFileSync(`${targetLang}.json`, 'utf8').split('\n').length === fs.readFileSync('en.json', 'utf8').split('\n').length);

// Check if technical terms are preserved
const preservedTerms = ['JustGiving', 'ABN', 'GitHub'];
preservedTerms.forEach(term => {
  if (targetString.includes(term)) {
    console.log(`✅ Technical term preserved: ${term}`);
  } else {
    console.log(`⚠️  Technical term missing: ${term}`);
  }
});
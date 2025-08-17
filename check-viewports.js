const { devices } = require('playwright');

console.log('Device Viewport Sizes:');
console.log('iPhone 12:', devices['iPhone 12'].viewport);
console.log('Pixel 5:', devices['Pixel 5'].viewport);
console.log('iPad Mini:', devices['iPad Mini'].viewport);

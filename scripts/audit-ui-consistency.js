#!/usr/bin/env node

/**
 * UI Consistency Audit Script
 * Tests all pages, roles, and viewports for consistent styling
 */

const { chromium } = require('playwright');

console.log('🎨 UI Consistency Audit');
console.log('========================\n');

const TEST_URL = 'http://localhost:3000';
const VIEWPORTS = [
  { name: 'Mobile (320px)', width: 320, height: 568 },
  { name: 'Mobile (375px)', width: 375, height: 667 },
  { name: 'Tablet (768px)', width: 768, height: 1024 },
  { name: 'Desktop (1024px)', width: 1024, height: 768 },
  { name: 'Wide (1920px)', width: 1920, height: 1080 },
];

const USERS = {
  admin: { email: 'admin@demo.com', password: 'password123', role: 'admin' },
  team: { email: 'team@demo.com', password: 'password123', role: 'team' },
  client: { email: 'sarah@acmecorp.com', password: 'password123', role: 'client' }
};

const PAGES_TO_CHECK = {
  auth: ['/login', '/signup'],
  admin: ['/admin', '/clients', '/messages', '/services', '/team'],
  team: ['/team', '/clients', '/messages', '/services'],
  client: ['/client', '/profile']
};

const ISSUES_FOUND = [];

async function checkPage(page, url, viewport, user = null) {
  const issues = [];
  
  await page.setViewportSize(viewport);
  await page.goto(TEST_URL + url);
  await page.waitForTimeout(1000);
  
  // Check for horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  
  if (hasHorizontalScroll) {
    issues.push(`Horizontal scroll detected at ${viewport.width}px`);
  }
  
  // Check for text overflow
  const textOverflow = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const overflowing = [];
    elements.forEach(el => {
      if (el.scrollWidth > el.clientWidth) {
        const text = el.textContent?.substring(0, 50);
        if (text && text.trim()) {
          overflowing.push(text);
        }
      }
    });
    return overflowing.slice(0, 3); // Return first 3 overflowing elements
  });
  
  if (textOverflow.length > 0) {
    issues.push(`Text overflow: ${textOverflow.join(', ')}`);
  }
  
  // Check for broken layouts
  const brokenLayouts = await page.evaluate(() => {
    const issues = [];
    
    // Check if sidebar is properly positioned
    const sidebar = document.querySelector('[data-sidebar]');
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        issues.push('Sidebar not visible or collapsed incorrectly');
      }
    }
    
    // Check if main content is visible
    const main = document.querySelector('main');
    if (main) {
      const rect = main.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        issues.push('Main content area not visible');
      }
    }
    
    // Check for overlapping elements
    const buttons = document.querySelectorAll('button');
    for (let i = 0; i < buttons.length - 1; i++) {
      const rect1 = buttons[i].getBoundingClientRect();
      const rect2 = buttons[i + 1].getBoundingClientRect();
      if (rect1.right > rect2.left && rect1.left < rect2.right && 
          rect1.bottom > rect2.top && rect1.top < rect2.bottom) {
        issues.push('Overlapping buttons detected');
        break;
      }
    }
    
    return issues;
  });
  
  issues.push(...brokenLayouts);
  
  // Check form responsiveness
  const formIssues = await page.evaluate(() => {
    const issues = [];
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Check if form inputs are properly sized
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const rect = input.getBoundingClientRect();
        if (rect.width < 100 && input.type !== 'checkbox' && input.type !== 'radio') {
          issues.push('Input field too narrow');
        }
      });
      
      // Check grid layouts in forms
      const gridElements = form.querySelectorAll('[class*="grid-cols-"]');
      gridElements.forEach(grid => {
        const className = grid.className;
        if (className.includes('grid-cols-') && !className.includes('sm:') && !className.includes('md:') && !className.includes('lg:')) {
          issues.push('Non-responsive grid detected in form');
        }
      });
    });
    
    return issues;
  });
  
  issues.push(...formIssues);
  
  // Check spacing consistency
  const spacingIssues = await page.evaluate(() => {
    const issues = [];
    
    // Check cards have consistent padding
    const cards = document.querySelectorAll('[class*="card"], .card');
    const paddings = new Set();
    cards.forEach(card => {
      const style = window.getComputedStyle(card);
      paddings.add(style.padding);
    });
    
    if (paddings.size > 3) {
      issues.push('Inconsistent card padding detected');
    }
    
    return issues;
  });
  
  issues.push(...spacingIssues);
  
  // Check typography consistency
  const typographyIssues = await page.evaluate(() => {
    const issues = [];
    
    // Check heading sizes
    const h1s = document.querySelectorAll('h1');
    const h1Sizes = new Set();
    h1s.forEach(h1 => {
      const style = window.getComputedStyle(h1);
      h1Sizes.add(style.fontSize);
    });
    
    if (h1Sizes.size > 2) {
      issues.push('Inconsistent h1 font sizes');
    }
    
    return issues;
  });
  
  issues.push(...typographyIssues);
  
  return issues;
}

async function auditUI() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log('🔍 PHASE 1: Authentication Pages Audit\n');
    
    for (const viewport of VIEWPORTS) {
      console.log(`Testing ${viewport.name}:`);
      const context = await browser.newContext();
      const page = await context.newPage();
      
      for (const url of PAGES_TO_CHECK.auth) {
        const issues = await checkPage(page, url, viewport);
        if (issues.length > 0) {
          console.log(`  ❌ ${url}: ${issues.join('; ')}`);
          ISSUES_FOUND.push({ url, viewport: viewport.name, issues });
        } else {
          console.log(`  ✅ ${url}: No issues`);
        }
      }
      
      await context.close();
    }
    
    console.log('\n🔍 PHASE 2: Role-based Pages Audit\n');
    
    for (const [role, user] of Object.entries(USERS)) {
      console.log(`\n${role.toUpperCase()} Role:`);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Login
      await page.goto(`${TEST_URL}/login`);
      await page.fill('[name="email"]', user.email);
      await page.fill('[name="password"]', user.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      const pages = PAGES_TO_CHECK[role] || [];
      
      for (const viewport of VIEWPORTS) {
        console.log(`  ${viewport.name}:`);
        
        for (const url of pages) {
          const issues = await checkPage(page, url, viewport, user);
          if (issues.length > 0) {
            console.log(`    ❌ ${url}: ${issues.join('; ')}`);
            ISSUES_FOUND.push({ role, url, viewport: viewport.name, issues });
          } else {
            console.log(`    ✅ ${url}: No issues`);
          }
        }
      }
      
      await context.close();
    }
    
    console.log('\n📊 AUDIT SUMMARY');
    console.log('================\n');
    
    if (ISSUES_FOUND.length === 0) {
      console.log('✅ ALL PAGES PASS UI CONSISTENCY CHECKS!');
    } else {
      console.log(`❌ Found ${ISSUES_FOUND.length} issues:\n`);
      
      // Group issues by type
      const groupedIssues = {};
      ISSUES_FOUND.forEach(item => {
        const key = `${item.url} @ ${item.viewport}`;
        if (!groupedIssues[key]) {
          groupedIssues[key] = [];
        }
        groupedIssues[key].push(...item.issues);
      });
      
      Object.entries(groupedIssues).forEach(([key, issues]) => {
        console.log(`${key}:`);
        issues.forEach(issue => console.log(`  - ${issue}`));
      });
      
      console.log('\n🔧 RECOMMENDATIONS:');
      console.log('1. Add responsive classes to all grid layouts (sm:, md:, lg:)');
      console.log('2. Use design system spacing tokens consistently');
      console.log('3. Test all forms on mobile viewports');
      console.log('4. Ensure text truncation for long content');
      console.log('5. Add proper overflow handling');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
  }
  
  await browser.close();
}

auditUI().catch(console.error);
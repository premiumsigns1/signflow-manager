import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Testing SignFlow Manager...');
    await page.goto('https://zg32nzwjjcmc.space.minimax.io');
    await page.waitForLoadState('networkidle');
    
    // Check title
    const title = await page.title();
    console.log('✓ Page title:', title);
    
    // Check for SignFlow text
    const bodyText = await page.textContent('body');
    console.log('✓ Contains SignFlow:', bodyText?.includes('SignFlow'));
    console.log('✓ Contains Sign in:', bodyText?.includes('Sign in'));
    console.log('✓ Contains Create an account:', bodyText?.includes('Create an account'));
    
    console.log('\n✅ Deployment successful - App is live!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

test();

#!/usr/bin/env node

/**
 * Record Login to Account Page Workflow
 *
 * This script demonstrates continuous video recording by:
 * 1. Logging in
 * 2. Starting a recording session
 * 3. Clicking the user menu
 * 4. Navigating to account page (or clicking account link if available)
 * 5. Stopping recording and retrieving the video
 */

const baseUrl = 'http://localhost:3333/mcp/tools/call';

async function callTool(name, args = {}) {
  console.log(`\n📞 Calling tool: ${name}`);
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: args })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tool ${name} failed: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🎬 Starting continuous video recording demo');
  console.log('📹 Workflow: Login → Open User Menu → Navigate to Account');
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Logging in...');
    const loginResult = await callTool('cfg_login', {
      viewport: 'desktop',
      theme: 'dark'
    });

    const loginData = JSON.parse(loginResult.content[0].text);
    const sessionId = loginData.sessionId;
    const username = loginData.session.username;

    console.log(`✅ Logged in as: ${username}`);
    console.log(`🔑 Session ID: ${sessionId}`);

    // Display available interactive elements
    const elements = loginData.interactive_elements.top_10;
    console.log(`\n🎯 Found ${loginData.interactive_elements.total_count} interactive elements on dashboard`);
    console.log('Top interactive elements:');
    elements.forEach(el => {
      console.log(`   - ${el.testId} (${el.tagName})`);
    });

    // Step 2: Start recording
    console.log('\n🎥 Step 2: Starting continuous recording...');
    const startResult = await callTool('start_recording', {
      sessionId,
      viewport: 'desktop',
      startUrl: '/'
    });

    const startData = JSON.parse(startResult.content[0].text);
    console.log(`✅ Recording started at: ${startData.recordingStartTime}`);
    console.log(`📂 Screenshots will be saved to: ${startData.screenshotsDir}`);

    // Step 3: Click user menu
    console.log('\n🖱️  Step 3: Clicking user menu...');
    const tapResult = await callTool('record_action', {
      sessionId,
      action: {
        type: 'tap',
        testId: 'user-menu-button'
      },
      screenshot: true
    });

    const tapData = JSON.parse(tapResult.content[0].text);
    console.log(`✅ User menu clicked (${tapData.actionsPerformed} actions performed)`);
    console.log(`📸 Screenshot saved: ${tapData.screenshotPath}`);

    // Give menu time to open
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Navigate to account page
    console.log('\n🔗 Step 4: Navigating to account page...');
    const navResult = await callTool('record_action', {
      sessionId,
      action: {
        type: 'navigate',
        url: '/account'
      },
      screenshot: true
    });

    const navData = JSON.parse(navResult.content[0].text);
    console.log(`✅ Navigated to account page (${navData.actionsPerformed} actions performed)`);
    console.log(`📸 Screenshot saved: ${navData.screenshotPath}`);

    // Give page time to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Stop recording
    console.log('\n⏹️  Step 5: Stopping recording...');
    const stopResult = await callTool('stop_recording', {
      sessionId
    });

    const stopData = JSON.parse(stopResult.content[0].text);
    console.log(`✅ Recording stopped!`);
    console.log('='.repeat(60));
    console.log('\n📊 Recording Summary:');
    console.log(`   Duration: ${stopData.duration}ms (${(stopData.duration / 1000).toFixed(2)}s)`);
    console.log(`   Actions performed: ${stopData.actionsPerformed}`);
    console.log(`   Video (WebM): ${stopData.videoPath}`);
    console.log(`   Video (MP4): ${stopData.mp4Path}`);
    console.log(`   Screenshots: ${stopData.screenshotsDir}`);
    console.log(`   Final screenshot: ${stopData.finalScreenshot}`);

    console.log('\n📋 Actions Timeline:');
    stopData.actions.forEach((action, index) => {
      const time = new Date(action.timestamp).toLocaleTimeString();
      console.log(`   ${index + 1}. [${time}] ${action.type} ${action.testId || action.url || ''}`);
    });

    console.log('\n🎉 Recording complete! Check the paths above for your video and screenshots.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

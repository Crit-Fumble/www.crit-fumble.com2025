#!/usr/bin/env node

/**
 * MCP Login Demo - Display Screenshot in Chat
 *
 * Calls cfg_login and displays the dashboard screenshot with data
 */

const fs = require('fs');
const path = require('path');

async function callMCP() {
  const response = await fetch('http://localhost:3333/mcp/tools/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'cfg_login',
      arguments: {
        viewport: 'desktop',
        theme: 'dark'
      }
    })
  });

  return response.json();
}

async function main() {
  console.log('🔐 Calling MCP cfg_login...\n');

  const result = await callMCP();

  // Parse the text content
  const textData = JSON.parse(result.content[0].text);
  const imageData = result.content[1].data;

  // Display session info
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 MCP Response - Session Information');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🔑 Session Details:');
  console.log(`   Session ID: ${textData.sessionId}`);
  console.log(`   Username: ${textData.session.username}`);
  console.log(`   Email: ${textData.session.email}`);
  console.log(`   Player ID: ${textData.session.playerId}`);
  console.log(`   Crit Coins: ${textData.session.critCoins}`);
  console.log(`   Role: ${textData.session.role}\n`);

  console.log('🎯 Interactive Elements Found:');
  console.log(`   Total: ${textData.interactive_elements.total_count}`);
  console.log(`   Top 10:`);
  textData.interactive_elements.top_10.forEach((el, i) => {
    const text = el.text ? ` - "${el.text.substring(0, 30)}..."` : '';
    console.log(`      ${i + 1}. ${el.testId} (${el.tagName}${text})`);
  });
  console.log();

  console.log('📂 Resource Paths:');
  console.log(`   Dashboard: ${textData.resources.screenshots.dashboard}`);
  console.log(`   Login: ${textData.resources.screenshots.login}`);
  console.log(`   Video (WebM): ${textData.resources.videos.webm}`);
  console.log(`   Video (MP4): ${textData.resources.videos.mp4}\n`);

  console.log('📸 Dashboard Screenshot:');
  console.log(`   Format: image/png (base64)`);
  console.log(`   Size: ${(imageData.length * 0.75 / 1024).toFixed(2)} KB`);
  console.log(`   Embedded in MCP response: ✅\n`);

  // Save the screenshot for display
  const screenshotPath = path.join(__dirname, '..', 'mcp-dashboard.png');
  fs.writeFileSync(screenshotPath, Buffer.from(imageData, 'base64'));
  console.log(`   Saved to: ${screenshotPath}\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ MCP Response Complete');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📋 Instructions for displaying in chat:');
  console.log('   1. The MCP response includes both JSON data and a base64 image');
  console.log('   2. The image is embedded in content[1].data');
  console.log('   3. AI agents can decode and display the image directly');
  console.log('   4. The JSON data in content[0].text provides context\n');

  console.log(`SCREENSHOT_PATH=${screenshotPath}`);
}

main().catch(console.error);

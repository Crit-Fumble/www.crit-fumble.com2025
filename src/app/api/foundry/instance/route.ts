/**
 * Foundry Instance Management
 *
 * SECURITY: Owner-only access (prevents unauthorized container/droplet creation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import { auth } from '@/packages/cfg-lib/auth';
import { isOwner } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// Check if we're in a Docker environment
const isDocker = process.env.DOCKER_ENV === 'true';
// Track last activity time
let lastActivityTime: number | null = null;
let shutdownTimer: NodeJS.Timeout | null = null;
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
 * Update last activity time and reset shutdown timer
function updateActivity() {
  lastActivityTime = Date.now();
  // Clear existing timer
  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
  }
  // Set new shutdown timer
  shutdownTimer = setTimeout(async () => {
    const timeSinceActivity = Date.now() - (lastActivityTime || 0);
    if (timeSinceActivity >= IDLE_TIMEOUT_MS) {
      console.log('🛑 Auto-shutting down Foundry after 15 minutes of inactivity');
      try {
        await stopFoundryContainer();
      } catch (error) {
        console.error('Failed to auto-shutdown Foundry:', error);
      }
    }
  }, IDLE_TIMEOUT_MS);
}
 * Check if Foundry container is running
async function isFoundryRunning(): Promise<boolean> {
  try {
    if (isDocker) {
      const { stdout } = await execAsync('docker ps --filter "name=crit-fumble-foundry" --format "{{.Status}}"');
      return stdout.trim().includes('Up');
    return false;
  } catch (error) {
    console.error('Error checking Foundry status:', error);
 * Start Foundry container
async function startFoundryContainer(): Promise<void> {
  if (isDocker) {
    await execAsync('docker-compose -f docker-compose.small-scale.yml start foundry');
    console.log('✅ Foundry container started');
 * Stop Foundry container
async function stopFoundryContainer(): Promise<void> {
    await execAsync('docker-compose -f docker-compose.small-scale.yml stop foundry');
    console.log('🛑 Foundry container stopped');
 * Get Foundry container stats
async function getFoundryStats(): Promise<any> {
      const { stdout } = await execAsync(
        'docker stats crit-fumble-foundry --no-stream --format "{{json .}}"'
      );
      if (stdout.trim()) {
        return JSON.parse(stdout);
    return null;
 * GET /api/foundry/instance - Get Foundry instance status
 * SECURITY: Owner-only access
export async function GET(request: NextRequest) {
    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // AUTHORIZATION: Owner-only (prevents unauthorized instance access)
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
    const isRunning = await isFoundryRunning();
    const stats = isRunning ? await getFoundryStats() : null;
    const timeSinceActivity = lastActivityTime ? Date.now() - lastActivityTime : null;
    const minutesUntilShutdown = timeSinceActivity
      ? Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - timeSinceActivity) / 60000))
      : null;
    return NextResponse.json({
      isRunning,
      lastActivityTime,
      timeSinceActivity,
      minutesUntilShutdown,
      idleTimeoutMinutes: 15,
      stats,
      environment: isDocker ? 'docker' : 'development',
  } catch (error: any) {
    console.error('Error getting Foundry status:', error);
    return NextResponse.json(
      { error: 'Failed to get Foundry status', details: error.message },
      { status: 500 }
    );
 * POST /api/foundry/instance - Start or stop Foundry instance
 * SECURITY: Owner-only access (prevents unauthorized container/droplet management)
export async function POST(request: NextRequest) {
    // AUTHORIZATION: Owner-only (prevents unauthorized instance management)
    const body = await request.json();
    const { action } = body; // 'start' or 'stop'
    if (!['start', 'stop'].includes(action)) {
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
    if (action === 'start') {
      if (isRunning) {
        // Already running, just update activity
        updateActivity();
        return NextResponse.json({
          success: true,
          message: 'Foundry is already running',
          action: 'none',
          isRunning: true,
        });
      // Start Foundry
      await startFoundryContainer();
      updateActivity();
      // Wait a moment for container to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        success: true,
        message: 'Foundry instance started',
        action: 'started',
        isRunning: true,
      });
    if (action === 'stop') {
      if (!isRunning) {
          message: 'Foundry is already stopped',
          isRunning: false,
      // Stop Foundry
      await stopFoundryContainer();
      lastActivityTime = null;
      if (shutdownTimer) {
        clearTimeout(shutdownTimer);
        shutdownTimer = null;
        message: 'Foundry instance stopped',
        action: 'stopped',
        isRunning: false,
    console.error('Error managing Foundry instance:', error);
      { error: 'Failed to manage Foundry instance', details: error.message },
 * PATCH /api/foundry/instance - Update activity (keep-alive)
export async function PATCH(request: NextRequest) {
    // AUTHORIZATION: Owner-only
    if (!isRunning) {
        success: false,
        message: 'Foundry is not running',
    updateActivity();
      success: true,
      message: 'Activity updated',
      isRunning: true,
    console.error('Error updating Foundry activity:', error);
      { error: 'Failed to update activity', details: error.message },

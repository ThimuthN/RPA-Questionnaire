import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const backupDir = 'exports/pre-dummy-clean-2026-05-20T01-27-04-154Z';

async function restoreData() {
  try {
    console.log('Starting data restoration...');

    // Restore candidates
    if (fs.existsSync(path.join(backupDir, 'candidates.json'))) {
      console.log('Restoring candidates...');
      const candidates = JSON.parse(fs.readFileSync(path.join(backupDir, 'candidates.json'), 'utf8'));

      for (const candidate of candidates) {
        try {
          await prisma.candidate.upsert({
            where: { id: candidate.id },
            update: {
              fullName: candidate.fullName,
              email: candidate.email,
              phone: candidate.phone,
              roleId: candidate.roleId,
              departmentId: candidate.departmentId,
              hrOwnerId: candidate.hrOwnerId,
              positionAppliedFor: candidate.positionAppliedFor,
              batchId: candidate.batchId,
              resumeSource: candidate.resumeSource,
              hrOwner: candidate.hrOwner,
              intakeBucket: candidate.intakeBucket || 'pipeline',
              stage: candidate.stage || 'new',
              finalDecision: candidate.finalDecision || 'in_process',
              nextAction: candidate.nextAction || 'none',
              screeningStatus: candidate.screeningStatus,
              candidateFolderUrl: candidate.candidateFolderUrl,
              notesSummary: candidate.notesSummary,
            },
            create: {
              id: candidate.id,
              fullName: candidate.fullName,
              email: candidate.email,
              phone: candidate.phone,
              roleId: candidate.roleId,
              departmentId: candidate.departmentId,
              hrOwnerId: candidate.hrOwnerId,
              positionAppliedFor: candidate.positionAppliedFor,
              batchId: candidate.batchId,
              resumeSource: candidate.resumeSource,
              hrOwner: candidate.hrOwner,
              intakeBucket: candidate.intakeBucket || 'pipeline',
              stage: candidate.stage || 'new',
              finalDecision: candidate.finalDecision || 'in_process',
              nextAction: candidate.nextAction || 'none',
              screeningStatus: candidate.screeningStatus,
              candidateFolderUrl: candidate.candidateFolderUrl,
              notesSummary: candidate.notesSummary,
            },
          });
        } catch (error) {
          console.error(`Error restoring candidate ${candidate.id}:`, error.message);
        }
      }
      console.log(`✓ Restored ${candidates.length} candidates`);
    }

    // Restore users
    if (fs.existsSync(path.join(backupDir, 'users.json'))) {
      console.log('Restoring users...');
      const users = JSON.parse(fs.readFileSync(path.join(backupDir, 'users.json'), 'utf8'));

      for (const user of users) {
        try {
          await prisma.user.upsert({
            where: { id: user.id },
            update: {
              email: user.email,
              name: user.name,
              title: user.title,
              department: user.department,
              departmentId: user.departmentId,
              phone: user.phone,
              accessLevel: user.accessLevel || 'member',
              passwordHash: user.passwordHash,
              isInterviewer: user.isInterviewer || false,
              isActive: user.isActive !== false,
            },
            create: {
              id: user.id,
              email: user.email,
              name: user.name,
              title: user.title,
              department: user.department,
              departmentId: user.departmentId,
              phone: user.phone,
              accessLevel: user.accessLevel || 'member',
              passwordHash: user.passwordHash,
              isInterviewer: user.isInterviewer || false,
              isActive: user.isActive !== false,
            },
          });
        } catch (error) {
          console.error(`Error restoring user ${user.id}:`, error.message);
        }
      }
      console.log(`✓ Restored ${users.length} users`);
    }

    console.log('✓ Data restoration complete!');
  } catch (error) {
    console.error('Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();

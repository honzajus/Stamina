import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { computeActivityStats } from "../src/lib/geo";

const prisma = new PrismaClient();

async function createUser(email: string, name: string, sports: string[], bio: string) {
  const passwordHash = await bcrypt.hash("password123", 10);
  return prisma.user.create({
    data: { email, name, passwordHash, sports: JSON.stringify(sports), bio },
  });
}

/** A short out-and-back GPS track near a park, used to seed a realistic finished run. */
function buildTrack(startLat: number, startLng: number, steps: number) {
  const points = [];
  const start = Date.now() - steps * 15_000;
  for (let i = 0; i < steps; i++) {
    points.push({
      latitude: startLat + Math.sin(i / 6) * 0.004 + i * 0.0002,
      longitude: startLng + Math.cos(i / 8) * 0.003 + i * 0.00015,
      altitude: 180 + Math.sin(i / 10) * 8,
      timestamp: new Date(start + i * 15_000),
    });
  }
  return points;
}

async function main() {
  const alex = await createUser("alex@stamina.app", "Alex", ["RUNNING", "CYCLING"], "Runner");
  const sarah = await createUser("sarah@stamina.app", "Sarah", ["RUNNING"], "Chasing personal bests");
  const mark = await createUser("mark@stamina.app", "Mark", ["HIKING", "TRAINING"], "Weekend trail hiker");

  await prisma.follow.createMany({
    data: [
      { followerId: alex.id, followingId: sarah.id },
      { followerId: alex.id, followingId: mark.id },
      { followerId: sarah.id, followingId: alex.id },
    ],
  });

  const sarahTrack = buildTrack(50.0755, 14.4378, 40);
  const sarahStats = computeActivityStats(sarahTrack);
  const sarahRun = await prisma.activity.create({
    data: {
      userId: sarah.id,
      sport: "RUNNING",
      title: "Morning Run",
      status: "FINISHED",
      visibility: "EVERYONE",
      startTime: sarahTrack[0].timestamp,
      endTime: sarahTrack[sarahTrack.length - 1].timestamp,
      distance: sarahStats.distanceMeters,
      duration: Math.round(sarahStats.durationSeconds),
      pace: sarahStats.paceSecondsPerKm,
      avgSpeed: sarahStats.avgSpeedMs,
      elevationGain: sarahStats.elevationGainMeters,
      points: {
        create: sarahTrack.map((p, sequence) => ({ ...p, sequence })),
      },
    },
  });

  await prisma.stamina.create({ data: { userId: alex.id, activityId: sarahRun.id } });
  await prisma.comment.create({
    data: { userId: alex.id, activityId: sarahRun.id, text: "Great pace this morning!" },
  });

  const alexTrack = buildTrack(50.083, 14.421, 55);
  const alexStats = computeActivityStats(alexTrack);
  await prisma.activity.create({
    data: {
      userId: alex.id,
      sport: "RUNNING",
      title: "Evening Run",
      status: "FINISHED",
      visibility: "EVERYONE",
      startTime: alexTrack[0].timestamp,
      endTime: alexTrack[alexTrack.length - 1].timestamp,
      distance: alexStats.distanceMeters,
      duration: Math.round(alexStats.durationSeconds),
      pace: alexStats.paceSecondsPerKm,
      avgSpeed: alexStats.avgSpeedMs,
      elevationGain: alexStats.elevationGainMeters,
      points: {
        create: alexTrack.map((p, sequence) => ({ ...p, sequence })),
      },
    },
  });

  console.log("Seed complete:");
  console.log("  alex@stamina.app / password123");
  console.log("  sarah@stamina.app / password123");
  console.log("  mark@stamina.app / password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

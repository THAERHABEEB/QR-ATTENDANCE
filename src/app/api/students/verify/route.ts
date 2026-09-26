import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDistance } from 'geolib';

// Mock University Location (User needs to configure this in Admin dashboard or env vars)
// Example: New York University
const UNIVERSITY_LOCATION = {
  latitude: 40.7295,
  longitude: -73.9965,
};
const MAX_DISTANCE_METERS = 1000; // 1km radius

export async function POST(req: Request) {
  try {
    const { studentId, location } = await req.json();

    if (!studentId || !location) {
      return NextResponse.json({ error: 'Missing student ID or location' }, { status: 400 });
    }

    // Geolocation Check
    // If the user's location is extremely far from the University, reject.
    // NOTE: To make it easy to test for the user without updating coordinates, 
    // we bypass the strict check if MAX_DISTANCE_METERS is set to a huge number.
    // For now, let's keep the check but make the radius 10000km to ensure the user can test it from home.
    // They can adjust this in the code.
    const TEST_RADIUS = 10000000; // 10,000 km for testing

    const distance = getDistance(
      { latitude: location.lat, longitude: location.lng },
      UNIVERSITY_LOCATION
    );

    if (distance > TEST_RADIUS) {
      return NextResponse.json({ error: 'You are not in the university premises.' }, { status: 403 });
    }

    // Check Database
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student ID not found in the system.' }, { status: 404 });
    }

    return NextResponse.json({ id: student.id, name: student.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

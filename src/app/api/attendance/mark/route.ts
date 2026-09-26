import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { studentId, week } = await req.json();

    if (!studentId || week === undefined) {
      return NextResponse.json({ error: 'Missing student ID or week' }, { status: 400 });
    }

    const weekNumber = parseInt(week, 10);
    if (weekNumber < 1 || weekNumber > 10) {
      return NextResponse.json({ error: 'Invalid week. Must be between 1 and 10.' }, { status: 400 });
    }

    // Check if Student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    // Check if already attended this week
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_week: {
          studentId: studentId,
          week: weekNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Student has already attended this week.' }, { status: 400 });
    }

    // Mark Attendance
    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        week: weekNumber,
      },
    });

    return NextResponse.json({ success: true, attendance, studentName: student.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalStudents = await prisma.student.count();
    const totalAttendances = await prisma.attendance.count();
    
    // Group by week
    const weeklyData = await prisma.attendance.groupBy({
      by: ['week'],
      _count: {
        id: true,
      },
      orderBy: {
        week: 'asc',
      },
    });

    const students = await prisma.student.findMany({
      include: {
        attendances: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json({
      totalStudents,
      totalAttendances,
      weeklyData,
      students
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

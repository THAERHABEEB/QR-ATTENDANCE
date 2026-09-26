import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        attendances: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    const data = students.map((s) => {
      const row: any = {
        'Student ID': s.id,
        'Name': s.name,
      };

      // Fill in week 1 to 10
      for (let i = 1; i <= 10; i++) {
        const att = s.attendances.find(a => a.week === i);
        row[`Week ${i}`] = att ? 'Attended' : 'Absent';
      }

      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Disposition': 'attachment; filename="Attendance_Report.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

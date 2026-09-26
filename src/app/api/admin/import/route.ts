import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Assuming columns are ID and Name (or Student ID, Student Name)
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);

    let count = 0;
    for (const row of data) {
      // Flexible key matching
      const id = (row['ID'] || row['Student ID'] || row['studentId'] || row['Code'])?.toString().trim();
      const name = (row['Name'] || row['Student Name'] || row['studentName'])?.toString().trim();

      if (id && name) {
        await prisma.student.upsert({
          where: { id: id },
          update: { name: name },
          create: { id: id, name: name },
        });
        count++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully imported ${count} students.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process Excel file' }, { status: 500 });
  }
}

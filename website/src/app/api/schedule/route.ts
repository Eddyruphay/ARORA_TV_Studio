
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Build the path to the schedule.json file, which is outside the 'website' directory
    const filePath = path.join(process.cwd(), '..', 'data', 'schedule.json');
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      // If not, return a default empty schedule
      return NextResponse.json({ schedule: [] });
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to read or parse schedule.json:', error);
    // Return an error response
    return NextResponse.json({ error: 'Failed to load schedule' }, { status: 500 });
  }
}

import prisma from '../db.js';

async function seedDemoClass() {
  try {
    const fac = await prisma.faculty.findFirst({ where: { user: { email: 'faculty@smartattendance.edu' } } });
    const student = await prisma.student.findFirst({ where: { user: { email: 'student@smartattendance.edu' } } });
    const sec = await prisma.section.findFirst({ where: { name: 'Section A' } });
    const sem = await prisma.semester.findFirst({ where: { is_current: true } });
    const course = await prisma.course.findFirst({ where: { code: 'BTECH-CSE' } });

    if (fac && sec && sem && course) {
      let sub = await prisma.subject.findFirst({ where: { code: 'CS601' } });
      if (!sub) {
        sub = await prisma.subject.create({
          data: {
            code: 'CS601',
            name: 'Cloud Computing & Distributed Systems',
            type: 'THEORY',
            credit_hours: 4,
            course_id: course.id,
            semester_id: sem.id,
            is_active: true,
          },
        });
      }

      const existingAssign = await prisma.facultySubject.findFirst({
        where: { faculty_id: fac.id, subject_id: sub.id, section_id: sec.id },
      });
      if (!existingAssign) {
        await prisma.facultySubject.create({
          data: {
            faculty_id: fac.id,
            subject_id: sub.id,
            section_id: sec.id,
            academic_year: '2025-2026',
            is_primary: true,
          },
        });
      }

      if (student && sec) {
        await prisma.student.update({
          where: { id: student.id },
          data: { section_id: sec.id, semester_id: sem.id, course_id: course.id },
        });
      }

      console.log('✅ Demo academic setup ready: Faculty assigned to CS601 (Section A), Student enrolled in Section A');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoClass();

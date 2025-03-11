import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create a lead user
  const leadPassword = await hashPassword("lead123");
  const lead = await prisma.user.create({
    data: {
      email: "lead@example.com",
      password: leadPassword,
      name: "Lead User",
      role: "LEAD"
    }
  });

  console.log(`Created lead user: ${lead.name} (${lead.email})`);

  // Create a team user
  const teamPassword = await hashPassword("team123");
  const teamMember = await prisma.user.create({
    data: {
      email: "team@example.com",
      password: teamPassword,
      name: "Team Member",
      role: "TEAM"
    }
  });

  console.log(`Created team user: ${teamMember.name} (${teamMember.email})`);

  // Create a sample task
  const task = await prisma.task.create({
    data: {
      title: "Sample Task",
      description: "This is a sample task to get started with.",
      status: "NOT_STARTED",
      createdById: lead.id,
      assignedToId: teamMember.id,
      histories: {
        create: {
          userId: lead.id,
          action: "TASK_CREATED",
          newTitle: "Sample Task",
          newDesc: "This is a sample task to get started with.",
          newStatus: "NOT_STARTED",
          newAssignee: teamMember.id
        }
      }
    },
    include: {
      createdBy: true,
      assignedTo: true
    }
  });

  console.log(`Created task: ${task.title} (assigned to ${task.assignedTo?.name})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

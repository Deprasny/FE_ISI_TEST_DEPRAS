import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create Lead User
  const leadUser = await prisma.user.create({
    data: {
      email: "lead@example.com",
      name: "Lead User",
      password: await hash("password123", 10),
      role: "LEAD",
    },
  });

  // Create Team Users
  const teamUser1 = await prisma.user.create({
    data: {
      email: "team1@example.com",
      name: "Team Member 1",
      password: await hash("password123", 10),
      role: "TEAM",
    },
  });

  const teamUser2 = await prisma.user.create({
    data: {
      email: "team2@example.com",
      name: "Team Member 2",
      password: await hash("password123", 10),
      role: "TEAM",
    },
  });

  // Create 6 tasks for Lead User (2 assigned to self, 3 assigned to team members, 1 unassigned)
  const taskTitles = [
    "Project Planning",
    "Code Review",
    "Feature Implementation",
    "Bug Fixes",
    "Documentation",
    "Testing",
  ];

  const taskDescriptions = [
    "Plan the project roadmap and define milestones",
    "Review and provide feedback on team's code submissions",
    "Implement new authentication system",
    "Fix reported bugs in the dashboard",
    "Create technical documentation for the API",
    "Perform system testing and create test cases",
  ];

  // Tasks assigned to Lead
  await prisma.task.create({
    data: {
      title: taskTitles[0],
      description: taskDescriptions[0],
      status: "ON_PROGRESS",
      createdById: leadUser.id,
      assignedToId: leadUser.id,
      histories: {
        create: {
          userId: leadUser.id,
          action: "TASK_CREATED",
          newTitle: taskTitles[0],
          newDesc: taskDescriptions[0],
          newStatus: "ON_PROGRESS",
          newAssignee: leadUser.id,
        },
      },
    },
  });

  await prisma.task.create({
    data: {
      title: taskTitles[1],
      description: taskDescriptions[1],
      status: "NOT_STARTED",
      createdById: leadUser.id,
      assignedToId: leadUser.id,
      histories: {
        create: {
          userId: leadUser.id,
          action: "TASK_CREATED",
          newTitle: taskTitles[1],
          newDesc: taskDescriptions[1],
          newStatus: "NOT_STARTED",
          newAssignee: leadUser.id,
        },
      },
    },
  });

  // Tasks assigned to Team Member 1
  await prisma.task.create({
    data: {
      title: taskTitles[2],
      description: taskDescriptions[2],
      status: "ON_PROGRESS",
      createdById: leadUser.id,
      assignedToId: teamUser1.id,
      histories: {
        create: {
          userId: leadUser.id,
          action: "TASK_CREATED",
          newTitle: taskTitles[2],
          newDesc: taskDescriptions[2],
          newStatus: "ON_PROGRESS",
          newAssignee: teamUser1.id,
        },
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "API Integration",
      description: "Integrate third-party payment API",
      status: "DONE",
      createdById: leadUser.id,
      assignedToId: teamUser1.id,
      histories: {
        create: [
          {
            userId: leadUser.id,
            action: "TASK_CREATED",
            newTitle: "API Integration",
            newDesc: "Integrate third-party payment API",
            newStatus: "NOT_STARTED",
            newAssignee: teamUser1.id,
          },
          {
            userId: teamUser1.id,
            action: "TASK_UPDATED",
            previousStatus: "NOT_STARTED",
            newStatus: "DONE",
          },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "Security Audit",
      description: "Perform security assessment of the application",
      status: "ON_PROGRESS",
      createdById: leadUser.id,
      assignedToId: teamUser1.id,
      histories: {
        create: {
          userId: leadUser.id,
          action: "TASK_CREATED",
          newTitle: "Security Audit",
          newDesc: "Perform security assessment of the application",
          newStatus: "ON_PROGRESS",
          newAssignee: teamUser1.id,
        },
      },
    },
  });

  // Tasks assigned to Team Member 2
  await prisma.task.create({
    data: {
      title: taskTitles[3],
      description: taskDescriptions[3],
      status: "NOT_STARTED",
      createdById: leadUser.id,
      assignedToId: teamUser2.id,
      histories: {
        create: {
          userId: leadUser.id,
          action: "TASK_CREATED",
          newTitle: taskTitles[3],
          newDesc: taskDescriptions[3],
          newStatus: "NOT_STARTED",
          newAssignee: teamUser2.id,
        },
      },
    },
  });

  await prisma.task.create({
    data: {
      title: taskTitles[4],
      description: taskDescriptions[4],
      status: "REJECT",
      createdById: leadUser.id,
      assignedToId: teamUser2.id,
      histories: {
        create: [
          {
            userId: leadUser.id,
            action: "TASK_CREATED",
            newTitle: taskTitles[4],
            newDesc: taskDescriptions[4],
            newStatus: "NOT_STARTED",
            newAssignee: teamUser2.id,
          },
          {
            userId: teamUser2.id,
            action: "TASK_UPDATED",
            previousStatus: "NOT_STARTED",
            newStatus: "REJECT",
          },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: taskTitles[5],
      description: taskDescriptions[5],
      status: "DONE",
      createdById: leadUser.id,
      assignedToId: teamUser2.id,
      histories: {
        create: [
          {
            userId: leadUser.id,
            action: "TASK_CREATED",
            newTitle: taskTitles[5],
            newDesc: taskDescriptions[5],
            newStatus: "NOT_STARTED",
            newAssignee: teamUser2.id,
          },
          {
            userId: teamUser2.id,
            action: "TASK_UPDATED",
            previousStatus: "NOT_STARTED",
            newStatus: "ON_PROGRESS",
          },
          {
            userId: teamUser2.id,
            action: "TASK_UPDATED",
            previousStatus: "ON_PROGRESS",
            newStatus: "DONE",
          },
        ],
      },
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

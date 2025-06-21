import { db } from "./db";
import { tools, users } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database with sample data...");

  // Create sample tools
  const sampleTools = [
    {
      name: "Professional Drill Press",
      toolId: "T001",
      category: "power-tools",
      description: "High-precision drill press for accurate drilling operations",
      location: "Workshop A - Station 1",
      status: "available"
    },
    {
      name: "Circular Saw",
      toolId: "T002",
      category: "power-tools",
      description: "7.25-inch circular saw for cutting wood and metal",
      location: "Workshop A - Station 2",
      status: "available"
    },
    {
      name: "Digital Multimeter",
      toolId: "T003",
      category: "measuring-tools",
      description: "Professional digital multimeter with auto-ranging",
      location: "Electronics Lab",
      status: "available"
    },
    {
      name: "Safety Helmet",
      toolId: "T004",
      category: "safety-equipment",
      description: "ANSI-approved hard hat with adjustable suspension",
      location: "Safety Equipment Room",
      status: "available"
    },
    {
      name: "Torque Wrench Set",
      toolId: "T005",
      category: "hand-tools",
      description: "Precision torque wrench set (10-150 Nm)",
      location: "Tool Storage B",
      status: "maintenance"
    },
    {
      name: "3D Printer",
      toolId: "T006",
      category: "power-tools",
      description: "FDM 3D printer for prototyping and production",
      location: "Fabrication Lab",
      status: "in-use"
    }
  ];

  try {
    for (const tool of sampleTools) {
      await db.insert(tools).values(tool).onConflictDoNothing();
    }
    console.log("Sample tools added successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}

export { seedDatabase };
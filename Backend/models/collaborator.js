import mongoose from "mongoose";
import User from "./user.js";

const { Schema } = mongoose;

const collaboratorSchema = new Schema({
  testsTaken: {
    type: [
      {
        testId: { type: Schema.Types.ObjectId, ref: "Test" },
        score: Number,
        successRate: Number,
        takenAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  formationsFollowed: {
    type: [
      {
        formationId: { type: Schema.Types.ObjectId, ref: "Formation" },
        date: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  level: {
    type: String,
    enum: ["junior", "intermediate", "senior"],
    default: "junior",
  },
  technology_success_rate: {
    type: [
      {
        technologyId: { type: Schema.Types.ObjectId, ref: "Technologie" },
        history: [
          {
            successRate: Number,
            date: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    default: [],
  },
  isPerformerOfTheWeek: {
    type: Boolean,
    default: false,
  },
  performerOfTheWeek: {
    technologyId: { type: Schema.Types.ObjectId, ref: "Technologie" },
    successRateBefore: Number,
    successRateAfter: Number,
    date: { type: Date },
  },
});

// Create Collaborator discriminator based on User
const Collaborator = User.discriminator("Collaborator", collaboratorSchema);

// Utility function to fetch a Collaborator by ID
async function getCollaboratorById(collaboratorId) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(collaboratorId)) {
      throw new Error("Invalid collaboratorId format");
    }

    // Query Collaborator using findById
    const collaborator = await Collaborator.findById(collaboratorId);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }

    return collaborator;
  } catch (error) {
    console.error("Error fetching collaborator:", error.message);
    throw error;
  }
}

export { Collaborator, getCollaboratorById };
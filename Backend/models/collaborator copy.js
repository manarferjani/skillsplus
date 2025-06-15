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
  niveau: {
    type: String,
    enum: ["junior", "intermediaire", "senior"],
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

// Voici la bonne manière : créer un discriminator basé sur User
const Collaborator = User.discriminator("Collaborator", collaboratorSchema);

export default Collaborator;

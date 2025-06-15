import mongoose from "mongoose";
const { Schema } = mongoose;

const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    iconColor: { type: String, default: "bg-gray-500" },
    iconType: { type: String, default: "circle" },
    completed: { type: Boolean, default: false },
    dueDate: {
      type: String,
      enum: ["today", "tomorrow", "later"],
      default: "today",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "medium",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Modifier cette ligne :
const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;

import mongoose from "mongoose";

// ==========================================
// 🚨 EMERGENCY TYPES
// ==========================================
const EMERGENCY_TYPES = [

  // 🩺 MEDICAL
  "Heart Attack",
  "Stroke",
  "Seizure",
  "Unconscious",
  "Chest Pain",
  "Breathing Problem",
  "Asthma Attack",
  "Kidney Failure",
  "High Fever",
  "COVID Emergency",
  "Cardiac Arrest",
  "Low Oxygen",
  "Blood Vomiting",
  "Severe Allergic Reaction",
  "Diabetic Emergency",
  "Paralysis",
  "Panic Attack",
  "Severe Dehydration",
  "Food Poisoning",
  "Septic Shock",
  "Organ Failure",
  "Respiratory Failure",

  // 🩹 TRAUMA
  "Fracture",
  "Head Injury",
  "Burns",
  "Internal Bleeding",
  "Electric Shock",
  "Fire Injury",
  "Severe Head Trauma",
  "Deep Cut Injury",
  "Spinal Injury",
  "Bone Dislocation",
  "Crush Injury",
  "Knife Injury",
  "Gunshot Injury",

  // 🚗 ACCIDENTS
  "Road Accident",
  "Bike Crash",
  "Car Crash",
  "Truck Collision",
  "Bus Accident",
  "Train Accident",
  "Industrial Accident",
  "Factory Accident",
  "Construction Accident",
  "Building Collapse",
  "Highway Crash",
  "Hit and Run",
  "Explosion Injury",
  "Fuel Leak Accident",
  "Fall",

  // 🔥 FIRE & DISASTER
  "House Fire",
  "Gas Explosion",
  "Chemical Burn",
  "Wildfire Injury",
  "Smoke Inhalation",
  "Flood Rescue",
  "Earthquake Injury",
  "Storm Injury",
  "Lightning Strike",
  "Toxic Gas Exposure",
  "Radiation Exposure",

  // ☠️ CRITICAL
  "Not Breathing",
  "Massive Bleeding",
  "Brain Hemorrhage",
  "Coma",
  "Near Death Condition",
  "Multiple Organ Failure",
  "Critical Infection",
  "Life Support Needed",
  "Drowning",
  "Poisoning",
  "Snake Bite",

  // 👶 WOMEN & CHILD
  "Pregnancy Emergency",
  "Labor Pain",
  "Pregnancy Bleeding",
  "Premature Labor",
  "Child Birth Emergency",
  "Infant Breathing Problem",
  "Newborn Emergency",
  "Child Injury",
  "Child Unconscious",

  // 🧠 MENTAL HEALTH
  "Suicide Attempt",
  "Self Harm",
  "Drug Overdose",
  "Alcohol Poisoning",
  "Mental Breakdown",
  "Psychiatric Emergency",
  "Violent Behavior",
  "Hallucination",
  "Extreme Anxiety",

  // 🐍 ANIMAL / ENVIRONMENTAL
  "Dog Bite",
  "Monkey Bite",
  "Animal Attack",
  "Scorpion Sting",
  "Insect Allergy",
  "Heat Stroke",
  "Hypothermia",
  "Water Contamination",

  // 🚨 SPECIAL
  "SOS Emergency",
  "OTHER",
];

// ==========================================
// 🚨 REQUEST STATUS
// ==========================================
const REQUEST_STATUS = [
  "PENDING",
  "DISPATCHED",
  "ARRIVED",
  "IN_TRANSIT",
  "COMPLETED",
  "CANCELLED",
];

// ==========================================
// 🚑 EMERGENCY REQUEST SCHEMA
// ==========================================
const emergencyRequestSchema =
  new mongoose.Schema(

    {
      // 👤 USER
      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      // 🚨 EMERGENCY TYPE
      emergencyType: {

        type: String,

        required: true,

        enum: EMERGENCY_TYPES,

        trim: true,
      },

      // 📝 DESCRIPTION
      description: {

        type: String,

        trim: true,

        default:
          "Emergency assistance required",
      },

      // 📍 GEO LOCATION
      location: {

        type: {

          type: String,

          enum: ["Point"],

          required: true,
        },

        coordinates: {

          type: [Number],

          required: true,
        },
      },

      // 🚦 STATUS
      status: {

        type: String,

        enum: REQUEST_STATUS,

        default: "PENDING",
      },

      // 🚑 DRIVER
      assignedDriver: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Driver",

        default: null,
      },

      // 🧠 AI SEVERITY
      severity: {

        type: String,

        enum: [
          "LOW",
          "MEDIUM",
          "HIGH",
          "CRITICAL",
        ],

        default: "MEDIUM",
      },

      // 🔥 AI PRIORITY
      priority: {

        type: Number,

        default: 5,
      },

      // 🧠 AI SUMMARY
      aiSummary: {

        type: String,

        default: "",
      },

      // ⏱️ ETA
      eta: {

        type: Number,

        default: null,
      },

      // 📜 HISTORY TRACKING
      history: [

        {
          status: String,

          changedAt: {
            type: Date,

            default: Date.now,
          },

          changedBy: {
            type:
              mongoose.Schema.Types.ObjectId,

            ref: "User",
          },
        },
      ],
    },

    {
      timestamps: true,
    }
  );

// ==========================================
// 🌍 GEO INDEX
// ==========================================
emergencyRequestSchema.index({
  location: "2dsphere",
});

// ==========================================
// 🚀 EXPORT MODEL
// ==========================================
export default mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
);
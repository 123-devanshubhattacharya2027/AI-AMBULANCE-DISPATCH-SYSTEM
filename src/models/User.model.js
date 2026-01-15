import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";
import { USER_ROLES } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v || ""),
        message: "Please fill a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);


userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


async function hashPasswordForUpdate(next) {
  try {
    const update = this.getUpdate();
    if (!update) return next();

    // support both direct set and $set
    const candidate =
      update.password || (update.$set && update.$set.password);
    if (!candidate) return next();

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(candidate, salt);

    if (update.password) {
      update.password = hashed;
    } else if (update.$set) {
      update.$set.password = hashed;
    } else {
      update.$set = { password: hashed };
    }

    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
}

userSchema.pre("findOneAndUpdate", hashPasswordForUpdate);
userSchema.pre("updateOne", hashPasswordForUpdate);
userSchema.pre("updateMany", hashPasswordForUpdate);


userSchema.methods.comparePassword = async function (plainPassword) {
  
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
export default User;
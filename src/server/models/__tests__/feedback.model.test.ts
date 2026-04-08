import mongoose from "mongoose";
import { FeedbackModel } from "../feedback";

describe("FeedbackModel", () => {
  const validFeedback = () => ({
    name: "John Doe",
    email: "john@example.com",
    subject: "Bug Report",
    message: "I found a bug in the lineup creation page.",
  });

  describe("schema validation", () => {
    it("should validate a valid feedback", () => {
      const feedback = new FeedbackModel(validFeedback());
      const error = feedback.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require name", () => {
      const data = validFeedback();
      // @ts-expect-error - intentionally removing for test
      delete data.name;
      const feedback = new FeedbackModel(data);
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.name).toBeDefined();
    });

    it("should require email", () => {
      const data = validFeedback();
      // @ts-expect-error - intentionally removing for test
      delete data.email;
      const feedback = new FeedbackModel(data);
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.email).toBeDefined();
    });

    it("should require subject", () => {
      const data = validFeedback();
      // @ts-expect-error - intentionally removing for test
      delete data.subject;
      const feedback = new FeedbackModel(data);
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.subject).toBeDefined();
    });

    it("should require message", () => {
      const data = validFeedback();
      // @ts-expect-error - intentionally removing for test
      delete data.message;
      const feedback = new FeedbackModel(data);
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.message).toBeDefined();
    });

    it("should reject name longer than 100 characters", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        name: "a".repeat(101),
      });
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.name).toBeDefined();
    });

    it("should reject email longer than 255 characters", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        email: "a".repeat(256),
      });
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.email).toBeDefined();
    });

    it("should reject subject longer than 200 characters", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        subject: "a".repeat(201),
      });
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.subject).toBeDefined();
    });

    it("should reject message longer than 2000 characters", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        message: "a".repeat(2001),
      });
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.message).toBeDefined();
    });

    it("should accept fields at maximum length", () => {
      const feedback = new FeedbackModel({
        name: "a".repeat(100),
        email: "a".repeat(255),
        subject: "a".repeat(200),
        message: "a".repeat(2000),
      });
      const error = feedback.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe("default values", () => {
    it("should default status to 'new'", () => {
      const feedback = new FeedbackModel(validFeedback());
      expect(feedback.status).toBe("new");
    });
  });

  describe("status enum", () => {
    it("should accept 'new' status", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        status: "new",
      });
      const error = feedback.validateSync();
      expect(error).toBeUndefined();
    });

    it("should accept 'read' status", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        status: "read",
      });
      const error = feedback.validateSync();
      expect(error).toBeUndefined();
    });

    it("should accept 'resolved' status", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        status: "resolved",
      });
      const error = feedback.validateSync();
      expect(error).toBeUndefined();
    });

    it("should reject invalid status values", () => {
      const feedback = new FeedbackModel({
        ...validFeedback(),
        status: "invalid_status",
      });
      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.status).toBeDefined();
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const feedback = new FeedbackModel({
        _id: objectId,
        ...validFeedback(),
      });
      expect((feedback as unknown as { id: string }).id).toBe(
        objectId.toHexString(),
      );
    });

    it("should include virtuals in toJSON", () => {
      const feedback = new FeedbackModel(validFeedback());
      const json = feedback.toJSON();
      expect(json).toHaveProperty("id");
    });

    it("should include virtuals in toObject", () => {
      const feedback = new FeedbackModel(validFeedback());
      const obj = feedback.toObject();
      expect(obj).toHaveProperty("id");
    });
  });

  describe("timestamps", () => {
    it("should have timestamps enabled", () => {
      const schema = FeedbackModel.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });
});

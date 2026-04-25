import mongoose from "mongoose";

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },

    author: { type: String, required: true, trim: true }, // derived from JWT user or custom input

    relatedBook: { type: String, default: "" },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: { 
      type: String, 
      enum: ["Draft", "Published", "Scheduled"], 
      default: "Draft" 
    },

    tags: { type: [String], required: true, default: [] },

    likes: { type: Number, required: true, default: 0 },
    views: { type: Number, required: true, default: 0 },

    blog_picture: { type: String, default: "" },

    // New fields for custom author
    author_name: { type: String, default: "" }, // Custom author name if not "ME"
    author_picture: { type: String, default: "" }, // Custom author picture URL

    // Phase 7: Featured and Pinned Content
    isFeatured: { type: Boolean, default: false, index: true },
    isPinned: { type: Boolean, default: false, index: true },
    isEditorsPick: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0 },
    relatedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlogPost" }],

    // Phase 7: Slugs and SEO Metadata
    slug: { type: String, unique: true, sparse: true, trim: true, index: true },
    seoTitle: { type: String, default: "", trim: true, maxlength: 70 },
    seoDescription: { type: String, default: "", trim: true, maxlength: 160 },
    socialImage: { type: String, default: "" },
    canonicalUrl: { type: String, default: "", trim: true },
    keywords: { type: [String], default: [] },

    // Phase 7: Scheduled Publishing
    publishAt: { type: Date, default: null, index: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for featured/pinned content queries
BlogPostSchema.index({ status: 1, isFeatured: -1, isPinned: -1, createdAt: -1 });
BlogPostSchema.index({ status: 1, publishAt: 1 }); // For scheduled publishing

export default mongoose.model("BlogPost", BlogPostSchema);
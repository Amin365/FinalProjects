import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../models/Resource.js", () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../../models/user.js", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("../../utility/cloudinary.js", () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

vi.mock("fs/promises", () => ({
  default: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

import fs from "fs/promises";
import Resource from "../../models/Resource.js";
import User from "../../models/user.js";
import cloudinary from "../../utility/cloudinary.js";
import { createResource, getResourceFileById } from "../../controller/ResourceController.js";

const VALID_RESOURCE_ID = "69ff9373a401317a8c181540";
const USER_ID = "69ff9373a401317a8c181541";

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  setHeader: vi.fn(),
  send: vi.fn(),
  sendFile: vi.fn(),
});

const mockUserRole = (roleName) => {
  User.findById.mockReturnValue({
    populate: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: USER_ID, role: { role: roleName } }),
    }),
  });
};

const mockResourceFindById = (resource) => {
  Resource.findById.mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(resource),
    }),
  });
};

describe("ResourceController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("stores uploaded PDFs locally so preview does not depend on remote delivery", async () => {
    mockUserRole("Super Admin");
    Resource.create.mockImplementation(async (payload) => ({ _id: VALID_RESOURCE_ID, ...payload }));

    const req = {
      user: { _id: USER_ID },
      body: {
        title: "Training Guide",
        type: "pdf",
        accessLevel: "public",
      },
      files: {
        file: [
          {
            originalname: "training guide.pdf",
            mimetype: "application/pdf",
            buffer: Buffer.from("%PDF-1.4"),
          },
        ],
      },
    };
    const res = makeRes();

    await createResource(req, res);

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("training-guide.pdf"),
      req.files.file[0].buffer
    );
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    expect(Resource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Training Guide",
        type: "pdf",
        fileUrl: expect.stringMatching(/^\/uploads\/resources\/.+training-guide\.pdf$/),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("uploads non-PDF resource files to Cloudinary", async () => {
    mockUserRole("Admin");
    Resource.create.mockImplementation(async (payload) => ({ _id: VALID_RESOURCE_ID, ...payload }));
    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => ({
      end: vi.fn(() => callback(null, { secure_url: "https://cdn.example.com/file.docx" })),
    }));

    const req = {
      user: { _id: USER_ID },
      body: {
        title: "Worksheet",
        type: "docx",
        accessLevel: "public",
      },
      files: {
        file: [
          {
            originalname: "worksheet.docx",
            mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: Buffer.from("docx"),
          },
        ],
      },
    };
    const res = makeRes();

    await createResource(req, res);

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: "Resources/files",
        resource_type: "raw",
        public_id: expect.stringMatching(/worksheet\.docx$/),
      }),
      expect.any(Function)
    );
    expect(Resource.create).toHaveBeenCalledWith(
      expect.objectContaining({ fileUrl: "https://cdn.example.com/file.docx" })
    );
  });

  it("serves local PDF resources inline for the PDF reader", async () => {
    mockResourceFindById({
      _id: VALID_RESOURCE_ID,
      title: "Local PDF",
      type: "pdf",
      fileUrl: "/uploads/resources/local-pdf.pdf",
    });
    const req = { params: { id: VALID_RESOURCE_ID }, protocol: "http", get: vi.fn(() => "localhost:5000") };
    const res = makeRes();

    await getResourceFileById(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", 'inline; filename="Local-PDF.pdf"');
    expect(res.sendFile).toHaveBeenCalledWith(expect.stringContaining("uploads"));
  });

  it("returns a clear conflict when an old remote PDF is blocked by the file host", async () => {
    mockResourceFindById({
      _id: VALID_RESOURCE_ID,
      title: "Blocked PDF",
      type: "pdf",
      fileUrl: "https://remote.example.com/blocked.pdf",
    });
    fetch.mockResolvedValue({ ok: false, status: 401 });
    const req = { params: { id: VALID_RESOURCE_ID }, protocol: "http", get: vi.fn(() => "localhost:5000") };
    const res = makeRes();

    await getResourceFileById(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "This PDF is blocked by the remote file host. Re-upload the PDF so it can be stored locally for preview.",
    });
  });
});

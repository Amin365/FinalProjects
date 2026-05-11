import mongoose from 'mongoose'

const { Schema, model, Types } = mongoose

// simple email validator
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const memberCodeRegex = /^MBR\d{3,}$/i
const minMemberCodeNumber = 124

const normalizeMemberCode = (code) => String(code || '').trim().toUpperCase()

const isReadableMemberCode = (code) => {
  const normalized = normalizeMemberCode(code)
  if (!memberCodeRegex.test(normalized)) return false
  const number = Number(normalized.replace(/^MBR/i, ''))
  return Number.isFinite(number) && number >= minMemberCodeNumber
}

const buildMemberCode = (number) => `MBR${String(number).padStart(3, '0')}`

async function getNextMemberCode(MemberModel, reservedCodes = new Set()) {
  const existing = await MemberModel.find({ code: { $regex: /^MBR\d+$/i } })
    .select('code')
    .lean()
    .exec()

  let highest = minMemberCodeNumber - 1
  for (const item of existing) {
    const normalized = normalizeMemberCode(item.code)
    if (!memberCodeRegex.test(normalized)) continue
    const number = Number(normalized.replace(/^MBR/i, ''))
    if (Number.isFinite(number)) highest = Math.max(highest, number)
  }

  let next = Math.max(highest + 1, minMemberCodeNumber)
  let code = buildMemberCode(next)
  while (reservedCodes.has(code)) {
    next += 1
    code = buildMemberCode(next)
  }
  reservedCodes.add(code)
  return code
}

function trimMemberFields(doc) {
  if (!doc) return
  if (typeof doc.first_name === 'string') doc.first_name = doc.first_name.trim()
  if (typeof doc.middle_name === 'string') doc.middle_name = doc.middle_name.trim()
  if (typeof doc.last_name === 'string') doc.last_name = doc.last_name.trim()
  if (typeof doc.email === 'string') doc.email = doc.email.trim().toLowerCase()
  if (typeof doc.code === 'string') doc.code = normalizeMemberCode(doc.code)
}

const MemberSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
      default: '',
    },
    middle_name: {
      type: String,
      trim: true,
      default: '',
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
      default: '',
    },

   
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      validate: {
        validator: function (v) {
          if (!v) return true
          return emailRegex.test(v)
        },
        message: (props) => `${props.value} is not a valid email`,
      },
     
      unique: true,
      sparse: true,
    },

    // date_of_birth: {
    //   type: Date,
    //   default: null,
    // },

    gender: {
      type: String,
      enum: ['Male', 'Female'],
      default: 'Male',
    },

    region: {
      type: String,
      trim: true,
      default: '',
    },
    city:{
        type:String,

    },
     status: {
        type:String,
        enum:['Active',"Inactive","pending"],
        default:"Active"
     },

    join_date: {
      type: Date,
      default: Date.now,
    },
    Profile_picture: {
      type: String,
      trim: true,
      default: "",
    },

    // optional bookkeeping fields
    isArchived: {
      type: Boolean,
      default: false,
    },
    department: {
  type: String,
  trim: true,
  default: ""
},
student_id: {
  type: String,
  trim: true,
  default: ""
  // optionally: unique: true, sparse: true
},
study_year: {
  type: String, // or Number if you prefer
  enum: ["1","2","3","4","5",""], // allow empty for non-students
  default: ""
},
role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null }
    // any other custom fields can go here
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

/**
 * Virtual: full_name
 */
MemberSchema.virtual('full_name').get(function () {
  const parts = [this.first_name, this.middle_name, this.last_name].filter(Boolean)
  return parts.join(' ')
})


MemberSchema.pre('validate', async function () {
  trimMemberFields(this)
  if (!isReadableMemberCode(this.code)) {
    this.code = await getNextMemberCode(this.constructor)
  }
})

MemberSchema.pre('insertMany', async function (next, docs) {
  try {
    const reservedCodes = new Set()
    for (const doc of docs || []) {
      trimMemberFields(doc)
      if (isReadableMemberCode(doc.code)) {
        reservedCodes.add(normalizeMemberCode(doc.code))
      } else {
        doc.code = await getNextMemberCode(this, reservedCodes)
      }
    }
    next()
  } catch (err) {
    next(err)
  }
})


MemberSchema.index({ code: 1 }, { unique: true })
MemberSchema.index({ email: 1 }, { unique: true, sparse: true })

const Member = model('Member', MemberSchema)

export default Member

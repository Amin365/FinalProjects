import mongoose from 'mongoose'

const { Schema, model, Types } = mongoose

// simple email validator
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
      default: function () {
       
        const t = Date.now().toString()
        const rnd = Math.random().toString(36).slice(2, 4).toUpperCase()
        return `MBR${t.slice(-6)}${rnd}`
      },
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


MemberSchema.pre('validate', function () {
  if (!this.code) {
    const t = Date.now().toString()
    
    this.code = `MBR${t.slice(-2)}`
  }
  if (typeof this.first_name === 'string') this.first_name = this.first_name.trim()
  if (typeof this.middle_name === 'string') this.middle_name = this.middle_name.trim()
  if (typeof this.last_name === 'string') this.last_name = this.last_name.trim()
  if (typeof this.code === 'string') this.code = this.code.trim()
  if (typeof this.email === 'string') this.email = this.email.trim().toLowerCase()
 
})


MemberSchema.index({ code: 1 }, { unique: true })
MemberSchema.index({ email: 1 }, { unique: true, sparse: true })

const Member = model('Member', MemberSchema)

export default Member
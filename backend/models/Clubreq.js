
import mongoose from "mongoose"

const  ClubreqSchema = new mongoose.Schema({
    FullName:{type:String,required:true,trim:true},
    email:{type:String,required:true,trim:true},
    phone:{type:String,required:true},
    education_level:{type:String,trim:true},
    institution:{type:String,trim:true},
    readyToTeach:{type:Boolean,default:null},
    teachAreas:{type:[String],default:[]},
    availability:{type:String,trim:true,default:""},
    motivation:{type:String,trim:true,default:""},


    status:{type:String,enum:["Pending","Approved","Rejected"],default:"Pending"},
    rejectionReason:{type:String,default:""},
    memberId:{type:mongoose.Schema.Types.ObjectId,ref:"Member",default:null},
    userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
    reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
    reviewedAt:{type:Date,default:null},
}

,{timestamps:true}

)

export default mongoose.model("Clubreq",ClubreqSchema);

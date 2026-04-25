
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react"
// import stamp from "./stamp.png"
// import sig from "./sig.png"

export function IDCardBack({
  companyName = "JJU READING CLUB",
  companyWebsite = "www.jjureadingclub.com",
  supportEmail = "support@jjureadingclub.com",
  supportPhone = "+1 (555) 000-0000",
  companyAddress,
}) {
  return (
    <Card className="relative w-[340px] h-[214px] overflow-hidden rounded-xl shadow-lg bg-white">
      
      {/* Top Accent Bar – UNCHANGED */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-yellow-400" />

      <CardContent className="relative z-10 h-full p-4 flex flex-row gap-4">
        
        {/* Left side – Company info */}
        <div className="flex-1 flex flex-col">
          
          {/* Description */}
          <p className="text-[11px] text-gray-500 italic mb-2">
            The Bearer of this ID Card is an Member of{" "}
            <span className="text-[8px] font-bold text-gray-700">{companyName}</span>.
          </p>

          {/* Contact Info */}
          <div className="flex flex-col gap-2 mt-3">
            
            {companyAddress && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-gray-400" />
                <span className="text-[11px] font-semibold text-blue-600">
                  {companyWebsite}
                </span>
                {/* <MapPin className="w-3 h-3 text-gray-400 ml-1" />
                <span className="text-[11px] text-gray-500">
                  {companyAddress}
                </span> */}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] text-gray-500">
                {supportEmail}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] text-gray-500">
                {supportPhone}
              </span>
            </div>
          </div>
        </div>

        {/* Right side – Stamp & Signature */}
        <div className="flex flex-col items-center justify-end">
          {/* <img
            src={stamp}
            alt="Company Stamp"
            className="w-20 h-20 rounded-full"
          />
          <img
            src={sig}
            alt="CTO Signature"
            className="w-[100px] h-[40px] mt-2 -translate-x-2 -translate-y-1 -rotate-6"
          /> */}
        </div>
      </CardContent>
    </Card>
  )
}

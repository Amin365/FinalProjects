import React, { useRef, useState } from "react"
import domtoimage from 'dom-to-image-more'
import jsPDF from "jspdf"
import { Button } from "@/components/ui/button"
import { IDCardFront } from "./IDCardFront"
import { IDCardBack } from "./IDCardBack"
import api from "@/app/api/apislice"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useSelector } from "react-redux"
import Loader from "../Loader"

export default function PVCIDCard() {
    const{user}=useSelector((state)=>state.auth)

  const frontRef = useRef(null)
  const backRef = useRef(null)
  const [activeTab, setActiveTab] = useState("front")
  const { memberId } = useParams()
  const { data: member, isLoading, isError } = useQuery({
    queryKey: ["member-id-card", memberId],
    queryFn: async () => {
      const res = await api.get(`/members/${memberId}/id-card`)
      return res.data.data
    },
    enabled: !!memberId,
  })

  if (isLoading) return <Loader />
  if (isError) return <p>Failed to load member</p>
  if (!member) return <p>No member data</p>

  const fullName = [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')
  const cardRef = activeTab === 'front' ? frontRef : backRef

  // IMAGE DOWNLOAD
  const downloadImage = async () => {
    try {
      const blob = await domtoimage.toBlob(cardRef.current, { bgcolor: '#ffffff' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = "id-card.png"
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
    }
  }

  // PDF DOWNLOAD (PVC SIZE)
  const downloadPDF = async () => {
    try {
      const dataUrl = await domtoimage.toPng(cardRef.current, { bgcolor: '#ffffff' })
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98],
      })

      pdf.addImage(dataUrl, "PNG", 0, 0, 85.6, 53.98)
      pdf.save("id-card.pdf")
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  return (
    <div className="flex flex-col  items-center gap-6 w-full max-w-xl mx-auto">

      {/* HIDDEN FULL-SIZE CARDS FOR DOWNLOAD (clean version without overlay) */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div ref={frontRef}>
          <IDCardFront
            employeeName={fullName}
            department={member.department}
            employeeId={member.code}
            photoUrl={user?.profile_picture || member.Profile_picture || ""}
            validFrom={member.join_date?.split("T")[0]}
            validUntil="2027-01-01"
            erpCode={member.student_id}
            companyLogo={null} // Adjust if needed
            noOverlay={true} // Disable overlay for clean download
          />
        </div>
        <div ref={backRef}>
          <IDCardBack
            companyAddress={member.region}
            supportEmail={member.email}
            supportPhone={member.phone}
          />
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="front">Front Side</TabsTrigger>
          <TabsTrigger value="back">Back Side</TabsTrigger>
        </TabsList>

        {/* FRONT SIDE */}
        <TabsContent value="front">
          <div
            className="flex justify-center p-6 bg-gray-100 rounded-lg"
             style={{ backgroundColor: "#ffffff" }}
          >
            <div className="scale-[0.75] origin-top-left">
              <IDCardFront
                employeeName={fullName}
                department={member.department}
                employeeId={member.code}
                photoUrl={user?.profile_picture || member.Profile_picture || ""}
                validFrom={member.join_date?.split("T")[0]}
                validUntil="2027-01-01"
                erpCode={member.student_id}
                companyLogo={null} // Adjust if needed
              />
            </div>
          </div>
        </TabsContent>

        {/* BACK SIDE */}
        <TabsContent value="back">
          <div
            className="flex justify-center p-6 rounded-lg"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="scale-[0.75] origin-top-left">
              <IDCardBack
                companyAddress={member.region}
                supportEmail={member.email}
                supportPhone={member.phone}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4">
        <Button onClick={downloadImage}>Download Image</Button>
        <Button variant="outline" onClick={downloadPDF}>
          Download PDF (PVC)
        </Button>
      </div>
    </div>
  )
}

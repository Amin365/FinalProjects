import React, { useMemo } from "react";
import Barcode from "react-barcode";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";

export function IDCardFront({
  companyName = "Degahbur Public Library",
  employeeName = "Employee Name",
//   jobTitle = "Job Title",
  department = "Department",
  employeeId = "00000",
  photoUrl,
  validFrom,
  validUntil = "N/A",
  erpCode = "ERP",
  companyLogo,
  noOverlay = false,  // New prop to disable overlay for clean downloads
}) {
  const fullBarcodeValue = useMemo(() => {
    const base = `${employeeId}`;
    const checksum =
      base.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 10;
    return `${base}-${checksum}`;
  }, [erpCode, employeeId, department]);

  return (
    <Card
      className="
        relative
        w-[340px]        /* ISO width */
        h-[214px]        /* ISO height */
        overflow-hidden
        rounded-xl
        shadow-lg
        bg-white
      "
    >
      {/* Background effect - conditionally rendered */}
      {!noOverlay && (
        <div
          className="pointer-events-none absolute inset-0 opacity-30
          bg-[linear-gradient(45deg,rgba(59,130,246,0.15)_25%,transparent_25%,transparent_75%,rgba(59,130,246,0.15)_75%)]
          bg-[length:20px_20px]"
        />
      )}

      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-blue-100 opacity-50" />

      <CardContent className="relative z-10 h-full px-3 py-2 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-blue-600 leading-none">
              {companyName}
            </h2>
            {companyLogo && (
              <img src={companyLogo} alt="Logo" className="h-7" />
            )}
          </div>
          <span className="text-[10px] text-gray-500 mt-[2px]">
            Member ID Card
          </span>
        </div>

        {/* Body */}
        <div className="flex justify-between items-center flex-1">
          <div className="flex flex-col text-[10px] font-mono text-blue-600 gap-[1px]">
            <span>Name: {employeeName}</span>
            {/* <span>Job: {jobTitle}</span> */}
            <span>Dept: {department}</span>
            <span>ID: {employeeId}</span>
          </div>

          <Avatar className="w-[72px] h-[72px] border-2 border-blue-600 rounded-md">
            <AvatarImage src={photoUrl} alt={employeeName} />
            <AvatarFallback className="bg-gray-100">
              <Building2 className="w-6 h-6 text-gray-400" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Footer */}
        <div className="w-full shrink-0 mt-1 ">
          <div className="flex justify-between text-[9px] text-gray-500 mb-[2px]">
            <span>Issued: {validFrom || "-"}</span>
            <span>Expires: {validUntil}</span>
          </div>

          <div className="flex flex-col items-center">
           <span className="text-[10px] font-mono text-blue-600  text-center">
              {fullBarcodeValue}
            </span>
            <div className="w-full flex mb-4 justify-center min-h-[32px]">
              <Barcode
                value={fullBarcodeValue}
                format="CODE128"
                width={1.5}
                height={32}
                margin={0}
                displayValue={false}
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
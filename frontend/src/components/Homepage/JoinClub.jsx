import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMutation } from "@tanstack/react-query"
import api from "../../app/api/apislice"

const JoinClub = ({ open, onOpenChange }) => {
  const [formData, setFormData] = React.useState({
    FullName: "",
    phone: "",
    email: "",
    status: "Pending",
  })

  const [showNotice, setShowNotice] = React.useState(true)


  const [success, setSuccess] = React.useState(false)
  const [emailExists, setEmailExists] = React.useState(false)

  // 🔍 Check if email already submitted
  React.useEffect(() => {
    if (formData.email) {
      const submittedEmails =
        JSON.parse(localStorage.getItem("joinedClubEmails")) || []
      setEmailExists(submittedEmails.includes(formData.email))
    }
  }, [formData.email])

  const ClubJoinMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/join-club", data)
      return response.data
    },
    onSuccess: (_, variables) => {
      // ✅ Save email to localStorage
      const submittedEmails =
        JSON.parse(localStorage.getItem("joinedClubEmails")) || []

      localStorage.setItem(
        "joinedClubEmails",
        JSON.stringify([...submittedEmails, variables.email])
      )

      setSuccess(true)

      // ⏱ Auto-close after 3 seconds
      setTimeout(() => {
        setSuccess(false)
        setFormData({ FullName: "", phone: "", email: "" })
        onOpenChange(false)
      }, 3000)
    },
    onError: (error) => {
      console.error("Error sending club join request", error)
    },
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (emailExists) return
    ClubJoinMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="p-4">
      <DialogContent className=" sm:max-w-md">
        {!success ? (
          <>
            {/* 🔔 Notice */}
          {showNotice && (
  <div className="relative mt-6 flex items-center gap-3 rounded-lg border bg-orange-50 px-4 py-3 text-sm text-orange-700">
    <span>
      After submitting, our team will contact you within{" "}
      <strong>24 hours</strong>.
    </span>

    {/* ❌ Close button */}
    <button
      type="button"
      onClick={() => setShowNotice(false)}
      className="absolute right-2 top-2 text-orange-600 hover:text-orange-800"
      aria-label="Dismiss notification"
    >
      ✕
    </button>
  </div>
)}


            <DialogHeader className="mt-4">
              <DialogTitle>Join the Reading Club 📚</DialogTitle>
              <DialogDescription>
                Fill in your details to request membership.
              </DialogDescription>
            </DialogHeader>

            {/* ⚠️ Duplicate email warning */}
            {emailExists && (
              <div className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
                You have already submitted a request with this email.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <input
                type="text"
                name="FullName"
                placeholder="Full Name"
                value={formData.FullName}
                onChange={handleChange}
                required
                disabled={emailExists}
                className="w-full px-3 py-2 border rounded disabled:opacity-60"
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={emailExists}
                className="w-full px-3 py-2 border rounded disabled:opacity-60"
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded"
              />

              <button
                type="submit"
                disabled={ClubJoinMutation.isPending || emailExists}
                className="w-full mb-4 bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-60"
              >
                {ClubJoinMutation.isPending
                  ? "Submitting..."
                  : emailExists
                  ? "Already Submitted"
                  : "Submit Request"}
              </button>
            </form>
          </>
        ) : (
          /* ✅ SUCCESS STATE */
          <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <DialogTitle className="text-2xl font-semibold text-green-600">
              Request Sent Successfully 🎉
            </DialogTitle>

            <DialogDescription className="max-w-sm text-slate-600">
              Thank you for requesting to join our{" "}
              <strong>Reading Club</strong>.
              <br />
              Our team will contact you within <strong>24 hours</strong>.
              <br />
              <br />
              📖 Keep reading. Keep growing.
            </DialogDescription>

            <p className="text-xs text-slate-400">
              This window will close automatically…
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default JoinClub

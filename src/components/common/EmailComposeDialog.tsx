import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { API_BASE_URL } from "@/config";
//import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useParams } from "react-router-dom";
import { FloatingField } from "../dashboard/CompanyProfileForm";

interface Props {
  open: boolean;
  mode: "single" | "bulk";
  recipients: string[];
  onClose: () => void;
}

const EmailComposeDialog: React.FC<Props> = ({
  open,
  mode,
  recipients,
  onClose,
}) => {
  const [to, setTo] = React.useState(recipients.join(", "));
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const { companyId } = useParams();
  const session = useAuthStore.getState().session;

  const handleSend = async () => {
    //if(!enabled) return toast.info("Featured disabled")
    const toastId = toast.loading(
      mode === "bulk"
        ? `Sending emails to ${recipients.length} employees...`
        : "Sending email...",
    );

    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            recipients:
              mode === "single"
                ? to.split(",").map((e) => e.trim())
                : recipients,
            subject,
            body,
          }),
        },
      );

      if (!res.ok) throw new Error("Failed");

      toast.success("Email sent successfully", { id: toastId });
      onClose();
    } catch (err) {
      toast.error("Failed to send email", { id: toastId });
    }
  };

  React.useEffect(() => {
    setTo(recipients.join(", "));
  }, [recipients]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          max-w-lg
          rounded-sm
          border border-slate-200
          shadow-sm
        "
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-slate-800">
            {mode === "single"
              ? "Send Email"
              : `Send Email (${recipients.length} recipients)`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {mode === "single" ? (
            <FloatingField
              label="Recipient"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipient email"
              required
            />
          ) : (
            <div className="text-xs text-slate-500">
              Emails will be sent to{" "}
              <span className="font-medium">{recipients.length}</span>{" "}
              employees.
            </div>
          )}

          <FloatingField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={6}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="shadow-none"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSend} className="cursor-pointer">
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailComposeDialog;

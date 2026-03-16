const TEMPLATE_PATH = "/celtificate.png";

function formatIssueDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function CertificatePreview({
  fullName,
  level,
  issueDate,
}) {
  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[1.414/1] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white bg-cover bg-center shadow-lg"
        style={{ backgroundImage: `url(${TEMPLATE_PATH})` }}
      >
        <div className="absolute inset-0 bg-white/10" />

        <div className="absolute left-[18%] top-[44.3%] w-[64%] -translate-y-1/2 text-center">
          <div className="font-serif text-[clamp(1.5rem,3vw,3.6rem)] font-bold italic text-slate-900">
            {fullName || "Student Name"}
          </div>
        </div>

        <div className="absolute left-[52.6%] top-[64%] -translate-x-1/2 -translate-y-1/2 text-[clamp(1rem,1.8vw,2rem)] text-slate-900">
          {level || "L3"}
        </div>

        <div className="absolute left-[24.5%] top-[81.2%] -translate-y-1/2 text-[clamp(0.65rem,1vw,1.05rem)] text-slate-800">
          {formatIssueDate(issueDate)}
        </div>
        <div className="absolute right-[6.2%] top-[59.5%] flex h-[14.5%] w-[10.5%] items-center justify-center rounded-xl bg-white/95 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-md">
          QR Code
        </div>
      </div>
    </div>
  );
}

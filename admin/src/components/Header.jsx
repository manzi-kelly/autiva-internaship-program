import { useState } from "react";
import { FiDollarSign } from "react-icons/fi";

export default function Header({ title, totalMoney }) {
  const [showMoney, setShowMoney] = useState(false);

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage the Autiva Tech Internship System professionally.
        </p>
      </div>

      <button
        onClick={() => setShowMoney((prev) => !prev)}
        className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-lg transition ${
          showMoney ? "min-w-[170px] justify-center" : "w-12 justify-center"
        }`}
      >
        <FiDollarSign className="text-emerald-600" />
        <span className="font-semibold text-slate-800">
          {showMoney ? `${totalMoney.toLocaleString()} RWF` : "M"}
        </span>
      </button>
    </div>
  );
}
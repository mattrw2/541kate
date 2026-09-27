// Every group is listed on the join screen. Public groups can be joined straight
// from the list; private ones need their shared password.
export const VisibilityChoice = ({ isPublic, onChange, disabled = false }) => {
  const option = (value, label) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(value)}
      className={`flex-1 text-sm rounded-lg px-3 py-1.5 border disabled:opacity-50 ${
        isPublic === value ? "bg-yellow-600 text-white border-yellow-600" : "text-yellow-700 border-yellow-600 hover:bg-yellow-50"
      }`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex gap-2">
      {option(true, "Public")}
      {option(false, "Private")}
    </div>
  )
}

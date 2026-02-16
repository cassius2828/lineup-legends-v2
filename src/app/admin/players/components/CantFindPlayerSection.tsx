import Link from "next/link";

interface CantFindPlayerSectionProps {
  showRequestForm: boolean;
  setShowRequestForm: (show: boolean) => void;
  requestSuccess: boolean;
  requestError: string;
  requestFirstName: string;
  setRequestFirstName: (firstName: string) => void;
  requestLastName: string;
  setRequestLastName: (lastName: string) => void;
  requestValue: number;
  setRequestValue: (value: number) => void;
  createRequest: { isPending: boolean };
  handleRequestSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setRequestError: (error: string) => void;
}

export const CantFindPlayerSection = ({
  showRequestForm,
  setShowRequestForm,
  requestSuccess,
  requestError,
  requestFirstName,
  setRequestFirstName,
  requestLastName,
  setRequestLastName,
  requestValue,
  setRequestValue,
  createRequest,
  handleRequestSubmit,
  setRequestError,
}: CantFindPlayerSectionProps) => {
  return (
    <div className="mt-12 rounded-lg border border-foreground/10 bg-foreground/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Can&apos;t find the player you&apos;re looking for?
          </h2>
          <p className="mt-1 text-sm text-foreground/60">
            Submit a request to add a new player to the database
          </p>
        </div>
        {!showRequestForm && (
          <button
            onClick={() => setShowRequestForm(true)}
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2 font-semibold text-black transition-colors"
          >
            Request Player
          </button>
        )}
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <form onSubmit={handleRequestSubmit} className="mt-6 space-y-4">
          {/* Success Message */}
          {requestSuccess && (
            <div className="rounded-lg bg-gold-500/20 p-3 text-sm text-gold-300">
              Player request submitted successfully!
            </div>
          )}

          {/* Error Message */}
          {requestError && (
            <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-400">
              {requestError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div>
              <label
                htmlFor="requestFirstName"
                className="mb-2 block text-sm font-medium text-foreground/80"
              >
                First Name
              </label>
              <input
                type="text"
                id="requestFirstName"
                value={requestFirstName}
                onChange={(e) => setRequestFirstName(e.target.value)}
                required
                placeholder="e.g. LeBron"
                className="focus:border-gold focus:ring-gold w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:ring-1 focus:outline-none"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="requestLastName"
                className="mb-2 block text-sm font-medium text-foreground/80"
              >
                Last Name
              </label>
              <input
                type="text"
                id="requestLastName"
                value={requestLastName}
                onChange={(e) => setRequestLastName(e.target.value)}
                required
                placeholder="e.g. James"
                className="focus:border-gold focus:ring-gold w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          {/* Suggested Value */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">
              Suggested Value ($1-$5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRequestValue(v)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    requestValue === v
                      ? "bg-gold text-black"
                      : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createRequest.isPending}
              className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRequestForm(false);
                setRequestError("");
              }}
              className="rounded-lg bg-foreground/10 px-6 py-2 font-medium text-foreground transition-colors hover:bg-foreground/20"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Link to view all requests (admin) */}
      <div className="mt-4 border-t border-foreground/10 pt-4">
        <Link
          href="/admin/requested"
          className="text-sm text-foreground/60 hover:text-foreground/80"
        >
          View all player requests →
        </Link>
      </div>
    </div>
  );
};
